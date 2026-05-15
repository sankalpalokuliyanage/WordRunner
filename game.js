const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbydfsIkChPLVPpIuRG1N9ydr7jVFMSo_k0KT8E2V_yikxz8dou_rl1BTXyp3vRBGdDbwA/exec';

let currentUser = null, currentScore = 0, dataset = [];
let selectedEn = null, roundCount = 0;
let oxyTimer = null, oxyLevel = 100;

// Combo System Variables
let lastMatchTime = 0;
let comboCount = 0;

// --- AUTH & THEME (Same as before) ---
async function handleAuth(type) {
    const user = document.getElementById('auth-user').value.trim();
    const pass = document.getElementById('auth-pass').value.trim();
    if(!user || !pass) return alert("Fill all fields!");
    try {
        if(type === 'login') {
            const res = await fetch(`${SCRIPT_URL}?action=login&username=${user}&password=${pass}`);
            const data = await res.json();
            if(data.status === 'success') {
                currentUser = user; currentScore = parseInt(data.totalScore);
                document.getElementById('auth-screen').classList.add('hidden');
                document.getElementById('hud').classList.remove('hidden');
                document.getElementById('game-area').style.display = 'flex'; // Direct to area for demo
                document.getElementById('user-display').innerText = "PILOT: " + currentUser.toUpperCase();
                document.getElementById('score-display').innerText = currentScore;
                startMission('Level 1'); 
            }
        } else {
            // Signup logic...
        }
    } catch (e) { alert("Comm Error!"); }
}

async function startMission(level) {
    const res = await fetch(`${SCRIPT_URL}?action=getHistory&level=${level}`);
    dataset = await res.json();
    if(dataset.length > 0) {
        renderBubbles();
        startOxygen();
    }
}

function startOxygen() {
    oxyLevel = 100; clearInterval(oxyTimer);
    oxyTimer = setInterval(() => {
        oxyLevel -= 0.33; // 30s approx
        document.getElementById('oxygen-bar').style.width = oxyLevel + "%";
        if(oxyLevel <= 0) { clearInterval(oxyTimer); alert("OXYGEN DEPLETED!"); exitGame(); }
    }, 100);
}

function renderBubbles() {
    const enList = document.getElementById('en-list'), koList = document.getElementById('ko-list');
    enList.innerHTML = ""; koList.innerHTML = "";
    selectedEn = null; roundCount = 0;

    let limit = Math.min(dataset.length, 5); // 5 bubbles per side looks better on mobile
    let roundData = [...dataset].sort(() => 0.5 - Math.random()).slice(0, limit);
    let enSide = [...roundData].sort(() => 0.5 - Math.random());
    let koSide = [...roundData].sort(() => 0.5 - Math.random());

    enSide.forEach((d, i) => {
        let b = createBubble(d.english, d.korean, 'en', i);
        enList.appendChild(b);
    });

    koSide.forEach((d, i) => {
        let b = createBubble(d.korean, d.korean, 'ko', i);
        koList.appendChild(b);
    });
}

function createBubble(text, id, type, index) {
    let b = document.createElement('div');
    b.className = 'bubble';
    b.innerText = text;
    b.style.animationDelay = (index * 0.5) + "s"; // Each bubble floats differently

    b.onclick = () => {
        if(type === 'en') {
            document.querySelectorAll('#en-list .bubble').forEach(el => el.classList.remove('active'));
            b.classList.add('active');
            selectedEn = { b, id };
        } else {
            if(!selectedEn) return;
            if(selectedEn.id === id) {
                handleMatch(selectedEn.b, b);
            } else {
                b.classList.add('wrong');
                setTimeout(() => b.classList.remove('wrong'), 400);
                comboCount = 0; // Reset combo on mistake
            }
        }
    };
    return b;
}

function handleMatch(b1, b2) {
    createParticles(b1); createParticles(b2);
    b1.classList.add('correct'); b2.classList.add('correct');
    
    // Combo Logic
    let now = Date.now();
    if(now - lastMatchTime < 2000) { // 2 seconds window for combo
        comboCount++;
        showCombo();
    } else {
        comboCount = 1;
    }
    lastMatchTime = now;

    let points = 10 * comboCount;
    currentScore += points;
    document.getElementById('score-display').innerText = currentScore;
    
    roundCount++;
    if(document.querySelectorAll('.bubble:not(.correct)').length === 0) {
        oxyLevel = 100;
        syncData();
        setTimeout(renderBubbles, 800);
    }
}

function createParticles(el) {
    const rect = el.getBoundingClientRect();
    for(let i=0; i<10; i++) {
        let p = document.createElement('div');
        p.className = 'particle';
        p.style.left = (rect.left + rect.width/2) + "px";
        p.style.top = (rect.top + rect.height/2) + "px";
        p.style.setProperty('--x', (Math.random()*100 - 50) + "px");
        p.style.setProperty('--y', (Math.random()*100 - 50) + "px");
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 600);
    }
}

function showCombo() {
    let el = document.getElementById('combo-text');
    if(comboCount > 1) {
        el.innerText = `COMBO X${comboCount}`;
        el.style.opacity = "1";
        el.style.transform = "scale(1.2)";
        setTimeout(() => { el.style.opacity = "0"; el.style.transform = "scale(1)"; }, 1000);
    }
}

function syncData() {
    fetch(SCRIPT_URL, { method: 'POST', body: new URLSearchParams({ action: 'updateUser', username: currentUser, newScore: currentScore }), mode: 'no-cors' });
}

function exitGame() { clearInterval(oxyTimer); location.reload(); }
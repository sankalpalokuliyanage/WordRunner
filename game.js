const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbydfsIkChPLVPpIuRG1N9ydr7jVFMSo_k0KT8E2V_yikxz8dou_rl1BTXyp3vRBGdDbwA/exec';

let currentUser = null, currentScore = 0, currentTheme = 'dark';
let dataset = [], selectedEn = null, roundCount = 0;
let oxyTimer = null, oxyLevel = 100;
let lastMatchTime = 0, combo = 0;

async function handleAuth(type) {
    const user = document.getElementById('auth-user').value.trim();
    const pass = document.getElementById('auth-pass').value.trim();
    if(!user || !pass) return alert("Please enter both username and password!");
    try {
        if(type === 'login') {
            const res = await fetch(`${SCRIPT_URL}?action=login&username=${user}&password=${pass}`);
            const data = await res.json();
            if(data.status === 'success') {
                currentUser = user; 
                currentScore = parseInt(data.totalScore);
                currentTheme = data.theme || 'dark';
                changeTheme(currentTheme);
                initDashboard(data.rank);
            } else alert("Login failed!");
        } else {
            const res = await fetch(SCRIPT_URL, { method: 'POST', body: new URLSearchParams({ action: 'signup', username: user, password: pass, theme: 'dark' }), mode: 'cors' });
            const result = await res.text();
            if(result === "Username Exists") alert("Username taken!");
            else alert("Account created! Please login.");
        }
    } catch (e) { alert("Comm error!"); }
}

function initDashboard(rank) {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('dashboard').style.display = 'flex';
    document.getElementById('user-display').innerText = "PILOT: " + currentUser.toUpperCase();
    document.getElementById('score-display').innerText = currentScore;
    document.getElementById('rank-display').innerText = rank.toUpperCase();
}

function changeTheme(theme) {
    document.body.className = "theme-" + theme;
    currentTheme = theme;
    if(currentUser) fetch(SCRIPT_URL, { method: 'POST', body: new URLSearchParams({ action: 'updateUser', username: currentUser, theme: theme }), mode: 'no-cors' });
}

async function startMission(level) {
    document.getElementById('dashboard').style.display = 'none';
    const res = await fetch(`${SCRIPT_URL}?action=getHistory&level=${level}`);
    dataset = await res.json();
    if(dataset.length > 0) {
        document.getElementById('game-area').style.display = 'flex';
        renderBoard();
        startOxygen();
    } else { alert("Level not ready!"); exitGame(); }
}

function startOxygen() {
    oxyLevel = 100; clearInterval(oxyTimer);
    oxyTimer = setInterval(() => {
        oxyLevel -= 0.33;
        document.getElementById('oxygen-bar').style.width = oxyLevel + "%";
        if(oxyLevel <= 0) { clearInterval(oxyTimer); alert("OXYGEN DEPLETED!"); exitGame(); }
    }, 100);
}

function renderBoard() {
    const enList = document.getElementById('en-list'), koList = document.getElementById('ko-list');
    enList.innerHTML = ""; koList.innerHTML = "";
    selectedEn = null; roundCount = 0;

    let limit = Math.min(dataset.length, 5);
    let roundData = [...dataset].sort(() => 0.5 - Math.random()).slice(0, limit);
    let enSide = [...roundData].sort(() => 0.5 - Math.random());
    let koSide = [...roundData].sort(() => 0.5 - Math.random());

    enSide.forEach((d, i) => {
        let b = document.createElement('div'); b.className = 'bubble'; b.innerText = d.english;
        b.style.animationDelay = (i * 0.4) + "s";
        b.onclick = () => {
            document.querySelectorAll('#en-list .bubble').forEach(el => el.classList.remove('active'));
            b.classList.add('active');
            selectedEn = { b, id: d.korean };
        };
        enList.appendChild(b);
    });

    koSide.forEach((d, i) => {
        let b = document.createElement('div'); b.className = 'bubble'; b.innerText = d.korean;
        b.style.animationDelay = (i * 0.4 + 0.2) + "s";
        b.onclick = () => {
            if(!selectedEn) return;
            if(selectedEn.id === d.korean) {
                popBubble(selectedEn.b); popBubble(b);
                handleMatch();
                if(++roundCount === limit) { syncData(); oxyLevel = 100; setTimeout(renderBoard, 800); }
            } else { b.classList.add('wrong'); oxyLevel -= 10; combo = 0; setTimeout(() => b.classList.remove('wrong'), 400); }
        };
        koList.appendChild(b);
    });
}

function handleMatch() {
    let now = Date.now();
    if(now - lastMatchTime < 2000) { combo++; showCombo(); } else { combo = 1; }
    lastMatchTime = now;
    currentScore += (10 * combo);
    document.getElementById('score-display').innerText = currentScore;
    oxyLevel = Math.min(100, oxyLevel + 5);
}

function popBubble(el) {
    const rect = el.getBoundingClientRect();
    for(let i=0; i<8; i++) {
        let p = document.createElement('div'); p.className = 'particle';
        p.style.left = (rect.left + 40) + "px"; p.style.top = (rect.top + 40) + "px";
        document.body.appendChild(p);
        let vx = (Math.random() - 0.5) * 100, vy = (Math.random() - 0.5) * 100;
        p.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${vx}px, ${vy}px)`, opacity: 0 }], { duration: 600 });
        setTimeout(() => p.remove(), 600);
    }
    el.classList.add('correct');
}

function showCombo() {
    let el = document.getElementById('combo-text');
    if(combo > 1) {
        el.innerText = `COMBO X${combo}`; el.style.opacity = 1;
        setTimeout(() => el.style.opacity = 0, 800);
    }
}

function syncData() { fetch(SCRIPT_URL, { method: 'POST', body: new URLSearchParams({ action: 'updateUser', username: currentUser, newScore: currentScore }), mode: 'no-cors' }); }
function exitGame() { clearInterval(oxyTimer); document.getElementById('game-area').style.display = 'none'; document.getElementById('dashboard').style.display = 'flex'; }
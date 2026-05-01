const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzDcdTMXOmcNWlef_Xy8P3UhPW2vRdrasEzLa7Jyf5BRe6ocZq22KgfqIfEG7TCPtQt/exec';

let currentUser = null, currentScore = 0, dataset = [];
let selectedEn = null, roundCorrectCount = 0;
let oxygenInterval = null, oxygenLevel = 100;

async function handleAuth(type) {
    const user = document.getElementById('auth-user').value.trim();
    const pass = document.getElementById('auth-pass').value.trim();
    if(!user || !pass) return;
    try {
        if(type === 'login') {
            const res = await fetch(`${SCRIPT_URL}?action=login&username=${user}&password=${pass}`);
            const data = await res.json();
            if(data.status === 'success') {
                currentUser = user; currentScore = parseInt(data.totalScore);
                showLevelScreen();
            } else alert("Access Denied!");
        } else {
            await fetch(SCRIPT_URL, { method: 'POST', body: new URLSearchParams({ action: 'signup', username: user, password: pass }), mode: 'no-cors' });
            alert("Registered! Now Login.");
        }
    } catch (e) { alert("Comm Error!"); }
}

function showLevelScreen() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('level-screen').classList.remove('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('user-display').innerText = "PILOT: " + currentUser.toUpperCase();
    document.getElementById('total-score-display').innerText = currentScore;
}

async function startMission(level) {
    document.getElementById('level-screen').classList.add('hidden');
    const res = await fetch(`${SCRIPT_URL}?action=getHistory&level=${level}`);
    dataset = await res.json();
    if(dataset.length > 0) {
        document.getElementById('game-area').style.display = 'flex';
        renderBoard();
        startOxygenTimer();
    }
}

function startOxygenTimer() {
    oxygenLevel = 100;
    clearInterval(oxygenInterval);
    oxygenInterval = setInterval(() => {
        oxygenLevel -= 0.5; // කාලය අඩු වන වේගය
        document.getElementById('oxygen-fill').style.width = oxygenLevel + "%";
        if(oxygenLevel <= 0) {
            clearInterval(oxygenInterval);
            alert("OXYGEN DEPLETED! MISSION FAILED.");
            backToMenu();
        }
    }, 1000);
}

function renderBoard() {
    const enList = document.getElementById('en-list'), koList = document.getElementById('ko-list');
    enList.innerHTML = ""; koList.innerHTML = "";
    let limit = Math.min(dataset.length, 6);
    let roundData = [...dataset].sort(() => 0.5 - Math.random()).slice(0, limit);
    let enSide = [...roundData].sort(() => 0.5 - Math.random());
    let koSide = [...roundData].sort(() => 0.5 - Math.random());

    enSide.forEach(d => {
        let btn = document.createElement('div'); btn.className = 'word-node'; btn.innerText = d.english;
        btn.onclick = () => { document.querySelectorAll('#en-list .word-node').forEach(b => b.classList.remove('active')); btn.classList.add('active'); selectedEn = { btn, id: d.korean }; };
        enList.appendChild(btn);
    });

    koSide.forEach(d => {
        let btn = document.createElement('div'); btn.className = 'word-node'; btn.innerText = d.korean;
        btn.onclick = () => {
            if(!selectedEn) return;
            if(selectedEn.id === d.korean) {
                btn.classList.add('correct'); selectedEn.btn.classList.add('correct');
                roundCorrectCount++; currentScore += 10; oxygenLevel = Math.min(100, oxygenLevel + 5); // හරි නම් ඔක්සිජන් ටිකක් ලැබෙනවා
                document.getElementById('total-score-display').innerText = currentScore;
                if(roundCorrectCount === limit) { clearInterval(oxygenInterval); setTimeout(renderBoard, 1000); }
            } else { btn.classList.add('wrong'); oxygenLevel -= 10; } // වැරදි නම් ඔක්සිජන් ගොඩක් අඩු වෙනවා
        };
        koList.appendChild(btn);
    });
}

function backToMenu() {
    clearInterval(oxygenInterval);
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('level-screen').classList.remove('hidden');
}
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbydfsIkChPLVPpIuRG1N9ydr7jVFMSo_k0KT8E2V_yikxz8dou_rl1BTXyp3vRBGdDbwA/exec';

let currentUser = null, currentScore = 0, currentTheme = 'dark';
let dataset = [], selectedEn = null, roundCount = 0;
let oxyTimer = null, oxyLevel = 100;

// --- AUTHENTICATION ---
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
            } else {
                alert("Login failed! Invalid credentials.");
            }
        } else {
            const res = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: new URLSearchParams({ action: 'signup', username: user, password: pass, theme: 'dark' }),
                mode: 'cors'
            });
            const result = await res.text();
            if(result === "Username Exists") alert("This username is already taken! Try another one.");
            else alert("Account created successfully! You can now login.");
        }
    } catch (e) { alert("Server communication error! Check your internet."); }
}

function initDashboard(rank) {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('dashboard').style.display = 'flex';
    document.getElementById('user-display').innerText = "PILOT: " + currentUser.toUpperCase();
    document.getElementById('score-display').innerText = currentScore;
    document.getElementById('rank-display').innerText = rank.toUpperCase();
}

// --- THEME ENGINE ---
function changeTheme(theme) {
    document.body.className = "theme-" + theme;
    currentTheme = theme;
    if(currentUser) {
        fetch(SCRIPT_URL, {
            method: 'POST',
            body: new URLSearchParams({ action: 'updateUser', username: currentUser, theme: theme }),
            mode: 'no-cors'
        });
    }
}

// --- MISSION LOGIC ---
async function startMission(level) {
    document.getElementById('dashboard').style.display = 'none';
    const res = await fetch(`${SCRIPT_URL}?action=getHistory&level=${level}`);
    dataset = await res.json();
    
    if(dataset.length > 0) {
        document.getElementById('game-area').style.display = 'flex';
        renderBoard();
        startOxygen();
    } else {
        alert("Sector data is empty! Please add words first.");
        exitGame();
    }
}

function startOxygen() {
    oxyLevel = 100;
    clearInterval(oxyTimer);
    oxyTimer = setInterval(() => {
        oxyLevel -= (100 / 30) / 10; // 30 Seconds
        document.getElementById('oxygen-bar').style.width = oxyLevel + "%";
        if(oxyLevel <= 0) {
            clearInterval(oxyTimer);
            alert("MISSION FAILED! Oxygen depleted.");
            exitGame();
        }
    }, 100);
}

function renderBoard() {
    const enList = document.getElementById('en-list'), koList = document.getElementById('ko-list');
    enList.innerHTML = ""; koList.innerHTML = "";
    selectedEn = null; roundCount = 0;

    let limit = Math.min(dataset.length, 6);
    let roundData = [...dataset].sort(() => 0.5 - Math.random()).slice(0, limit);
    let enSide = [...roundData].sort(() => 0.5 - Math.random());
    let koSide = [...roundData].sort(() => 0.5 - Math.random());

    enSide.forEach(d => {
        let node = document.createElement('div');
        node.className = 'node';
        node.innerText = d.english;
        node.onclick = () => {
            document.querySelectorAll('#en-list .node').forEach(n => n.classList.remove('active'));
            node.classList.add('active');
            selectedEn = { node, id: d.korean };
        };
        enList.appendChild(node);
    });

    koSide.forEach(d => {
        let node = document.createElement('div');
        node.className = 'node';
        node.innerText = d.korean;
        node.onclick = () => {
            if(!selectedEn) return;
            if(selectedEn.id === d.korean) {
                node.classList.add('correct');
                selectedEn.node.classList.add('correct');
                currentScore += 10;
                roundCount++;
                oxyLevel = Math.min(100, oxyLevel + 5); // Bonus oxygen
                document.getElementById('score-display').innerText = currentScore;
                if(roundCount === limit) {
                    syncData();
                    setTimeout(renderBoard, 800);
                }
            } else {
                node.classList.add('wrong');
                oxyLevel -= 10; // Penalty
                setTimeout(() => node.classList.remove('wrong'), 400);
            }
        };
        koList.appendChild(node);
    });
}

function syncData() {
    fetch(SCRIPT_URL, {
        method: 'POST',
        body: new URLSearchParams({ action: 'updateUser', username: currentUser, newScore: currentScore }),
        mode: 'no-cors'
    });
}

function exitGame() {
    clearInterval(oxyTimer);
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
}
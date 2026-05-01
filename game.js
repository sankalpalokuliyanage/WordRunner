const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzDcdTMXOmcNWlef_Xy8P3UhPW2vRdrasEzLa7Jyf5BRe6ocZq22KgfqIfEG7TCPtQt/exec';

let currentUser = null, currentScore = 0, dataset = [];
let selectedEn = null, roundCorrectCount = 0;
let oxygenInterval = null, oxygenLevel = 100;

// --- AUTHENTICATION ---
async function handleAuth(type) {
    const user = document.getElementById('auth-user').value.trim();
    const pass = document.getElementById('auth-pass').value.trim();
    if(!user || !pass) return alert("Fill all fields!");
    
    try {
        if(type === 'login') {
            const res = await fetch(`${SCRIPT_URL}?action=login&username=${user}&password=${pass}`);
            const data = await res.json();
            if(data.status === 'success') {
                currentUser = user; 
                currentScore = parseInt(data.totalScore);
                showLevelScreen();
            } else alert("Access Denied!");
        } else {
            await fetch(SCRIPT_URL, { 
                method: 'POST', 
                body: new URLSearchParams({ action: 'signup', username: user, password: pass }), 
                mode: 'no-cors' 
            });
            alert("Registered Successfully! Now Login.");
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

// --- MISSION LOGIC ---
async function startMission(level) {
    document.getElementById('level-screen').classList.add('hidden');
    const res = await fetch(`${SCRIPT_URL}?action=getHistory&level=${level}`);
    dataset = await res.json();
    if(dataset.length > 0) {
        document.getElementById('game-area').style.display = 'flex';
        renderBoard();
        startOxygenTimer();
    } else {
        alert("Sector data empty!");
        backToMenu();
    }
}

// තත්පර 30ක කාල සීමාව (Time Limit)
function startOxygenTimer() {
    oxygenLevel = 100;
    clearInterval(oxygenInterval);
    // තත්පර 30කින් ඉවර වෙන්න නම් (100 / 30 = 3.33 per second)
    oxygenInterval = setInterval(() => {
        oxygenLevel -= (100 / 30) / 10; // සෑම මිලි තත්පර 100කටම වරක් අඩුවේ
        document.getElementById('oxygen-fill').style.width = oxygenLevel + "%";
        
        if(oxygenLevel <= 0) {
            clearInterval(oxygenInterval);
            alert("OXYGEN DEPLETED! MISSION FAILED.");
            backToMenu();
        }
    }, 100);
}

function renderBoard() {
    const enList = document.getElementById('en-list'), koList = document.getElementById('ko-list');
    enList.innerHTML = ""; koList.innerHTML = "";
    selectedEn = null;
    roundCorrectCount = 0;

    let limit = Math.min(dataset.length, 6);
    let roundData = [...dataset].sort(() => 0.5 - Math.random()).slice(0, limit);
    let enSide = [...roundData].sort(() => 0.5 - Math.random());
    let koSide = [...roundData].sort(() => 0.5 - Math.random());

    enSide.forEach(d => {
        let btn = document.createElement('div'); btn.className = 'word-node'; btn.innerText = d.english;
        btn.onclick = () => { 
            document.querySelectorAll('#en-list .word-node').forEach(b => b.classList.remove('active')); 
            btn.classList.add('active'); 
            selectedEn = { btn, id: d.korean }; 
        };
        enList.appendChild(btn);
    });

    koSide.forEach(d => {
        let btn = document.createElement('div'); btn.className = 'word-node'; btn.innerText = d.korean;
        btn.onclick = () => {
            if(!selectedEn) return;
            if(selectedEn.id === d.korean) {
                btn.classList.add('correct'); 
                selectedEn.btn.classList.add('correct');
                roundCorrectCount++; 
                currentScore += 10; 
                oxygenLevel = Math.min(100, oxygenLevel + 5); // Bonus oxygen
                document.getElementById('total-score-display').innerText = currentScore;
                
                if(roundCorrectCount === limit) { 
                    syncScore(); // ලකුණු Sheet එකට යැවීම
                    setTimeout(renderBoard, 1000); 
                }
            } else { 
                btn.classList.add('wrong'); 
                oxygenLevel -= 10; // Penalty oxygen
            }
        };
        koList.appendChild(btn);
    });
}

// --- SCORE SYNC ---
function syncScore() {
    fetch(`${SCRIPT_URL}`, {
        method: 'POST',
        body: new URLSearchParams({ 
            action: 'updateScore', 
            username: currentUser, 
            newScore: currentScore 
        }),
        mode: 'no-cors'
    });
}

function backToMenu() {
    clearInterval(oxygenInterval);
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('level-screen').classList.remove('hidden');
}
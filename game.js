const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzDcdTMXOmcNWlef_Xy8P3UhPW2vRdrasEzLa7Jyf5BRe6ocZq22KgfqIfEG7TCPtQt/exec';


let currentUser = null;
let currentScore = 0;
let currentRank = "";
let dataset = [];
let selectedEn = null;
let roundCorrectCount = 0;

async function handleAuth(type) {
    const user = document.getElementById('auth-user').value.trim();
    const pass = document.getElementById('auth-pass').value.trim();
    if(!user || !pass) return alert("Fill all fields!");
    showLoader(true);
    try {
        if(type === 'login') {
            const res = await fetch(`${SCRIPT_URL}?action=login&username=${user}&password=${pass}`);
            const data = await res.json();
            if(data.status === 'success') {
                loginUser(user, data.totalScore, data.rank);
            } else { alert("Invalid Credentials!"); }
        } else {
            await fetch(`${SCRIPT_URL}`, { method: 'POST', body: new URLSearchParams({ action: 'signup', username: user, password: pass }), mode: 'no-cors' });
            alert("Account Created! Please Login.");
        }
    } catch (e) { alert("Auth Error!"); }
    showLoader(false);
}

function loginUser(user, score, rank) {
    currentUser = user;
    currentScore = parseInt(score);
    currentRank = rank;
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('level-screen').style.display = 'flex';
    updateUI();
}

function updateUI() {
    document.getElementById('user-display').innerText = currentUser.toUpperCase();
    document.getElementById('rank-display').innerText = currentRank;
    document.getElementById('total-score-display').innerText = currentScore;
}

async function startMission(level) {
    document.getElementById('level-screen').style.display = 'none';
    showLoader(true);
    try {
        const res = await fetch(`${SCRIPT_URL}?action=getHistory&level=${level}`);
        dataset = await res.json();
        if(dataset.length > 0) {
            document.getElementById('game-area').style.display = 'flex';
            renderBoard();
        } else { alert("No data!"); backToMenu(); }
    } catch (e) { alert("Fetch Error!"); }
    showLoader(false);
}

function renderBoard() {
    const enList = document.getElementById('en-list');
    const koList = document.getElementById('ko-list');
    enList.innerHTML = ""; koList.innerHTML = "";
    selectedEn = null; roundCorrectCount = 0;

    let limit = Math.min(dataset.length, 6);
    let roundData = [...dataset].sort(() => 0.5 - Math.random()).slice(0, limit);
    let enSide = [...roundData].sort(() => 0.5 - Math.random());
    let koSide = [...roundData].sort(() => 0.5 - Math.random());

    enSide.forEach(d => {
        let btn = document.createElement('div');
        btn.className = 'word-btn';
        btn.innerText = d.english;
        btn.onclick = () => {
            document.querySelectorAll('#en-list .word-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedEn = { btn, id: d.korean };
        };
        enList.appendChild(btn);
    });

    koSide.forEach(d => {
        let btn = document.createElement('div');
        btn.className = 'word-btn';
        btn.innerText = d.korean;
        btn.onclick = () => {
            if(!selectedEn) return;
            if(selectedEn.id === d.korean) {
                btn.classList.add('correct');
                selectedEn.btn.classList.add('correct');
                roundCorrectCount++;
                currentScore += 10;
                if(roundCorrectCount === limit) finishRound();
            } else {
                btn.classList.add('wrong');
                setTimeout(() => btn.classList.remove('wrong'), 400);
            }
        };
        koList.appendChild(btn);
    });
}

function finishRound() {
    updateUI();
    document.getElementById('round-score-display').innerText = "+" + (roundCorrectCount * 10);
    document.getElementById('score-modal').style.display = 'flex';
    fetch(`${SCRIPT_URL}`, { method: 'POST', body: new URLSearchParams({ action: 'updateScore', username: currentUser, newScore: currentScore }), mode: 'no-cors' });
}

function nextRound() { document.getElementById('score-modal').style.display = 'none'; renderBoard(); }
function backToMenu() {
    document.getElementById('score-modal').style.display = 'none';
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('level-screen').style.display = 'flex';
}
function showLoader(show) { document.getElementById('loader').style.display = show ? 'flex' : 'none'; }
function logout() { location.reload(); }
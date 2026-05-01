const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxenP37pvmwucpQ2LFPk3QeTaqSr9FeZtPnBMkVn-7gXngAuip8cyxbN3zKObZ0v1i6_A/exec';

let dataset = [];
let selectedEn = null;
let totalScore = 0;
let roundCorrectCount = 0;
let selectedLevel = "";

// Level එක තෝරාගත් පසු ගේම් එක ආරම්භ කිරීම
async function startGame(level) {
    selectedLevel = level;
    document.getElementById('level-screen').style.display = 'none';
    document.getElementById('loader').style.display = 'flex';
    document.getElementById('current-lvl-display').innerText = level.toUpperCase();
    await fetchWords();
}

async function fetchWords() {
    try {
        // තෝරාගත් level එක parameter එකක් ලෙස එවයි
        const res = await fetch(`${SCRIPT_URL}?action=getHistory&level=${selectedLevel}`);
        dataset = await res.json();
        
        if(dataset && dataset.length > 0) {
            document.getElementById('loader').style.display = 'none';
            renderMatchBoard();
        } else {
            alert("No words found for this level!");
            location.reload();
        }
    } catch (e) { 
        console.error(e);
        alert("Connection Error!");
    }
}

function renderMatchBoard() {
    const enList = document.getElementById('en-list');
    const koList = document.getElementById('ko-list');
    enList.innerHTML = ""; koList.innerHTML = "";
    selectedEn = null;
    roundCorrectCount = 0;

    let roundData = [...dataset].sort(() => 0.5 - Math.random()).slice(0, 6);
    let enSide = [...roundData].sort(() => 0.5 - Math.random());
    let koSide = [...roundData].sort(() => 0.5 - Math.random());

    enSide.forEach(data => {
        let btn = document.createElement('div');
        btn.className = 'word-btn';
        btn.innerText = data.english;
        btn.onclick = () => {
            document.querySelectorAll('#en-list .word-btn').forEach(b => b.classList.remove('active'));
            selectedEn = { btn, matchId: data.korean };
            btn.classList.add('active');
        };
        enList.appendChild(btn);
    });

    koSide.forEach(data => {
        let btn = document.createElement('div');
        btn.className = 'word-btn';
        btn.innerText = data.korean;
        btn.onclick = () => handleMatch(btn, data.korean);
        koList.appendChild(btn);
    });
}

function handleMatch(btn, koText) {
    if (!selectedEn) return;

    if (selectedEn.matchId === koText) {
        btn.classList.add('correct');
        selectedEn.btn.classList.add('correct');
        totalScore += 10;
        roundCorrectCount++;
        document.getElementById('total-score').innerText = totalScore;
        selectedEn = null;
        if (roundCorrectCount === 6) setTimeout(showScoreModal, 500);
    } else {
        btn.classList.add('wrong');
        setTimeout(() => btn.classList.remove('wrong'), 400);
    }
}

function showScoreModal() {
    document.getElementById('round-score').innerText = totalScore;
    document.getElementById('score-modal').style.display = "flex";
}

function nextRound() {
    document.getElementById('score-modal').style.display = "none";
    renderMatchBoard();
}
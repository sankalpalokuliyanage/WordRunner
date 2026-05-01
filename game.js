const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxenP37pvmwucpQ2LFPk3QeTaqSr9FeZtPnBMkVn-7gXngAuip8cyxbN3zKObZ0v1i6_A/exec';

let dataset = [];
let selectedEn = null;
let totalScore = 0;
let roundCorrectCount = 0;

async function init() {
    await fetchWords();
}

async function fetchWords() {
    try {
        const res = await fetch(`${SCRIPT_URL}?action=getHistory&level=Level 1`);
        dataset = await res.json();
        if(dataset.length > 0) {
            document.getElementById('loader').style.display = 'none';
            renderMatchBoard();
        }
    } catch (e) { console.error(e); }
}

function renderMatchBoard() {
    const enList = document.getElementById('en-list');
    const koList = document.getElementById('ko-list');
    enList.innerHTML = ""; koList.innerHTML = "";
    selectedEn = null;
    roundCorrectCount = 0;

    // වචන 6ක් තෝරා ගැනීම
    let roundData = dataset.sort(() => 0.5 - Math.random()).slice(0, 6);
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
        
        // වටය අවසන් දැයි පරීක්ෂා කිරීම (වචන 6ම ඉවර නම්)
        if (roundCorrectCount === 6) {
            showScoreModal();
        }
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

window.onload = init;
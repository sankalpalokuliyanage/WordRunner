const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxenP37pvmwucpQ2LFPk3QeTaqSr9FeZtPnBMkVn-7gXngAuip8cyxbN3zKObZ0v1i6_A/exec';

let dataset = [];
let selectedEn = null;
let score = 0;
let totalAttempts = 0;
let correctMatches = 0;
let currentRank = "BEGINNER";

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
    totalAttempts++;

    if (selectedEn.matchId === koText) {
        btn.classList.add('correct');
        selectedEn.btn.classList.add('correct');
        score += 10;
        correctMatches++;
        updateStats();
        selectedEn = null;
        checkLevelUp();
        checkNextRound();
    } else {
        btn.classList.add('wrong');
        score = Math.max(0, score - 2); // වැරදුණොත් ලකුණු 2ක් අඩු වේ
        updateStats();
        setTimeout(() => btn.classList.remove('wrong'), 400);
    }
}

function updateStats() {
    document.getElementById('score').innerText = score;
    let acc = Math.round((correctMatches / totalAttempts) * 100);
    document.getElementById('accuracy').innerText = acc + "%";
}

function checkLevelUp() {
    let newRank = "BEGINNER";
    if (score >= 500) newRank = "MASTER";
    else if (score >= 300) newRank = "EXPERT";
    else if (score >= 150) newRank = "INTERMEDIATE";
    else if (score >= 50) newRank = "AMATEUR";

    if (newRank !== currentRank) {
        currentRank = newRank;
        showRankModal(newRank);
    }
    document.getElementById('rank-text').innerText = currentRank;
}

function showRankModal(rank) {
    document.getElementById('modal-rank').innerText = rank + "!";
    document.getElementById('modal-msg').innerText = "ඔබේ TOPIK මට්ටම දැන් " + rank + " දක්වා ඉහළ ගියා.";
    document.getElementById('rank-modal').style.display = "block";
}

function closeModal() {
    document.getElementById('rank-modal').style.display = "none";
}

function checkNextRound() {
    const rem = Array.from(document.querySelectorAll('.word-btn')).filter(b => !b.classList.contains('correct'));
    if (rem.length === 0) setTimeout(renderMatchBoard, 600);
}

window.onload = init;
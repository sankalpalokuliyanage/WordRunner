const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzWDjcEsZA0b77s54fhOArKapvv2aHloqI4ZARf-ULFEKAs6BZjZ5DTjKQmmpQvhmOtGw/exec';

let dataset = [];
let selectedEn = null;
let totalScore = 0;
let roundCorrectCount = 0;
let selectedLevel = "";

async function startGame(level) {
    selectedLevel = level;
    document.getElementById('level-screen').style.display = 'none';
    document.getElementById('loader').style.display = 'flex';
    document.getElementById('current-lvl-display').innerText = level.toUpperCase();
    await fetchWords();
}

async function fetchWords() {
    try {
        // .trim() භාවිතා කර ඇත Sheet නාමයේ ඇති විය හැකි හිස්තැන් ඉවත් කිරීමට
        const res = await fetch(`${SCRIPT_URL}?action=getHistory&level=${selectedLevel.trim()}`);
        dataset = await res.json();
        
        if(dataset && dataset.length > 0) {
            document.getElementById('loader').style.display = 'none';
            renderMatchBoard();
        } else {
            alert(selectedLevel + " සඳහා දත්ත හමු වූයේ නැත.\nකරුණාකර Sheet එකේ Headers පරීක්ෂා කරන්න.");
            location.reload();
        }
    } catch (e) { 
        console.error(e);
        alert("Connection Error! Please check your internet.");
        location.reload();
    }
}

function renderMatchBoard() {
    const enList = document.getElementById('en-list');
    const koList = document.getElementById('ko-list');
    
    enList.innerHTML = ""; 
    koList.innerHTML = "";
    selectedEn = null;
    roundCorrectCount = 0;

    // වචන 6ක් තෝරා ගැනීම (දත්ත 6කට වඩා තිබේ නම් පමණක්)
    let limit = Math.min(dataset.length, 6);
    let roundData = [...dataset].sort(() => 0.5 - Math.random()).slice(0, limit);
    
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
        btn.onclick = () => handleMatch(btn, data.korean, limit);
        koList.appendChild(btn);
    });
}

function handleMatch(btn, koText, currentLimit) {
    if (!selectedEn) return;

    if (selectedEn.matchId === koText) {
        btn.classList.add('correct');
        selectedEn.btn.classList.add('correct');
        
        totalScore += 10;
        roundCorrectCount++;
        document.getElementById('total-score').innerText = totalScore;
        
        selectedEn = null;
        
        if (roundCorrectCount === currentLimit) {
            setTimeout(showScoreModal, 500);
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
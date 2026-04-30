const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxenP37pvmwucpQ2LFPk3QeTaqSr9FeZtPnBMkVn-7gXngAuip8cyxbN3zKObZ0v1i6_A/exec';

let dataset = [];
let selectedEn = null;
let score = 0;

async function init() {
    await fetchWords();
}

async function fetchWords() {
    try {
        // TOPIK වචන ලබා ගැනීම (Level 1 ලෙස දැනට පවතී)
        const res = await fetch(`${SCRIPT_URL}?action=getHistory&level=Level 1`);
        dataset = await res.json();
        
        if(dataset.length > 0) {
            document.getElementById('loader').style.display = 'none';
            renderMatchBoard();
        } else {
            document.querySelector('#loader p').innerText = "NO DATA FOUND!";
        }
    } catch (e) {
        document.querySelector('#loader p').innerText = "CONNECTION ERROR!";
        console.error(e);
    }
}

function renderMatchBoard() {
    const enList = document.getElementById('en-list');
    const koList = document.getElementById('ko-list');
    
    enList.innerHTML = "";
    koList.innerHTML = "";
    selectedEn = null;

    // වටයකට වචන 6ක් තෝරා ගැනීම (Portrait එකට 6ක් හොඳින් ගැලපේ)
    let roundData = dataset.sort(() => 0.5 - Math.random()).slice(0, 6);
    
    let enSide = [...roundData].sort(() => 0.5 - Math.random());
    let koSide = [...roundData].sort(() => 0.5 - Math.random());

    enSide.forEach(data => {
        let btn = document.createElement('div');
        btn.className = 'word-btn';
        btn.innerText = data.english;
        btn.onclick = () => selectEnglish(btn, data.korean);
        enList.appendChild(btn);
    });

    koSide.forEach(data => {
        let btn = document.createElement('div');
        btn.className = 'word-btn';
        btn.innerText = data.korean;
        btn.onclick = () => selectKorean(btn, data.korean);
        koList.appendChild(btn);
    });
}

function selectEnglish(btn, matchId) {
    document.querySelectorAll('#en-list .word-btn').forEach(b => b.classList.remove('active'));
    selectedEn = { btn, matchId };
    btn.classList.add('active');
}

function selectKorean(btn, koreanText) {
    if (!selectedEn) return;

    if (selectedEn.matchId === koreanText) {
        btn.classList.add('correct');
        selectedEn.btn.classList.add('correct');
        score++;
        document.getElementById('count').innerText = score;
        selectedEn = null;
        checkNextRound();
    } else {
        btn.classList.add('wrong');
        setTimeout(() => btn.classList.remove('wrong'), 400);
    }
}

function checkNextRound() {
    const remaining = Array.from(document.querySelectorAll('.word-btn'))
                           .filter(b => !b.classList.contains('correct'));
    
    if (remaining.length === 0) {
        setTimeout(renderMatchBoard, 600);
    }
}

window.onload = init;
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxenP37pvmwucpQ2LFPk3QeTaqSr9FeZtPnBMkVn-7gXngAuip8cyxbN3zKObZ0v1i6_A/exec';

let dataset = [];
let selectedEn = null;
let score = 0;

async function init() {
    await fetchWords();
}

async function fetchWords() {
    try {
        const res = await fetch(`${SCRIPT_URL}?action=getHistory&level=Level 1`);
        dataset = await res.json();
        document.getElementById('loader').style.display = 'none';
        renderMatchBoard();
    } catch (e) {
        console.error("Cloud Error", e);
        document.getElementById('loader').innerText = "CONNECTION FAILED!";
    }
}

function renderMatchBoard() {
    const enList = document.getElementById('en-list');
    const koList = document.getElementById('ko-list');
    
    enList.innerHTML = "";
    koList.innerHTML = "";
    selectedEn = null;

    // වචන 5ක් බැගින් වටයකට තෝරා ගනිමු
    let roundData = dataset.sort(() => 0.5 - Math.random()).slice(0, 5);
    
    // දෙපැත්තට වචන shuffle කරමු
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
    // කලින් තෝරාගත් එකක් ඇත්නම් අයින් කරන්න
    document.querySelectorAll('#en-list .word-btn').forEach(b => b.classList.remove('active'));
    
    selectedEn = { btn, matchId };
    btn.classList.add('active');
}

function selectKorean(btn, koreanText) {
    if (!selectedEn) return; // මුලින් ඉංග්‍රීසි වචනයක් තෝරාගත යුතුයි

    if (selectedEn.matchId === koreanText) {
        // නිවැරදියි!
        btn.classList.add('correct');
        selectedEn.btn.classList.add('correct');
        
        score++;
        document.getElementById('count').innerText = score;
        
        selectedEn = null;
        checkNextRound();
    } else {
        // වැරදියි
        btn.classList.add('wrong');
        setTimeout(() => btn.classList.remove('wrong'), 500);
    }
}

function checkNextRound() {
    // සියලුම වචන මැච් කරලාද බලන්න
    const remaining = Array.from(document.querySelectorAll('.word-btn'))
                           .filter(b => !b.classList.contains('correct'));
    
    if (remaining.length === 0) {
        setTimeout(renderMatchBoard, 800); // අලුත් වටයක් පටන් ගන්න
    }
}

window.onload = init;
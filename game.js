const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxenP37pvmwucpQ2LFPk3QeTaqSr9FeZtPnBMkVn-7gXngAuip8cyxbN3zKObZ0v1i6_A/exec';


let scene, camera, renderer, clock, moveData = { x: 0, y: 0 };
let treasureChests = [], dataset = [], currentTarget = null;
let score = 0, oxygen = 100;

function init() {
    // 1. Scene Setup - දිය යට නිල් පැහැති පරිසරය
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a192f); // තද නිල් පාට
    scene.fog = new THREE.FogExp2(0x0a192f, 0.1); // වතුර යට මීදුම

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    // 2. Lighting - හිරු එළිය වතුර යටට එනවා වැනි ආලෝකය
    const sunLight = new THREE.DirectionalLight(0x40e0d0, 1); // Cyan light
    sunLight.position.set(0, 20, 0);
    scene.add(sunLight);

    const ambient = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambient);

    // 3. Bubbles & Sea Floor
    createSeaFloor();
    createBubbles();
    setupJoystick();
    fetchWords();
    animate();
}

function createSeaFloor() {
    const loader = new THREE.TextureLoader();
    const sandTex = loader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg'); // වැලි වෙනුවට තණකොළ texture එක පාවිච්චි කළ හැකිය
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({ color: 0x1a3a5a, map: sandTex })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
}

function createBubbles() {
    const bubbleGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
    
    for(let i=0; i<100; i++) {
        const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
        bubble.position.set(Math.random()*40-20, Math.random()*20, Math.random()*40-20);
        scene.add(bubble);
        // Bubble එක ඉහළට යන animation එකක් පසුව එක් කළ හැක
    }
}

// නිධන් පෙට්ටි නිර්මාණය (Gates වෙනුවට)
function spawnTreasure(x, z, wordObj) {
    const boxGeo = new THREE.BoxGeometry(1.5, 1, 1);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xcd7f32 }); // Bronze color
    const chest = new THREE.Mesh(boxGeo, boxMat);
    chest.position.set(x, 0.5, z);
    
    // කොරියානු වචනය පෙන්වන ලේබලය (සරල ක්‍රමයකට)
    chest.userData = wordObj; 
    scene.add(chest);
    treasureChests.push(chest);
}

function setupJoystick() {
    const manager = nipplejs.create({
        zone: document.getElementById('joystick-zone'),
        mode: 'static',
        position: { left: '80px', bottom: '80px' },
        color: 'cyan'
    });
    manager.on('move', (e, data) => { moveData.x = data.vector.x; moveData.y = data.vector.y; });
    manager.on('end', () => { moveData.x = 0; moveData.y = 0; });
}

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // 1. Floating Effect - වතුරේ පාවෙනවා වැනි චලනය
    camera.position.y += Math.sin(time) * 0.005;

    // 2. Movement
    if (moveData.y !== 0 || moveData.x !== 0) {
        camera.rotation.y -= moveData.x * 0.04;
        let moveDir = new THREE.Vector3(0, 0, -moveData.y).applyQuaternion(camera.quaternion);
        camera.position.addScaledVector(moveDir, 0.1);
    }

    // 3. Collision with Treasure Chests
    treasureChests.forEach((chest, index) => {
        if (camera.position.distanceTo(chest.position) < 2) {
            checkAnswer(chest, index);
        }
    });

    renderer.render(scene, camera);
}

function checkAnswer(chest, index) {
    if (chest.userData.korean === currentTarget.korean) {
        score += 10;
        alert("Correct! You found Gold!");
        scene.remove(chest);
        treasureChests.splice(index, 1);
        setNewTarget();
    }
}

async function fetchWords() {
    try {
        const res = await fetch(`${SCRIPT_URL}?action=getHistory&level=Level 1`);
        dataset = await res.json();
        
        // පෙට්ටි 10ක් random තැන්වල පෙන්වීම
        dataset.slice(0, 10).forEach(word => {
            spawnTreasure(Math.random()*30-15, Math.random()*30-15, word);
        });

        document.getElementById('loader').style.display = 'none';
        setNewTarget();
    } catch(e) { console.error("Data fetch error"); }
}

function setNewTarget() {
    if(dataset.length === 0) return;
    currentTarget = dataset[Math.floor(Math.random() * dataset.length)];
    document.getElementById('word').innerText = currentTarget.english;
}

window.onload = init;
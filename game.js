const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxenP37pvmwucpQ2LFPk3QeTaqSr9FeZtPnBMkVn-7gXngAuip8cyxbN3zKObZ0v1i6_A/exec';



let scene, camera, renderer, clock, moveData = { x: 0, y: 0 };
let treasureChests = [], dataset = [], currentTarget = null;
let score = 0;

function init() {
    // 1. Scene & Environment
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a192f); 
    scene.fog = new THREE.FogExp2(0x0a192f, 0.1); 

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    // 2. Lighting
    const sunLight = new THREE.DirectionalLight(0x40e0d0, 1.5);
    sunLight.position.set(0, 20, 10);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0x404040, 1.5));

    setupJoystick();
    createSeaWorld();
    fetchWords();
    animate();
}

function createSeaWorld() {
    const loader = new THREE.TextureLoader();
    
    // වැලි සහිත මුහුදු පතුල
    const sandTex = loader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({ color: 0x1a3a5a, map: sandTex })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // පාවෙන බුබුළු (Bubbles)
    const bubbleGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
    for(let i=0; i<150; i++) {
        const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
        bubble.position.set(Math.random()*60-30, Math.random()*20, Math.random()*60-30);
        scene.add(bubble);
    }
}

// වචන පෙට්ටි උඩ පෙන්වීමට භාවිතා කරන Function එක
function createTextLabel(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 256, 128);
    ctx.font = 'Bold 40px Arial';
    ctx.fillStyle = '#00ffff';
    ctx.textAlign = 'center';
    ctx.fillText(text, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2, 1, 1);
    return sprite;
}

function spawnTreasure(x, z, wordObj) {
    // Treasure Chest Mesh
    const chestGroup = new THREE.Group();
    
    const boxGeo = new THREE.BoxGeometry(1.2, 0.8, 0.8);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xcd7f32, roughness: 0.5 });
    const chest = new THREE.Mesh(boxGeo, boxMat);
    chestGroup.add(chest);

    // වචනය පෙට්ටිය උඩට එකතු කිරීම
    const label = createTextLabel(wordObj.korean);
    label.position.y = 1.2;
    chestGroup.add(label);

    chestGroup.position.set(x, 0.4, z);
    chestGroup.userData = wordObj;
    
    scene.add(chestGroup);
    treasureChests.push(chestGroup);
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

    // 1. Floating Camera Effect
    camera.position.y += Math.sin(time * 0.5) * 0.003;

    // 2. Player Movement
    if (moveData.y !== 0 || moveData.x !== 0) {
        camera.rotation.y -= moveData.x * 0.04;
        let moveDir = new THREE.Vector3(0, 0, -moveData.y).applyQuaternion(camera.quaternion);
        camera.position.addScaledVector(moveDir, 0.12);
    }

    // 3. Collision Check (Chest එකක් ළඟට ගිය විට)
    treasureChests.forEach((group, index) => {
        if (camera.position.distanceTo(group.position) < 2) {
            if (group.userData.korean === currentTarget.korean) {
                handleCorrect(group, index);
            }
        }
    });

    renderer.render(scene, camera);
}

function handleCorrect(group, index) {
    // නිවැරදි නම් පෙට්ටිය අතුරුදහන් වී අලුත් එකක් දීම
    scene.remove(group);
    treasureChests.splice(index, 1);
    score += 10;
    
    // අලුත් වචනයක් තෝරාගැනීම
    setNewTarget();
    
    // පොඩි feedback එකක්
    const wordDisplay = document.getElementById('word');
    wordDisplay.style.color = '#10b981';
    setTimeout(() => { wordDisplay.style.color = '#38bdf8'; }, 1000);
}

async function fetchWords() {
    try {
        const res = await fetch(`${SCRIPT_URL}?action=getHistory&level=Level 1`);
        dataset = await res.json();
        
        // පෙට්ටි 15ක් random තැන්වල පෙන්වීම
        for(let i=0; i<15; i++) {
            if(dataset[i]) {
                spawnTreasure(Math.random()*40-20, Math.random()*40-20, dataset[i]);
            }
        }

        document.getElementById('loader').style.display = 'none';
        setNewTarget();
    } catch(e) { console.error("Data Sync Failed"); }
}

function setNewTarget() {
    if(dataset.length === 0) return;
    currentTarget = dataset[Math.floor(Math.random() * dataset.length)];
    document.getElementById('word').innerText = currentTarget.english;
}

window.onload = init;
window.onresize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};
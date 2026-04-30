const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxenP37pvmwucpQ2LFPk3QeTaqSr9FeZtPnBMkVn-7gXngAuip8cyxbN3zKObZ0v1i6_A/exec';

let scene, camera, renderer, clock, moveData = { x: 0, y: 0 };
let mazeWalls = [], wordGates = [], dataset = [], currentTarget = null;
let wordsFound = 0;

function init() {
    // 1. Scene Setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.1); // මීදුම මදක් අඩු කළා පෙනීම පැහැදිලි වීමට

    // Camera - Mobile සඳහා FOV 80 ලෙස සකස් කළා
    camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(2, 1.6, 2);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Performance සඳහා උපරිමය 2 ට සීමා කළා
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    // 2. Lighting - Flashlight + Ambient
    const flashlight = new THREE.PointLight(0x6366f1, 2.5, 15);
    camera.add(flashlight);
    scene.add(camera);

    const hemiLight = new THREE.HemisphereLight(0x444444, 0x000000, 0.8);
    scene.add(hemiLight);

    setupJoystick();
    createWorld();
    fetchWords();
    animate();
}

function createWorld() {
    const loader = new THREE.TextureLoader();
    
    // බිත්ති සඳහා Brick Texture එකක්
    const wallTex = loader.load('https://threejs.org/examples/textures/brick_diffuse.jpg');
    const wallGeo = new THREE.BoxGeometry(2, 4, 2);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.8 });

    const map = [
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,1,0,0,0,0,0,0,1],
        [1,0,1,0,1,0,1,1,1,1,0,1],
        [1,2,1,0,0,0,1,0,2,0,0,1],
        [1,0,1,1,1,1,1,0,1,1,1,1],
        [1,0,0,0,2,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    map.forEach((row, z) => {
        row.forEach((cell, x) => {
            if (cell === 1) {
                const wall = new THREE.Mesh(wallGeo, wallMat);
                wall.position.set(x * 2, 2, z * 2);
                scene.add(wall);
                mazeWalls.push(wall);
            } else if (cell === 2) {
                spawnGate(x * 2, z * 2);
            }
        });
    });

    // Floor Texture
    const floorTex = loader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(15, 15);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100,100), new THREE.MeshStandardMaterial({map: floorTex}));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
}

function spawnGate(x, z) {
    const gateGeo = new THREE.BoxGeometry(1.8, 3.8, 0.2);
    const gateMat = new THREE.MeshStandardMaterial({ 
        color: 0x00ffff, 
        transparent: true, 
        opacity: 0.3,
        emissive: 0x00ffff,
        emissiveIntensity: 0.5
    });
    const gate = new THREE.Mesh(gateGeo, gateMat);
    gate.position.set(x, 2, z);
    scene.add(gate);
    wordGates.push(gate);
}

function setupJoystick() {
    const manager = nipplejs.create({
        zone: document.getElementById('joystick-zone'),
        mode: 'static',
        position: { left: '60px', bottom: '60px' },
        color: 'white'
    });
    manager.on('move', (e, data) => { 
        moveData.x = data.vector.x; 
        moveData.y = data.vector.y; 
    });
    manager.on('end', () => { moveData.x = 0; moveData.y = 0; });
}

function animate() {
    requestAnimationFrame(animate);
    
    if (moveData.y !== 0 || moveData.x !== 0) {
        // Rotation (වටපිට බැලීම)
        camera.rotation.y -= moveData.x * 0.045;

        // ඇවිදීම
        let nextPos = camera.position.clone();
        let moveDir = new THREE.Vector3(0, 0, -moveData.y).applyQuaternion(camera.quaternion);
        nextPos.addScaledVector(moveDir, 0.13);

        // Collision Detection
        let collided = false;
        for (let wall of mazeWalls) {
            if (nextPos.distanceTo(wall.position) < 1.3) collided = true;
        }

        if (!collided) camera.position.copy(nextPos);
    }
    renderer.render(scene, camera);
}

async function fetchWords() {
    try {
        const res = await fetch(`${SCRIPT_URL}?action=getHistory&level=Level 1`);
        dataset = await res.json();
        document.getElementById('loader').style.display = 'none';
        setNewTarget();
    } catch(e) {
        console.error("Cloud Error");
    }
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
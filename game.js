const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxenP37pvmwucpQ2LFPk3QeTaqSr9FeZtPnBMkVn-7gXngAuip8cyxbN3zKObZ0v1i6_A/exec';

let scene, camera, renderer, moveData = { x: 0, y: 0 };
let mazeWalls = [], wordGates = [], dataset = [], currentTarget = null;
let wordsFound = 0;

function init() {
    // 1. Scene & Camera Setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.15);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(2, 1.6, 2);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // 2. Lighting (Flashlight)
    const flashlight = new THREE.PointLight(0x4f46e5, 3, 10);
    camera.add(flashlight);
    scene.add(camera);
    scene.add(new THREE.AmbientLight(0x111111));

    setupJoystick();
    createMaze();
    fetchWords();
    animate();
}

function createMaze() {
    const wallGeo = new THREE.BoxGeometry(2, 4, 2);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

    // 1: බිත්තිය, 0: පාර, 2: ගේට්ටුව
    const map = [
        [1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,1,0,1],
        [1,0,1,1,1,1,0,1,0,1],
        [1,2,1,0,0,2,0,0,0,1],
        [1,0,1,0,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1]
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

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100,100), new THREE.MeshStandardMaterial({color: 0x050505}));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
}

function spawnGate(x, z) {
    const gate = new THREE.Mesh(
        new THREE.BoxGeometry(2, 4, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x4f46e5, transparent: true, opacity: 0.4 })
    );
    gate.position.set(x, 2, z);
    scene.add(gate);
    wordGates.push(gate);
}

function setupJoystick() {
    const manager = nipplejs.create({
        zone: document.getElementById('joystick-zone'),
        mode: 'static',
        position: { left: '70px', bottom: '70px' },
        color: 'white'
    });
    manager.on('move', (e, data) => { moveData.x = data.vector.x; moveData.y = data.vector.y; });
    manager.on('end', () => { moveData.x = 0; moveData.y = 0; });
}

function animate() {
    requestAnimationFrame(animate);

    if (moveData.y !== 0 || moveData.x !== 0) {
        camera.rotation.y -= moveData.x * 0.05;
        let nextPos = camera.position.clone();
        let moveDir = new THREE.Vector3(0, 0, -moveData.y).applyQuaternion(camera.quaternion);
        nextPos.addScaledVector(moveDir, 0.12);

        // Simple Collision Detection
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
    } catch(e) { alert("Cloud Sync Failed!"); }
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
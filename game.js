const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxenP37pvmwucpQ2LFPk3QeTaqSr9FeZtPnBMkVn-7gXngAuip8cyxbN3zKObZ0v1i6_A/exec';

let scene, camera, renderer, moveData = { x: 0, y: 0 };
let mazeWalls = [], wordGates = [], dataset = [], currentTarget = null;
let wordsFound = 0;

// --- Scene & Lighting Update ---
function init() {
    scene = new THREE.Scene();
    // මීදුම ටිකක් අඩු කළා පෙනීම පැහැදිලි වෙන්න
    scene.fog = new THREE.FogExp2(0x000000, 0.08); 

    // Camera FOV එක 85 කළා (Mobile වලට වඩාත් ගැලපේ)
    camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(2, 1.6, 2);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio); // High-DPI screens සඳහා
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // ආලෝකය වැඩි දියුණු කිරීම
    const flashlight = new THREE.PointLight(0x6366f1, 2.5, 15);
    camera.add(flashlight);
    
    // පොදු ආලෝකය (Ambient) ටිකක් වැඩි කළා
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.6);
    scene.add(hemiLight);
    scene.add(camera);

    setupJoystick();
    createMaze();
    fetchWords();
    animate();
}

// --- Textures සහිත බිත්ති ---
function createMaze() {
    const loader = new THREE.TextureLoader();
    // බිත්තිවලට Texture එකක් (මේ URL එක පාවිච්චි කරන්න පුළුවන්)
    const wallTex = loader.load('https://threejs.org/examples/textures/brick_diffuse.jpg');
    wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
    wallTex.repeat.set(1, 1);

    const wallGeo = new THREE.BoxGeometry(2, 4, 2);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, bumpScale: 0.1 });

    const map = [
        [1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,1,0,0,0,0,1],
        [1,0,1,0,1,0,1,1,0,1],
        [1,2,1,0,0,0,1,0,0,1], 
        [1,0,1,1,1,1,1,0,1,1],
        [1,0,0,0,0,2,0,0,0,1],
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

    // Floor එකටත් Texture එකක් දාමු
    const floorTex = loader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(10, 10);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100,100), new THREE.MeshStandardMaterial({map: floorTex}));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
}

// --- Gate Display Update ---
function spawnGate(x, z) {
    // ගේට්ටුව ප්ලාස්ටික් වගේ නැතුව දිලිසෙන වීදුරුවක් වගේ හදමු
    const gate = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 3.8, 0.2),
        new THREE.MeshStandardMaterial({ 
            color: 0x00ffff, 
            transparent: true, 
            opacity: 0.3,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5
        })
    );
    gate.position.set(x, 2, z);
    scene.add(gate);
    wordGates.push(gate);
}

window.onload = init;
window.onresize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};
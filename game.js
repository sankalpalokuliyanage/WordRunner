const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxenP37pvmwucpQ2LFPk3QeTaqSr9FeZtPnBMkVn-7gXngAuip8cyxbN3zKObZ0v1i6_A/exec';


let scene, camera, renderer, clock, moveData = { x: 0, y: 0 };
let aeroGates = [], dataset = [], currentTarget = null;
let jetModel;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // ලස්සන නිල් අහස
    scene.fog = new THREE.Fog(0x87ceeb, 10, 100);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 8); // Jet එකට පිටුපසින් කැමරාව

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    // Lighting
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(5, 10, 7);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    createSky();
    createJet(); // Jet යානය නිර්මාණය
    setupJoystick();
    fetchWords();
    animate();
}

function createSky() {
    // පොළොව වෙනුවට පල්ලෙහායින් පෙනෙන වලාකුළු තට්ටුවක්
    const cloudGeo = new THREE.PlaneGeometry(500, 500);
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    const clouds = new THREE.Mesh(cloudGeo, cloudMat);
    clouds.rotation.x = -Math.PI / 2;
    clouds.position.y = -10;
    scene.add(clouds);
}

function createJet() {
    // සරල 3D Jet යානයක හැඩයක් (Body + Wings)
    jetModel = new THREE.Group();
    
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2, 8), new THREE.MeshStandardMaterial({color: 0xdddddd}));
    body.rotation.x = -Math.PI / 2;
    jetModel.add(body);

    const wings = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1), new THREE.MeshStandardMaterial({color: 0x4f46e5}));
    jetModel.add(wings);

    scene.add(jetModel);
}

function spawnAeroGate(x, y, z, wordObj) {
    const torusGeo = new THREE.TorusGeometry(2, 0.1, 16, 100);
    const torusMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const gate = new THREE.Mesh(torusGeo, torusMat);
    gate.position.set(x, y, z);
    
    // කොරියානු වචනය වළල්ල මැදට දැමීම
    const label = createTextLabel(wordObj.korean);
    gate.add(label);
    
    gate.userData = wordObj;
    scene.add(gate);
    aeroGates.push(gate);
}

function createTextLabel(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256; canvas.height = 128;
    ctx.font = 'Bold 50px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(text, 128, 64);
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
    sprite.scale.set(3, 1.5, 1);
    return sprite;
}

function setupJoystick() {
    const manager = nipplejs.create({
        zone: document.getElementById('joystick-zone'),
        mode: 'static',
        position: { left: '80px', bottom: '80px' },
        color: 'white'
    });
    manager.on('move', (e, data) => { moveData.x = data.vector.x; moveData.y = data.vector.y; });
    manager.on('end', () => { moveData.x = 0; moveData.y = 0; });
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Jet එක නිතරම ඉදිරියට පියාසර කරයි (Constant speed)
    const speed = 0.2;
    jetModel.position.z -= speed;
    camera.position.z -= speed;

    // Joystick මගින් Jet එක පාලනය (වමට, දකුණට, උඩට, පල්ලෙහාට)
    if (moveData.x !== 0) {
        jetModel.position.x += moveData.x * 0.15;
        jetModel.rotation.z = -moveData.x * 0.5; // ඇලවීම (Banking)
        camera.position.x = jetModel.position.x;
    }
    if (moveData.y !== 0) {
        jetModel.position.y += moveData.y * 0.15;
        camera.position.y = jetModel.position.y + 2;
    }

    // වළලු හරහා යාම පරීක්ෂා කිරීම
    aeroGates.forEach((gate, index) => {
        if (jetModel.position.distanceTo(gate.position) < 2.5) {
            if (gate.userData.korean === currentTarget.korean) {
                console.log("Correct!");
                scene.remove(gate);
                aeroGates.splice(index, 1);
                setNewTarget();
                // ඊළඟ වළලු ටික ඈතින් පෙන්වමු
                spawnAeroGate(Math.random()*10-5, Math.random()*10-5, jetModel.position.z - 40, dataset[Math.floor(Math.random()*dataset.length)]);
            }
        }
    });

    renderer.render(scene, camera);
}

async function fetchWords() {
    const res = await fetch(`${SCRIPT_URL}?action=getHistory&level=Level 1`);
    dataset = await res.json();
    document.getElementById('loader').style.display = 'none';
    
    // මූලික වළලු කිහිපයක් පෙන්වීම
    for(let i=0; i<5; i++) {
        spawnAeroGate(Math.random()*10-5, Math.random()*10-5, -20 - (i*30), dataset[i]);
    }
    setNewTarget();
}

function setNewTarget() {
    currentTarget = dataset[Math.floor(Math.random() * dataset.length)];
    document.getElementById('word').innerText = currentTarget.english;
}

window.onload = init;
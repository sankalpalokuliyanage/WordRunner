const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxenP37pvmwucpQ2LFPk3QeTaqSr9FeZtPnBMkVn-7gXngAuip8cyxbN3zKObZ0v1i6_A/exec';

let scene, camera, renderer, clock, moveData = { x: 0, y: 0 };
let aeroGates = [], dataset = [], currentTarget = null;
let jetModel, score = 0;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 20, 150);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 10); 

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(5, 15, 10);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    createSky();
    createJet();
    setupJoystick();
    fetchWords();
    animate();
}

function createSky() {
    const cloudGeo = new THREE.PlaneGeometry(1000, 1000);
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    const clouds = new THREE.Mesh(cloudGeo, cloudMat);
    clouds.rotation.x = -Math.PI / 2;
    clouds.position.y = -20;
    scene.add(clouds);

    for(let i=0; i<30; i++) {
        const c = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8), new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.3}));
        c.position.set(Math.random()*100-50, Math.random()*20, Math.random()*-300);
        scene.add(c);
    }
}

function createJet() {
    jetModel = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.5, 8), new THREE.MeshStandardMaterial({color: 0xe5e7eb}));
    body.rotation.x = -Math.PI / 2;
    jetModel.add(body);

    const wings = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 1.2), new THREE.MeshStandardMaterial({color: 0x4f46e5}));
    wings.position.z = -0.5;
    jetModel.add(wings);

    scene.add(jetModel);
}

function spawnAeroGate(zPos) {
    if (dataset.length < 3) return;
    const options = [currentTarget];
    while(options.length < 3) {
        let rand = dataset[Math.floor(Math.random() * dataset.length)];
        if(!options.find(o => o.korean === rand.korean)) options.push(rand);
    }
    options.sort(() => Math.random() - 0.5);

    options.forEach((word, i) => {
        const gate = new THREE.Group();
        const torus = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.1, 16, 100), new THREE.MeshBasicMaterial({ color: 0x00f2ff }));
        gate.add(torus);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 512; canvas.height = 256;
        ctx.font = 'Bold 90px Arial'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
        ctx.fillText(word.korean, 256, 150);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas) }));
        sprite.scale.set(4, 2, 1);
        gate.add(sprite);

        gate.position.set((i - 1) * 9, 0, zPos);
        gate.userData = word;
        scene.add(gate);
        aeroGates.push(gate);
    });
}

function animate() {
    requestAnimationFrame(animate);
    const speed = 0.3;
    jetModel.position.z -= speed;
    camera.position.z -= speed;

    if (moveData.x !== 0) {
        jetModel.position.x += moveData.x * 0.25;
        jetModel.rotation.z = -moveData.x * 0.7;
        camera.position.x = jetModel.position.x * 0.5;
    } else { jetModel.rotation.z *= 0.9; }
    
    if (moveData.y !== 0) {
        jetModel.position.y += moveData.y * 0.25;
        camera.position.y = jetModel.position.y + 3;
    }

    aeroGates.forEach((gate, index) => {
        if (jetModel.position.distanceTo(gate.position) < 3.5) {
            if (gate.userData.korean === currentTarget.korean) {
                score++;
                document.getElementById('count').innerText = score;
                aeroGates.forEach(g => scene.remove(g));
                aeroGates = [];
                setNewTarget();
                spawnAeroGate(jetModel.position.z - 60);
            }
        }
    });
    renderer.render(scene, camera);
}

function setupJoystick() {
    const manager = nipplejs.create({ zone: document.getElementById('joystick-zone'), mode: 'static', position: { left: '80px', bottom: '80px' }, color: 'cyan' });
    manager.on('move', (e, data) => { moveData.x = data.vector.x; moveData.y = data.vector.y; });
    manager.on('end', () => { moveData.x = 0; moveData.y = 0; });
}

async function fetchWords() {
    try {
        const res = await fetch(`${SCRIPT_URL}?action=getHistory&level=Level 1`);
        dataset = await res.json();
        document.getElementById('loader').style.display = 'none';
        setNewTarget();
        spawnAeroGate(-40);
    } catch(e) { console.error(e); }
}

function setNewTarget() {
    if(dataset.length === 0) return;
    currentTarget = dataset[Math.floor(Math.random() * dataset.length)];
    document.getElementById('word').innerText = currentTarget.english;
}

window.onload = init;
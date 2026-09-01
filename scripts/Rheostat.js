import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ==================== DOM元素 ====================
const container = document.getElementById('canvas-container');
const ledDisplay = document.getElementById('led-display');
const currentTitleDisplay = document.getElementById('current-title-display');
const bgmStatusEl = document.getElementById('bgm-status');
const hintText = document.getElementById('hint-text');

// ==================== 场景初始化 ====================
const scene = new THREE.Scene();
scene.background = new THREE.Color('#1a1a2e');
scene.fog = new THREE.Fog('#1a1a2e', 6, 22);

const camera = new THREE.PerspectiveCamera(48, container.clientWidth / container.clientHeight, 0.3, 40);
camera.position.set(4.5, 2.8, 6.5);
camera.lookAt(0, 0.8, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.9, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.12;
controls.minDistance = 2.5;
controls.maxDistance = 12;
controls.maxPolarAngle = Math.PI * 0.78;
controls.minPolarAngle = 0.25;
controls.update();
const defaultCameraPos = camera.position.clone();
const defaultTarget = controls.target.clone();

// ==================== 光照 ====================
const ambientLight = new THREE.AmbientLight('#ffe8d6', 1.8);
scene.add(ambientLight);
const hemisphereLight = new THREE.HemisphereLight('#ffeedd', '#334455', 0.9);
scene.add(hemisphereLight);
const keyLight = new THREE.DirectionalLight('#ffffff', 3.5);
keyLight.position.set(8, 6, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 30;
keyLight.shadow.camera.left = -8;
keyLight.shadow.camera.right = 8;
keyLight.shadow.camera.top = 6;
keyLight.shadow.camera.bottom = -2;
keyLight.shadow.bias = -0.00015;
keyLight.shadow.normalBias = 0.02;
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight('#aaccff', 1.2);
fillLight.position.set(-3, 2, -2);
scene.add(fillLight);
const rimLight = new THREE.DirectionalLight('#ffffff', 1.5);
rimLight.position.set(0, 3, -4);
scene.add(rimLight);

// ==================== 材质定义 ====================
const matWood = new THREE.MeshStandardMaterial({ color: '#6b4226', roughness: 0.55, metalness: 0.05 });
const matWoodDark = new THREE.MeshStandardMaterial({ color: '#4a2a14', roughness: 0.6, metalness: 0.05 });
const matMetalBright = new THREE.MeshStandardMaterial({ color: '#d0d0d8', roughness: 0.22, metalness: 0.92 });
const matMetalDark = new THREE.MeshStandardMaterial({ color: '#888890', roughness: 0.28, metalness: 0.88 });
const matBrass = new THREE.MeshStandardMaterial({ color: '#c9a96e', roughness: 0.25, metalness: 0.85 });
const matRedPlastic = new THREE.MeshStandardMaterial({ color: '#d94030', roughness: 0.35, metalness: 0.08 });
const matBlackPlastic = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.4, metalness: 0.1 });
const matSliderFrame = new THREE.MeshStandardMaterial({ color: '#b8b8c0', roughness: 0.2, metalness: 0.9 });

const indicatorMatLeft = new THREE.MeshStandardMaterial({ color: '#ff2020', roughness: 0.3, metalness: 0.1,
    emissive: '#ff0000', emissiveIntensity: 0 });
const indicatorMatRight = new THREE.MeshStandardMaterial({ color: '#ff2020', roughness: 0.3, metalness: 0.1,
    emissive: '#ff0000', emissiveIntensity: 0 });

// 头像框可发光材质
const matDiscRing = new THREE.MeshStandardMaterial({ color: '#d0d0d8', roughness: 0.22, metalness: 0.92,
    emissive: '#ffaa00', emissiveIntensity: 0 });

function createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,50,20,1)');
    g.addColorStop(0.2, 'rgba(255,80,40,0.9)');
    g.addColorStop(0.5, 'rgba(255,30,10,0.5)');
    g.addColorStop(0.8, 'rgba(255,20,0,0.1)');
    g.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
}
const glowTexture = createGlowTexture();

function createTitleTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1024, 512);
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 160px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, 256);
    return new THREE.CanvasTexture(canvas);
}

function createScaleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f5f0e8';
    ctx.fillRect(0, 0, 1024, 128);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.font = 'bold 18px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillStyle = '#c00';
    ctx.textAlign = 'center';
    [0, 10, 20, 30, 40, 50].forEach(o => {
        const x = (o / 50) * 1024;
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x, 60);
        ctx.stroke();
        ctx.fillText(o + '', x, 90);
    });
    for (let i = 0; i <= 50; i += 5) {
        const x = (i / 50) * 1024;
        ctx.beginPath();
        ctx.moveTo(x, 30);
        ctx.lineTo(x, 50);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
}

// ==================== 3D模型构建 ====================
const mainGroup = new THREE.Group();
scene.add(mainGroup);
const baseGroup = new THREE.Group();
const baseBody = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.22, 1.1), matWood);
baseBody.position.y = 0.11;
baseBody.castShadow = true;
baseBody.receiveShadow = true;
baseGroup.add(baseBody);
const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.06, 1.0), matWoodDark);
baseTrim.position.y = 0.01;
baseTrim.castShadow = true;
baseGroup.add(baseTrim);
const baseTopPlate = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.04, 0.85), matMetalDark);
baseTopPlate.position.y = 0.23;
baseTopPlate.castShadow = true;
baseTopPlate.receiveShadow = true;
baseGroup.add(baseTopPlate);
mainGroup.add(baseGroup);

function createSupportBracket(xPos) {
    const g = new THREE.Group();
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.05, 32), matMetalBright);
    p.position.y = 0.75;
    p.castShadow = true;
    p.receiveShadow = true;
    g.add(p);
    const f = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.1, 32), matMetalDark);
    f.position.y = 0.27;
    f.castShadow = true;
    f.receiveShadow = true;
    g.add(f);
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 16), matMetalBright);
    s.position.y = 0.32;
    s.castShadow = true;
    g.add(s);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.28), matMetalDark);
    t.position.y = 1.25;
    t.castShadow = true;
    g.add(t);
    g.position.x = xPos;
    return g;
}
mainGroup.add(createSupportBracket(-2.15));
mainGroup.add(createSupportBracket(2.15));

const ceramicTubeGroup = new THREE.Group();
const cc = document.createElement('canvas');
cc.width = 1024;
cc.height = 256;
const ccCtx = cc.getContext('2d');
ccCtx.fillStyle = '#f7f2ea';
ccCtx.fillRect(0, 0, 1024, 256);
for (let i = 0; i < 1024; i += 7) {
    ccCtx.strokeStyle = `rgba(180,160,140,${0.35 + Math.random() * 0.25})`;
    ccCtx.lineWidth = 0.8 + Math.random() * 1.2;
    ccCtx.beginPath();
    ccCtx.moveTo(i, 0);
    ccCtx.lineTo(i + Math.random() * 3, 256);
    ccCtx.stroke();
}
const ceramicTexture = new THREE.CanvasTexture(cc);
ceramicTexture.colorSpace = THREE.SRGBColorSpace;
ceramicTexture.wrapS = THREE.RepeatWrapping;
ceramicTexture.wrapT = THREE.RepeatWrapping;
ceramicTexture.repeat.set(2, 1);
const matCeramicTextured = new THREE.MeshStandardMaterial({ map: ceramicTexture, roughness: 0.5, metalness: 0.03,
    color: '#fefdfb' });
const ceramicTube = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 3.7, 48), matCeramicTextured);
ceramicTube.rotation.z = -Math.PI / 2;
ceramicTube.position.set(0, 1.02, 0);
ceramicTube.castShadow = true;
ceramicTube.receiveShadow = true;
ceramicTubeGroup.add(ceramicTube);

function createEndRing(xP) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.05, 16, 40), matMetalDark);
    r.rotation.y = Math.PI / 2;
    r.position.set(xP, 1.02, 0);
    r.castShadow = true;
    r.receiveShadow = true;
    return r;
}
ceramicTubeGroup.add(createEndRing(-1.83));
ceramicTubeGroup.add(createEndRing(1.83));
mainGroup.add(ceramicTubeGroup);

function createSlideRod(yOff) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 3.85, 32), matMetalBright);
    rod.rotation.z = -Math.PI / 2;
    rod.position.set(0, yOff, 0);
    rod.castShadow = true;
    rod.receiveShadow = true;
    return rod;
}
mainGroup.add(createSlideRod(1.38));
mainGroup.add(createSlideRod(0.64));

const indicatorItems = [];

function createTerminal(xP, zP, cMat, iMat) {
    const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.2, 32), matMetalDark);
    b.position.y = 0.35;
    b.castShadow = true;
    g.add(b);
    const k = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.18, 32), cMat);
    k.position.y = 0.55;
    k.castShadow = true;
    g.add(k);
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14), iMat);
    s.position.y = 0.67;
    s.castShadow = true;
    g.add(s);
    const sm = new THREE.SpriteMaterial({ map: glowTexture, blending: THREE.AdditiveBlending, depthWrite: false,
        opacity: 0, transparent: true });
    const sp = new THREE.Sprite(sm);
    sp.position.copy(s.position);
    sp.scale.set(0.45, 0.45, 1);
    g.add(sp);
    g.position.set(xP, 0.02, zP);
    indicatorItems.push({ mesh: s, sprite: sp, side: xP < 0 ? 'left' : 'right' });
    return g;
}
mainGroup.add(createTerminal(-2.05, 0.3, matRedPlastic, indicatorMatLeft));
mainGroup.add(createTerminal(-2.05, -0.3, matBlackPlastic, indicatorMatLeft));
mainGroup.add(createTerminal(2.05, 0.3, matRedPlastic, indicatorMatRight));
mainGroup.add(createTerminal(2.05, -0.3, matBlackPlastic, indicatorMatRight));

const scaleGeom = new THREE.PlaneGeometry(3.7, 0.15);
const scaleTex = createScaleTexture();
scaleTex.colorSpace = THREE.SRGBColorSpace;
const scaleMat = new THREE.MeshStandardMaterial({ map: scaleTex, roughness: 0.6, metalness: 0.1, side: THREE
        .DoubleSide });
const scalePlane = new THREE.Mesh(scaleGeom, scaleMat);
scalePlane.position.set(0, 0.88, 0.35);
scalePlane.receiveShadow = true;
mainGroup.add(scalePlane);

const titlePlanes = [];
const labelXPositions = [-1.368, -0.504, 0.36, 1.296];
const defaultTitles = ['鈧神', '坑先生', '牢坑', '豬坑'];
defaultTitles.forEach((title, idx) => {
    const tex = createTitleTexture(title);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.05 });
    const geom = new THREE.BoxGeometry(0.9, 0.22, 0.02);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(labelXPositions[idx], 1.18, 0.35);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mainGroup.add(mesh);
    titlePlanes.push({ mesh, texture: tex, title });
});

const sliderGroup = new THREE.Group();
sliderGroup.name = 'sliderGroup';
const sliderMeshes = [];

function addSliderMesh(m) {
    m.userData.isSliderPart = true;
    sliderMeshes.push(m);
    sliderGroup.add(m);
}
const bc = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.07, 0.5), matSliderFrame);
bc.position.y = 0.52;
bc.castShadow = true;
addSliderMesh(bc);
const sf = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.72, 0.1), matSliderFrame);
sf.position.set(0, 0.92, 0.28);
sf.castShadow = true;
addSliderMesh(sf);
const sb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.72, 0.1), matSliderFrame);
sb.position.set(0, 0.92, -0.28);
sb.castShadow = true;
addSliderMesh(sb);
const tb = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.55), matSliderFrame);
tb.position.y = 1.32;
tb.castShadow = true;
addSliderMesh(tb);

// ==================== 固定头像图片（使用内联图片） ====================
const photoCanvas = document.createElement('canvas');
photoCanvas.width = 512;
photoCanvas.height = 512;
const photoCtx = photoCanvas.getContext('2d');

function drawFixedAvatar() {
    photoCtx.clearRect(0, 0, 512, 512);
    photoCtx.save();
    photoCtx.beginPath();
    photoCtx.arc(256, 256, 230, 0, Math.PI * 2);
    photoCtx.clip();

    const bgGrad = photoCtx.createRadialGradient(256, 200, 40, 256, 256, 280);
    bgGrad.addColorStop(0, '#ffe8d0');
    bgGrad.addColorStop(0.5, '#f0c8a0');
    bgGrad.addColorStop(1, '#d4a080');
    photoCtx.fillStyle = bgGrad;
    photoCtx.fillRect(0, 0, 512, 512);

    photoCtx.fillStyle = '#3d2b1f';
    photoCtx.beginPath();
    photoCtx.ellipse(256, 180, 120, 100, 0, 0, Math.PI * 2);
    photoCtx.fill();

    photoCtx.fillStyle = '#c0392b';
    photoCtx.beginPath();
    photoCtx.ellipse(256, 130, 140, 40, 0, 0, Math.PI * 2);
    photoCtx.fill();
    photoCtx.fillRect(180, 90, 152, 45);
    photoCtx.fillStyle = '#e74c3c';
    photoCtx.beginPath();
    photoCtx.ellipse(256, 110, 130, 32, 0, 0, Math.PI * 2);
    photoCtx.fill();

    photoCtx.fillStyle = '#f5d0b8';
    photoCtx.beginPath();
    photoCtx.ellipse(256, 220, 90, 100, 0, 0, Math.PI * 2);
    photoCtx.fill();

    photoCtx.fillStyle = '#2c3e50';
    photoCtx.beginPath();
    photoCtx.ellipse(222, 200, 18, 22, 0, 0, Math.PI * 2);
    photoCtx.fill();
    photoCtx.beginPath();
    photoCtx.ellipse(290, 200, 18, 22, 0, 0, Math.PI * 2);
    photoCtx.fill();

    photoCtx.fillStyle = 'white';
    photoCtx.beginPath();
    photoCtx.arc(228, 192, 8, 0, Math.PI * 2);
    photoCtx.fill();
    photoCtx.beginPath();
    photoCtx.arc(296, 192, 8, 0, Math.PI * 2);
    photoCtx.fill();

    photoCtx.strokeStyle = '#8b5a3c';
    photoCtx.lineWidth = 4;
    photoCtx.beginPath();
    photoCtx.arc(256, 250, 40, 0.1, Math.PI - 0.1);
    photoCtx.stroke();

    photoCtx.fillStyle = 'rgba(255,150,150,0.3)';
    photoCtx.beginPath();
    photoCtx.ellipse(190, 240, 30, 20, 0, 0, Math.PI * 2);
    photoCtx.fill();
    photoCtx.beginPath();
    photoCtx.ellipse(322, 240, 30, 20, 0, 0, Math.PI * 2);
    photoCtx.fill();

    photoCtx.fillStyle = '#2c3e50';
    photoCtx.beginPath();
    photoCtx.moveTo(180, 300);
    photoCtx.quadraticCurveTo(256, 340, 332, 300);
    photoCtx.fill();

    photoCtx.restore();

    photoCtx.beginPath();
    photoCtx.arc(256, 256, 230, 0, Math.PI * 2);
    photoCtx.strokeStyle = 'rgba(255,255,255,0.9)';
    photoCtx.lineWidth = 10;
    photoCtx.stroke();
}
drawFixedAvatar();
const loader = new THREE.TextureLoader();
const photoTexture = loader.load('../../images/main/president.png');
photoTexture.colorSpace = THREE.SRGBColorSpace;
const matPhoto = new THREE.MeshStandardMaterial({ map: photoTexture, roughness: 0.3, metalness: 0.05 });
const photoDisc = new THREE.Mesh(new THREE.CircleGeometry(0.32, 48), matPhoto);
photoDisc.position.set(0, 1.72, 0.32);
photoDisc.castShadow = true;
photoDisc.name = 'photoDisc';
addSliderMesh(photoDisc);
const discRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 16, 64), matDiscRing);
discRing.position.set(0, 1.72, 0.32);
discRing.castShadow = true;
addSliderMesh(discRing);
const stemConn = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 16), matMetalDark);
stemConn.position.set(0, 1.57, 0.21);
stemConn.castShadow = true;
addSliderMesh(stemConn);
sliderGroup.position.set(0, 0, 0);
mainGroup.add(sliderGroup);

const groundGeo = new THREE.PlaneGeometry(14, 14);
const groundMat = new THREE.MeshStandardMaterial({ color: '#2a2a3a', roughness: 0.85, metalness: 0.05,
    transparent: true, opacity: 0.5 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.6;
ground.receiveShadow = true;
scene.add(ground);
const gridH = new THREE.PolarGridHelper(5, 40, 24, 64, '#444466', '#333350');
gridH.position.y = -0.58;
scene.add(gridH);

// ==================== BGM 音频系统 ====================
let audioCtx = null;
let bgmActive = true;
let bgmStarted = false;
const masterGain = { node: null };
const melodyGain = { node: null };
const drumGain = { node: null };
let compressorNode = null;
let currentResistanceForAudio = 25;

const melodyNotes = [
    392.00, 523.25, 659.25, 783.99,
    1046.50, 783.99, 659.25, 523.25,
    392.00, 523.25, 659.25, 783.99,
    1046.50, 1318.51, 1046.50, 783.99,
    659.25, 523.25, 392.00, 329.63,
    392.00, 523.25, 659.25, 523.25,
    392.00, 329.63, 261.63, 392.00,
    523.25, 659.25, 783.99, 1046.50
];
const melodyDurations = [
    0.22, 0.22, 0.22, 0.35,
    0.40, 0.22, 0.22, 0.35,
    0.22, 0.22, 0.22, 0.35,
    0.40, 0.25, 0.25, 0.35,
    0.22, 0.22, 0.35, 0.40,
    0.22, 0.22, 0.22, 0.35,
    0.40, 0.35, 0.50, 0.35,
    0.22, 0.22, 0.35, 0.50
];
let noteIndex = 0;
let noteAccum = 0;
const baseBPM = 128;
let lastScheduleTime = 0;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new(window.AudioContext || window.webkitAudioContext)();
    compressorNode = audioCtx.createDynamicsCompressor();
    compressorNode.threshold.value = -24;
    compressorNode.knee.value = 30;
    compressorNode.ratio.value = 12;
    compressorNode.attack.value = 0.003;
    compressorNode.release.value = 0.25;
    compressorNode.connect(audioCtx.destination);

    masterGain.node = audioCtx.createGain();
    masterGain.node.gain.value = 0.55;
    masterGain.node.connect(compressorNode);

    melodyGain.node = audioCtx.createGain();
    melodyGain.node.gain.value = 0.65;
    melodyGain.node.connect(masterGain.node);

    drumGain.node = audioCtx.createGain();
    drumGain.node.gain.value = 0.5;
    drumGain.node.connect(masterGain.node);

    lastScheduleTime = audioCtx.currentTime;
    bgmStarted = true;
}

function playTrumpetNote(freq, startTime, duration, resistance) {
    if (!audioCtx || !bgmActive) return;
    const t = Math.max(audioCtx.currentTime, startTime);
    const semitoneShift = 3 - (resistance / 50) * 10;
    const pitchMultiplier = Math.pow(2, semitoneShift / 12);
    const actualFreq = freq * pitchMultiplier;
    const rateFactor = 1.25 - (resistance / 50) * 0.9;
    const actualDuration = duration / Math.max(0.35, rateFactor);
    const wobbleDepth = Math.max(0, (resistance - 30) / 20) * 15;
    const now = t;

    const noteGain = audioCtx.createGain();
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(0.7, now + 0.015);
    noteGain.gain.setValueAtTime(0.7, now + actualDuration * 0.7);
    noteGain.gain.linearRampToValueAtTime(0.001, now + actualDuration);
    noteGain.connect(melodyGain.node);

    const osc1 = audioCtx.createOscillator();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(actualFreq, now);
    if (wobbleDepth > 0.5) {
        const wobble = audioCtx.createOscillator();
        wobble.type = 'sine';
        wobble.frequency.value = 3 + Math.random() * 5;
        const wobbleGain = audioCtx.createGain();
        wobbleGain.gain.value = wobbleDepth;
        wobble.connect(wobbleGain);
        wobbleGain.connect(osc1.frequency);
        wobble.start(now);
        wobble.stop(now + actualDuration);
    }
    osc1.connect(noteGain);
    osc1.start(now);
    osc1.stop(now + actualDuration + 0.05);

    const osc2 = audioCtx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(actualFreq * 0.5, now);
    const osc2Gain = audioCtx.createGain();
    osc2Gain.gain.value = 0.2;
    osc2.connect(osc2Gain);
    osc2Gain.connect(noteGain);
    osc2.start(now);
    osc2.stop(now + actualDuration + 0.05);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1800 - resistance * 25;
    filter.Q.value = 1.5;
    noteGain.disconnect();
    noteGain.connect(filter);
    filter.connect(melodyGain.node);
}

function playKick(time) {
    if (!audioCtx || !bgmActive) return;
    const t = Math.max(audioCtx.currentTime, time);
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.18);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(1.0, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g);
    g.connect(drumGain.node);
    osc.start(t);
    osc.stop(t + 0.22);
}

function playSnare(time) {
    if (!audioCtx || !bgmActive) return;
    const t = Math.max(audioCtx.currentTime, time);
    const bufferSize = audioCtx.sampleRate * 0.12;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.03));
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2500;
    bp.Q.value = 0.7;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.6, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    src.connect(bp);
    bp.connect(g);
    g.connect(drumGain.node);
    src.start(t);
    src.stop(t + 0.14);
}

let drumBeatCounter = 0;

function updateAudioSchedule(deltaSec, resistance) {
    if (!audioCtx || !bgmActive || !bgmStarted) return;
    currentResistanceForAudio = resistance;
    const rateFactor = 1.25 - (resistance / 50) * 0.9;
    const effectiveBPM = baseBPM * Math.max(0.35, rateFactor);
    const beatDuration = 60 / effectiveBPM;
    noteAccum += deltaSec;
    const noteDur = melodyDurations[noteIndex] * (60 / baseBPM) / Math.max(0.35, rateFactor);
    if (noteAccum >= noteDur) {
        noteAccum -= noteDur;
        const schedTime = audioCtx.currentTime + 0.02;
        playTrumpetNote(melodyNotes[noteIndex], schedTime, noteDur, resistance);
        noteIndex = (noteIndex + 1) % melodyNotes.length;
        drumBeatCounter++;
        if (drumBeatCounter % 2 === 0) playKick(schedTime);
        if (drumBeatCounter % 4 === 2) playSnare(schedTime);
        if (drumBeatCounter >= 8) drumBeatCounter = 0;
    }
}

function updateBgmUI(resistance) {
    if (!bgmStarted || !bgmActive) {
        bgmStatusEl.textContent = '🔇 静音';
        bgmStatusEl.style.color = '#888';
        return;
    }
    const r = resistance;
    if (r < 8) { bgmStatusEl.textContent = '🔊 激昂!!';
        bgmStatusEl.style.color = '#ff6'; } else if (r < 20) { bgmStatusEl.textContent = '🔊 高昂';
        bgmStatusEl.style.color = '#ffa'; } else if (r < 35) { bgmStatusEl.textContent = '🎵 正常';
        bgmStatusEl.style.color = '#8ef'; } else if (r < 45) { bgmStatusEl.textContent = '😅 走调';
        bgmStatusEl.style.color = '#faa'; } else { bgmStatusEl.textContent = '💤 泄气...';
        bgmStatusEl.style.color = '#f66'; }
}

// ==================== 滑块拖拽逻辑 ====================
const SLIDER_MIN_X = -1.78;
const SLIDER_MAX_X = 1.78;
const raycaster = new THREE.Raycaster();
raycaster.far = 12;
const mouse = new THREE.Vector2();
const intersectionPoint = new THREE.Vector3();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.72);
let isDraggingSlider = false;
let hoveredOnSlider = false;

function getSliderIntersection(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(sliderMeshes, false);
    if (hits.length > 0) return { hit: true, point: hits[0].point.clone() };
    const planeHit = raycaster.ray.intersectPlane(dragPlane, intersectionPoint);
    if (planeHit) return { hit: false, point: planeHit.clone(), onPlane: true };
    return null;
}

function updateSliderPosition(worldX) {
    const clampedX = Math.max(SLIDER_MIN_X, Math.min(SLIDER_MAX_X, worldX));
    sliderGroup.position.x = clampedX;
    updateDisplay(clampedX);
    if (!audioCtx && bgmActive) initAudio();
    updateBgmUI(getResistanceFromX(clampedX));
}

function getResistanceFromX(x) { return ((x - SLIDER_MIN_X) / (SLIDER_MAX_X - SLIDER_MIN_X)) * 50; }

function getTitleIndexFromX(x) {
    const r = getResistanceFromX(x);
    if (r < 12.5) return 0;
    if (r < 25.5) return 1;
    if (r < 38.5) return 2;
    return 3;
}

function updateDisplay(x) {
    const resistance = getResistanceFromX(x);
    ledDisplay.textContent = resistance.toFixed(1);
    const idx = getTitleIndexFromX(x);
    currentTitleDisplay.textContent = titlePlanes[idx].title;
    currentResistanceForAudio = resistance;
}

function onPointerDown(event) {
    if (event.target !== renderer.domElement && !renderer.domElement.contains(event.target)) return;
    if (!audioCtx && bgmActive) initAudio();
    const result = getSliderIntersection(event);
    if (result && result.hit) {
        isDraggingSlider = true;
        controls.enabled = false;
        renderer.domElement.style.cursor = 'grabbing';
        hintText.style.opacity = '0';
        updateSliderPosition(result.point.x);
        event.preventDefault();
        event.stopPropagation();
    }
}

function onPointerMove(event) {
    if (isDraggingSlider) {
        const result = getSliderIntersection(event);
        if (result && result.onPlane !== undefined) {
            const pr = raycaster.ray.intersectPlane(dragPlane, intersectionPoint);
            if (pr) updateSliderPosition(pr.x);
        } else if (result && result.point) { updateSliderPosition(result.point.x); }
        renderer.domElement.style.cursor = 'grabbing';
    } else {
        const result = getSliderIntersection(event);
        renderer.domElement.style.cursor = result && result.hit ? 'grab' : '';
        hoveredOnSlider = !!(result && result.hit);
    }
}

function onPointerUp() {
    if (isDraggingSlider) {
        isDraggingSlider = false;
        controls.enabled = true;
        renderer.domElement.style.cursor = hoveredOnSlider ? 'grab' : '';
        hintText.style.opacity = '1';
        setTimeout(() => { hintText.style.opacity = '1'; }, 2000);
    }
}
renderer.domElement.addEventListener('pointerdown', onPointerDown, { passive: false });
document.addEventListener('pointermove', onPointerMove, { passive: false });
document.addEventListener('pointerup', onPointerUp);
document.addEventListener('pointerleave', onPointerUp);
document.addEventListener('pointercancel', onPointerUp);
renderer.domElement.addEventListener('touchstart', (e) => {
    const res = getSliderIntersection(e.touches[0] || e);
    if (res && res.hit) e.preventDefault();
}, { passive: false });

updateDisplay(sliderGroup.position.x);
updateBgmUI(25);

window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
});
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && !isDraggingSlider) {
        updateSliderPosition(sliderGroup.position.x - 0.08);
        e.preventDefault();
    }
    if (e.key === 'ArrowRight' && !isDraggingSlider) {
        updateSliderPosition(sliderGroup.position.x + 0.08);
        e.preventDefault();
    }
    if (['0', '1', '2', '3'].includes(e.key)) {
        updateSliderPosition(labelXPositions[parseInt(e.key)]);
    }
});

// ==================== 渲染循环 ====================
let lastFrameTime = performance.now();

function animate(timestamp) {
    requestAnimationFrame(animate);
    const deltaSec = Math.min((timestamp - lastFrameTime) / 1000, 0.2);
    lastFrameTime = timestamp;
    controls.update();

    const time = performance.now();
    const resistance = getResistanceFromX(sliderGroup.position.x);
    const leftResistance = resistance;
    const blinkRaw = (Math.sin(time * 0.01) + 1) / 2;

    let leftIntensity = 0;
    if (leftResistance < 10) {
        leftIntensity = blinkRaw * 6.0;
    } else {
        leftIntensity = Math.max(0, 1 - (sliderGroup.position.x - SLIDER_MIN_X) / 0.35) * 5.0;
    }
    const rightIntensity = Math.max(0, 1 - (SLIDER_MAX_X - sliderGroup.position.x) / 0.35) * 5.0;

    indicatorItems.forEach(item => {
        const intensity = item.side === 'left' ? leftIntensity : rightIntensity;
        item.mesh.material.emissiveIntensity = intensity;
        item.sprite.material.opacity = (intensity / 5) * 0.9;
        const scale = 0.4 + (intensity / 5) * 0.3;
        item.sprite.scale.set(scale, scale, 1);
    });

    matDiscRing.emissiveIntensity = leftResistance < 10 ? blinkRaw * 4.0 : 0;

    if (bgmActive && bgmStarted) {
        updateAudioSchedule(deltaSec, currentResistanceForAudio);
    }
    renderer.render(scene, camera);
}
requestAnimationFrame(animate);
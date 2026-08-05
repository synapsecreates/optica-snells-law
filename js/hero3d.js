// hero3d.js — Three.js glass prism hero scene
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function initHeroScene() {
  const mount = document.getElementById('heroScene');
  if (!mount) return;

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, 0.1, 100);
  camera.position.set(0, 0.6, 6.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  mount.appendChild(renderer.domElement);

  // ---------- lights ----------
  scene.add(new THREE.AmbientLight(0x304060, 0.6));
  const key = new THREE.PointLight(0x8fdcff, 22, 20, 2);
  key.position.set(3, 3, 4);
  scene.add(key);
  const rim = new THREE.PointLight(0xa88bff, 16, 20, 2);
  rim.position.set(-4, -2, -3);
  scene.add(rim);

  // ---------- environment (simple gradient cube for reflections) ----------
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envGeo = new THREE.SphereGeometry(20, 16, 16);
  const envMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {},
    vertexShader: `varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vPos;
      void main(){
        float h = normalize(vPos).y * 0.5 + 0.5;
        vec3 top = vec3(0.11, 0.20, 0.32);
        vec3 bottom = vec3(0.02, 0.03, 0.06);
        vec3 col = mix(bottom, top, h);
        col += vec3(0.15,0.35,0.5) * smoothstep(0.6,1.0,h) * 0.4;
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  envScene.add(new THREE.Mesh(envGeo, envMat));
  const envTex = pmrem.fromScene(envScene, 0.04).texture;
  scene.environment = envTex;

  // ---------- prism geometry (triangular) ----------
  const prismGroup = new THREE.Group();
  const shape = new THREE.Shape();
  const R = 1.15;
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
    const x = Math.cos(a) * R, y = Math.sin(a) * R;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  shape.closePath();
  const extrude = new THREE.ExtrudeGeometry(shape, { depth: 1.6, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3, curveSegments: 3 });
  extrude.center();

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xbfe9ff,
    metalness: 0,
    roughness: 0.02,
    transmission: 1.0,
    thickness: 1.6,
    ior: 1.52,
    reflectivity: 0.6,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.4,
    attenuationColor: new THREE.Color(0x8fd8ff),
    attenuationDistance: 2.5,
  });
  const prism = new THREE.Mesh(extrude, glassMat);
  prismGroup.add(prism);

  // edge highlight
  const edges = new THREE.EdgesGeometry(extrude, 20);
  const edgeLines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.35 }));
  prismGroup.add(edgeLines);

  // tilt so the camera sees a 3/4 view: one triangular end cap *and* a long side face,
  // which is what actually reads as "a glass prism" rather than a flat panel.
  prismGroup.rotation.set(-0.35, 0.55, 0.12);
  scene.add(prismGroup);

  // ---------- incoming / outgoing light beam ----------
  const beamGroup = new THREE.Group();
  scene.add(beamGroup);

  function makeBeam(color, length) {
    const geo = new THREE.CylinderGeometry(0.018, 0.018, length, 8, 1, true);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  const beamIn = makeBeam(0xffffff, 3.2);
  beamIn.position.set(-2.6, 0.55, 0);
  beamIn.rotation.z = Math.PI / 2 - 0.5;
  beamGroup.add(beamIn);

  const colors = [0xff5a5a, 0x64ff9a, 0x5aa0ff];
  const beamsOut = colors.map((c, i) => {
    const b = makeBeam(c, 2.6);
    b.position.set(1.9 + i * 0.05, -0.35 - i * 0.12, 0);
    b.rotation.z = Math.PI / 2 + 0.55 + i * 0.08;
    b.material.opacity = 0.85;
    beamGroup.add(b);
    return b;
  });

  // small glow sprites at entry/exit points
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,0.9)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  function makeGlow(pos, color, scale = 0.5) {
    const mat = new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const spr = new THREE.Sprite(mat);
    spr.position.copy(pos);
    spr.scale.set(scale, scale, 1);
    beamGroup.add(spr);
    return spr;
  }
  makeGlow(new THREE.Vector3(-1.05, 0.28, 0), 0x9fe8ff, 0.45);
  const exitGlow = makeGlow(new THREE.Vector3(1.0, -0.25, 0), 0xffffff, 0.55);

  // floating particulate dust
  const dustCount = 90;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 9;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 5;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 6;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x7fd6ff, size: 0.02, transparent: true, opacity: 0.5 }));
  scene.add(dust);

  // ---------- controls ----------
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  controls.minPolarAngle = Math.PI / 2 - 0.5;
  controls.maxPolarAngle = Math.PI / 2 + 0.5;

  // ---------- resize ----------
  function onResize() {
    const w = mount.clientWidth, h = mount.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);
  new ResizeObserver(onResize).observe(mount);

  // ---------- render loop ----------
  const clock = new THREE.Clock();
  let visible = true;
  const io = new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }, { threshold: 0.05 });
  io.observe(mount);

  function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;
    const t = clock.getElapsedTime();
    controls.update();

    beamsOut.forEach((b, i) => {
      b.material.opacity = 0.55 + Math.sin(t * 2 + i) * 0.2;
    });
    exitGlow.material.opacity = 0.6 + Math.sin(t * 3) * 0.3;
    dust.rotation.y = t * 0.02;

    renderer.render(scene, camera);
  }
  animate();
}

import * as Three from 'three';
import * as dat from 'dat.gui';

import Particle from './Particle';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const scene = new Three.Scene();

const bSize = 2;

const camera = new Three.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.translateZ(20);

const renderer = new Three.WebGLRenderer()
renderer.setSize( window.innerWidth, window.innerHeight );

function generateParticles(count: number): Particle[] {
  const particles: Particle[] = [];

  const variance = 1.0;

  const [minMass, maxMass] = [0.1, 0.1];

  for(let i = 0; i < count; ++i) {
    const x = Math.random() * (2*variance) + (-variance);
    const y = Math.random() * (2*variance) + (-variance);
    const z = Math.random() * (2*variance) + (-variance);

    const pos = new Three.Vector3(x, y, z);
    const mass = Math.random() * (maxMass - minMass) + minMass;
    particles.push(new Particle(pos, mass));
  }

  return particles;
}

function updateParticleCount(newCount: number) {
  for(let i = 0; i < currParticles.length; ++i) {
    const mesh = currParticles[i].mesh;
    scene.remove(mesh);
  }

  currParticles = generateParticles(newCount);

  for(let i = 0; i < currParticles.length; ++i) {
    scene.add(currParticles[i].mesh);
  }
}

function createLines(bSize: number): Three.Line {
  const linesMaterial = new Three.LineBasicMaterial( { color: 0x00FF00 } );
  const linesGeometry = new Three.Geometry();

  // Add vertices.
  linesGeometry.vertices.push(new Three.Vector3(-bSize, -bSize, -bSize));
  linesGeometry.vertices.push(new Three.Vector3(bSize, -bSize, -bSize));
  linesGeometry.vertices.push(new Three.Vector3(bSize, bSize, -bSize));
  linesGeometry.vertices.push(new Three.Vector3(-bSize, bSize, -bSize));
  linesGeometry.vertices.push(new Three.Vector3(-bSize, -bSize, -bSize));
  linesGeometry.vertices.push(new Three.Vector3(-bSize, -bSize, bSize));
  linesGeometry.vertices.push(new Three.Vector3(-bSize, -bSize, bSize));
  linesGeometry.vertices.push(new Three.Vector3(bSize, -bSize, bSize));
  linesGeometry.vertices.push(new Three.Vector3(bSize, bSize, bSize));
  linesGeometry.vertices.push(new Three.Vector3(-bSize, bSize, bSize));
  linesGeometry.vertices.push(new Three.Vector3(-bSize, -bSize, bSize));
  linesGeometry.vertices.push(new Three.Vector3(-bSize, bSize, bSize));
  linesGeometry.vertices.push(new Three.Vector3(-bSize, bSize, -bSize));
  linesGeometry.vertices.push(new Three.Vector3(bSize, bSize, -bSize));
  linesGeometry.vertices.push(new Three.Vector3(bSize, bSize, bSize));
  linesGeometry.vertices.push(new Three.Vector3(bSize, -bSize, bSize));
  linesGeometry.vertices.push(new Three.Vector3(bSize, -bSize, -bSize));


  const lines = new Three.Line(linesGeometry, linesMaterial);
  return lines;
}

const lines = createLines(bSize);
// Add lines.
scene.add(lines);
let gravitationalConst = 40;
const gravityScalar = 0.00002;
function createGUI() {
  const GUIObj = {
    message: 'Hello, world!',
    Gravity: gravitationalConst,
    'Particle amount': 10
  };

  const gui = new dat.GUI();

  gui.add(GUIObj, 'message');
  const gravityController = gui.add(GUIObj, 'Gravity', 1, 100);
  gravityController.onChange((g: any) => {
    gravitationalConst = g as number;
  });

  const particleCountController = gui.add(GUIObj, 'Particle amount', 1, 50);
  particleCountController.onChange((count: any) => {
    updateParticleCount(count as number);
  });
}

createGUI();

function initializeParticles(particleCount: number) {
  let currParticles = generateParticles(particleCount);
  currParticles.forEach((p) => {
    p.updateMesh();
    scene.add(p.mesh);
  });
  return currParticles;
}

let currParticles = initializeParticles(10);

function init(bSize: number) {

  // Create container box
  const bGeometry = new Three.BoxGeometry(bSize * 2, bSize * 2, bSize * 2);
  const bMaterial = new Three.MeshBasicMaterial( { color: 0xefefef } );
  bMaterial.opacity = 0.1;
  bMaterial.transparent = true;
  const bBoxMesh = new Three.Mesh(bGeometry, bMaterial);
  scene.add(bBoxMesh);

  // Add controls
  const controls = new OrbitControls( camera, renderer.domElement );
  controls.screenSpacePanning = false;
  controls.minDistance = 4;
  controls.maxDistance = 8;
  controls.zoomSpeed = 2;

  controls.maxPolarAngle = Math.PI;

}

let lastTime = 0;
const targetFrameRate = 120;

const bBox = new Three.Vector3(bSize, bSize, bSize);
function mainLoop() {
  requestAnimationFrame(mainLoop);
  currParticles.forEach((p) => {
    p.update(currParticles, gravitationalConst * gravityScalar, bBox, bSize);
    p.updateMesh();
  })

  const now = Date.now();
  if(now - lastTime >= (1 / targetFrameRate) * 1000) {
    lastTime = Date.now();
    renderer.render(scene, camera);
  }
}

init(bSize);
mainLoop();

document.body.appendChild( renderer.domElement );

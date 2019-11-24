import * as Three from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Particle from './Particle';
import calculateRelativeStats from './ParticleHelpers';

const bSize = 2;
const bBox = new Three.Vector3(bSize, bSize, bSize);
enum ColorMode {
  NORMAL,
  SPEED,
  ACCELERATION
}
let currColorMode = ColorMode.NORMAL;
const lines = createLines(bSize);
const scene = new Three.Scene();
// Add lines.
scene.add(lines);
let gravitationalConst = 40;
const gravityScalar = 0.00003;
let articifialForce = new Three.Vector3(0, 0, 0);
const artificialScalar = 0.000005;
let currParticles = initializeParticles(10);


const camera = new Three.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.translateZ(6);

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
  const linesMaterial = new Three.LineBasicMaterial( { color: 0xFFFFFF } );
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

function stopAllMotion() {
  currParticles.forEach((p) => {
    p.stop();
  });
}

function createGUI() {
  const GUIObj = {
    Gravity: gravitationalConst,
    'Particle amount': 10,
    'Display Mode': 'NORMAL',
    'STOP MOTION': stopAllMotion,

    'Force X': 0,
    'Force Y': 0,
    'Force Z': 0,
  };

  const gui = new dat.GUI();
  const gravityController = gui.add(GUIObj, 'Gravity', 0, 100);
  gravityController.onChange((g: any) => {
    gravitationalConst = g as number;
  });

  const particleCountController = gui.add(GUIObj, 'Particle amount', 1, 50);
  particleCountController.onChange((count: any) => {
    updateParticleCount(count as number);
  });

  const colorOptions = ['NORMAL', 'SPEED', 'ACCELERATION'];
  const colorController = gui.add(GUIObj, 'Display Mode', colorOptions);
  colorController.onChange((mode: any) => {
    const color = colorOptions.indexOf(mode);
    currColorMode = color;
  });

  gui.add(GUIObj, 'STOP MOTION');

  const articifialForceFolder = gui.addFolder('Force');
  const forceXController = articifialForceFolder.add(GUIObj, 'Force X', -100, 100);
  const forceYController = articifialForceFolder.add(GUIObj, 'Force Y', -100, 100);
  const forceZController = articifialForceFolder.add(GUIObj, 'Force Z', -100, 100);

  forceXController.onChange((x: any) => {
    articifialForce.setX(x as number);
  });

  forceYController.onChange((y: any) => {
    articifialForce.setY(y as number);
  });

  forceZController.onChange((z: any) => {
    articifialForce.setZ(z as number);
  });

  articifialForceFolder.open();
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
  controls.enableKeys = false;

  controls.maxPolarAngle = Math.PI;

}

let lastTime = 0;
const targetFrameRate = 120;

function createTotalVector(totalAcceleration: Three.Vector3, color: number): Three.Line {
  const material = new Three.LineBasicMaterial( { color } );
  const geometry = new Three.Geometry();
  geometry.vertices.push(new Three.Vector3(0, 0, 0));
  geometry.vertices.push(totalAcceleration);
  return new Three.Line(geometry, material);
}

let accelerationVectorMesh = createTotalVector(new Three.Vector3(1, 1, 1), 0x00FF00);
let velocityVectorMesh = createTotalVector(new Three.Vector3(1, 1, 1), 0xFF0000);
// scene.add(accelerationVectorMesh);
// scene.add(velocityVectorMesh);
function mainLoop() {
  requestAnimationFrame(mainLoop);

  const [relativeSpeeds, relativeAccelerations] = calculateRelativeStats(currParticles);
  let totalAccelerationVector = new Three.Vector3(0, 0, 0);
  let totalVelocityVector = new Three.Vector3(0, 0, 0);
  currParticles.forEach((p) => {
    totalAccelerationVector.add(p.acceleration);
    totalVelocityVector.add(p.velocity);
    if(currParticles.length == 1) {
      p.setColor(1);
    } else {
      switch(currColorMode) {
        case ColorMode.SPEED:
          p.setColor(relativeSpeeds.get(p) as number);
          break;
        case ColorMode.ACCELERATION:
          p.setColor(relativeAccelerations.get(p) as number);
          break;
        default:
          p.setColor(1);
      }
    }

    const artificial = articifialForce.clone()
    p.update(currParticles, gravitationalConst * gravityScalar, bBox, bSize, artificial.multiplyScalar(artificialScalar));
    p.updateMesh();
  });

  totalAccelerationVector.multiplyScalar(1000);
  accelerationVectorMesh.geometry.vertices[1].setY(totalAccelerationVector.y);
  accelerationVectorMesh.geometry.vertices[1].setX(totalAccelerationVector.x);
  accelerationVectorMesh.geometry.vertices[1].setZ(totalAccelerationVector.z);

  accelerationVectorMesh.geometry.verticesNeedUpdate = true;



  totalVelocityVector.multiplyScalar(1000);
  velocityVectorMesh.geometry.vertices[1].setY(totalVelocityVector.y);
  velocityVectorMesh.geometry.vertices[1].setX(totalVelocityVector.x);
  velocityVectorMesh.geometry.vertices[1].setZ(totalVelocityVector.z);

  velocityVectorMesh.geometry.verticesNeedUpdate = true;

  // console.log(totalAccelerationVector);
  // scene.add(accelerationVectorMesh);
  const now = Date.now();
  if(now - lastTime >= (1 / targetFrameRate) * 1000) {
    lastTime = Date.now();
    renderer.render(scene, camera);
  }
}

init(bSize);
mainLoop();

document.body.appendChild( renderer.domElement );

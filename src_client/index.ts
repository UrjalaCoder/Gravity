import * as Three from 'three';
import * as dat from 'dat.gui';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const scene = new Three.Scene();

const camera = new Three.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.translateZ(20);

const renderer = new Three.WebGLRenderer()
renderer.setSize( window.innerWidth, window.innerHeight );


function createMesh(radius: number): Three.Mesh {
  const geometry = new Three.SphereGeometry(radius);
  const material = new Three.MeshBasicMaterial();
  return new Three.Mesh(geometry, material);
}

class Particle {
  public position: Three.Vector3;
  private acceleration: Three.Vector3;
  private velocity: Three.Vector3;
  private force: Three.Vector3;
  public mass: number;
  public mesh: Three.Mesh;

  public static readonly PARTICLE_RADIUS = 0.2;
  public static readonly MAX_SPEED = 10;
  public static readonly REPULSE = 0.1;

  constructor(
    position: Three.Vector3,
    mass: number
  ) {
    this.position = position;
    this.mass = mass;

    // Initialize the variables.
    this.velocity = new Three.Vector3(0, 0, 0);
    this.acceleration = new Three.Vector3(0, 0, 0);
    this.force = new Three.Vector3(0, 0, 0);

    this.mesh = createMesh(this.mass / 10 + 0.1);
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);

  }

  // Calculate force from all other particles
  calculateForce(particles: Particle[], gravitationalConst: number) {
    const totalForce = particles.reduce((result, particle) => {
      // Check that the particle is not this.
      if(particle === this) {
        return result;
      }

      const diffX = this.position.x - particle.position.x;
      const diffY = this.position.y - particle.position.y;
      const diffZ = this.position.z - particle.position.z;

      const difference: Three.Vector3 = new Three.Vector3(0, 0, 0);
      difference.set(-diffX, -diffY, -diffZ);
      const distance = difference.length();

      if(distance <= Particle.PARTICLE_RADIUS) {
        return result;
      }

      const force = difference.multiplyScalar((this.mass * particle.mass * gravitationalConst) / Math.pow(distance, 2));
      // const repulse = difference.multiplyScalar((-1.0 * Particle.REPULSE) / Math.pow(distance, 20));
      return force.add(result);
    }, new Three.Vector3(0, 0, 0));
    return totalForce;
  }

  updateForce(particles: Particle[], gravitationalConst: number) {
    const result = this.calculateForce(particles, gravitationalConst);
    this.force.set(result.x, result.y, result.z);
    // console.log(this.force);
  }

  updateAcceleration() {
    const fx = this.force.x / this.mass;
    const fy = this.force.y / this.mass;
    const fz = this.force.z / this.mass;
    this.acceleration.set(fx, fy, fz);
  }

  updateVelocity() {
    this.velocity.add(this.acceleration);
    const clone = this.velocity.clone()
    if(this.velocity.length() >= Particle.MAX_SPEED) {
      // console.log('Bigger than max speed!', this.velocity.length());
      const newVel = clone.normalize().multiplyScalar(Particle.MAX_SPEED);
      this.velocity.set(newVel.x, newVel.y, newVel.z);
    }
  }

  updateMesh() {
    // console.log("updateMesh", this.position);
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
  }

  // Bounding box describes the box that the particles should be in.
  // The coordinates describe the positive corner.
  update(particles: Particle[], gravitationalConst: number, boundingBox: Three.Vector3, boundingBoxSize: number) {
    this.updateForce(particles, gravitationalConst)
    this.updateAcceleration();
    this.updateVelocity();
    this.position = this.position.add(this.velocity);


    this.updatePosition(boundingBox, boundingBoxSize);
  }

  updatePosition(boundingBox: Three.Vector3, boundingBoxSize: number) {

    const { x, y, z } = this.position;
    const margin = 0.1
    // First check the positive side
    let changed = false;
    if(x >= boundingBox.x) {
      changed = true;
      // this.velocity.setX(this.velocity.x * -1);
      this.position.setX(-boundingBoxSize + margin);
    } else if(y >= boundingBox.y) {
      changed = true;
      // this.velocity.setY(this.velocity.y * -1);
      this.position.setY(-boundingBoxSize + margin);
    } else if(z >= boundingBox.z) {
      changed = true;
      // this.velocity.setZ(this.velocity.z * -1);
      this.position.setZ(-boundingBoxSize + margin);
    }

    // Negative side

    if(x <= -boundingBox.x) {
      changed = true;
      // this.velocity.setX(this.velocity.x * -1);
      this.position.setX(boundingBoxSize - margin);
    } else if(y <= -boundingBox.y) {
      changed = true;
      // this.velocity.setY(this.velocity.y * -1);
      this.position.setY(boundingBoxSize - margin);
    } else if(z <= -boundingBox.z) {
      changed = true;
      // this.velocity.setZ(this.velocity.z * -1);
      this.position.setZ(boundingBoxSize - margin);
    }

    if(changed) {
      // this.velocity.set(0, 0, 0);
      this.velocity.multiplyScalar(0.5);
    }

  }

}

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

const currParticles = generateParticles(10);

currParticles.forEach((p) => {
  p.updateMesh();
  scene.add(p.mesh);
});

const bSize = 2;
const bBox = new Three.Vector3(bSize, bSize, bSize);
const bGeometry = new Three.BoxGeometry(bSize * 2, bSize * 2, bSize * 2);
const bMaterial = new Three.MeshBasicMaterial( { color: 0xefefef } );
bMaterial.opacity = 0.1;
bMaterial.transparent = true;
const bBoxMesh = new Three.Mesh(bGeometry, bMaterial);
scene.add(bBoxMesh);

const lines = createLines(bSize);
// Add lines.
scene.add(lines);

// Use orbit controls from examples.
const controls = new OrbitControls( camera, renderer.domElement );
controls.screenSpacePanning = false;
controls.minDistance = 4;
controls.maxDistance = 8;
controls.zoomSpeed = 2;

controls.maxPolarAngle = Math.PI;


let gravitationalConst = 0.0005;

function createGUI() {

  const GUIObj = {
    message: 'Hello, world!',
    gravity: 0.0005,
  };

  const gui = new dat.GUI();

  gui.add(GUIObj, 'message');
  const gravityController = gui.add(GUIObj, 'gravity', 0.00001, 0.05);
  gravityController.onChange((g: any) => {
    gravitationalConst = g as number;
  });
}

createGUI();


function mainLoop() {
  requestAnimationFrame(mainLoop);
  currParticles.forEach((p) => {
    p.update(currParticles, gravitationalConst, bBox, bSize);
    p.updateMesh();
  })

  renderer.render(scene, camera);
}

mainLoop();

document.body.appendChild( renderer.domElement );

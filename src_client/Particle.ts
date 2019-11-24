
import * as Three from 'three';

export default class Particle {
  public position: Three.Vector3;
  public acceleration: Three.Vector3;
  public velocity: Three.Vector3;
  private force: Three.Vector3;
  public mass: number;
  public mesh: Three.Mesh;
  private material: Three.MeshBasicMaterial;

  public static readonly PARTICLE_RADIUS = 0.2;
  public static readonly MAX_SPEED = 1000;
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

    [this.mesh, this.material] = this.createMesh(this.mass / 10 + 0.1);
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);

  }

  getVelocity(): number {
    return this.velocity.length();
  }

  getAcceleration(): number {
    return this.acceleration.length();
  }

  setColor(relativeSpeed: number): void {
    if(relativeSpeed == 0 || Number.isNaN(relativeSpeed)) {
      this.material.color.setRGB(1, 0, 0);
    } else {

      this.material.color.setRGB(1.0 - relativeSpeed, relativeSpeed, 0.0);
    }
  }

  // Calculate force from all other particles
  calculateForce(particles: Particle[], gravitationalConst: number): Three.Vector3 {
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

  createMesh(radius: number): [Three.Mesh, Three.MeshBasicMaterial] {
    const geometry = new Three.SphereGeometry(radius);
    const material = new Three.MeshBasicMaterial();
    return [new Three.Mesh(geometry, material), material];
  }

  updateForce(particles: Particle[], gravitationalConst: number, force: Three.Vector3) {
    const result = this.calculateForce(particles, gravitationalConst);
    this.force.set(result.x, result.y, result.z);
    this.force.add(force);
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

  stop() {
    this.velocity.set(0, 0, 0);
    this.acceleration.set(0, 0, 0);
  }

  updateMesh() {
    // console.log("updateMesh", this.position);
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
  }

  // Bounding box describes the box that the particles should be in.
  // The coordinates describe the positive corner.
  update(particles: Particle[], gravitationalConst: number, boundingBox: Three.Vector3, boundingBoxSize: number, force: Three.Vector3) {
    this.updateForce(particles, gravitationalConst, force);
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

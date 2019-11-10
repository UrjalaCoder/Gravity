import Particle from './Particle';

// Assume that particles.length() > 0.
function calculateRelativeStats(particles: Particle[]): [Map<Particle, number>, Map<Particle, number>] {
  const velocities = particles.map((p) => p.getVelocity());
  const max = Math.max(...velocities);

  const accelerations = particles.map((p) => p.getAcceleration());
  const maxAcceleration = Math.max(...accelerations);

  const relativeSpeeds = new Map<Particle, number>();
  const relativeAccelerations = new Map<Particle, number>();
  for(let i = 0; i < particles.length; ++i) {
    const speed = particles[i].getVelocity();
    const relativeSpeed = (speed) / max;

    const acceleration = particles[i].getAcceleration();

    const relativeAcc = (acceleration) / maxAcceleration;

    relativeSpeeds.set(particles[i], relativeSpeed);
    relativeAccelerations.set(particles[i], relativeAcc);
  }

  return [relativeSpeeds, relativeAccelerations];
}

export default calculateRelativeStats;

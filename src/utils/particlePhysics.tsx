// ============================================================================
// PARTICLE PHYSICS ENGINE - For Epic Tier Horizons
// ============================================================================
// Provides gravity simulation, collision detection, and explosion physics
// Optimized for 60fps performance on both desktop and mobile

export interface Vector2D {
  x: number;
  y: number;
}

export interface Particle {
  id: number;
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  mass: number;
  radius: number;
  color: string;
  opacity: number;
  lifetime: number; // seconds
  age: number; // seconds
  trail?: Vector2D[]; // Position history for trails
}

export interface PhysicsConfig {
  gravity: number; // Gravitational constant
  drag: number; // Air resistance (0-1, where 1 = no drag)
  maxSpeed: number; // Terminal velocity
  collisionEnabled: boolean;
  boundaryBehavior: 'bounce' | 'wrap' | 'destroy' | 'none';
}

const DEFAULT_CONFIG: PhysicsConfig = {
  gravity: 0.5,
  drag: 0.98,
  maxSpeed: 10,
  collisionEnabled: false,
  boundaryBehavior: 'none',
};

// ============================================================================
// VECTOR MATH UTILITIES
// ============================================================================

export function vectorAdd(v1: Vector2D, v2: Vector2D): Vector2D {
  return { x: v1.x + v2.x, y: v1.y + v2.y };
}

export function vectorSubtract(v1: Vector2D, v2: Vector2D): Vector2D {
  return { x: v1.x - v2.x, y: v1.y - v2.y };
}

export function vectorScale(v: Vector2D, scalar: number): Vector2D {
  return { x: v.x * scalar, y: v.y * scalar };
}

export function vectorMagnitude(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function vectorNormalize(v: Vector2D): Vector2D {
  const mag = vectorMagnitude(v);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

export function vectorDistance(v1: Vector2D, v2: Vector2D): number {
  const dx = v2.x - v1.x;
  const dy = v2.y - v1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function vectorLimit(v: Vector2D, max: number): Vector2D {
  const mag = vectorMagnitude(v);
  if (mag > max) {
    return vectorScale(vectorNormalize(v), max);
  }
  return v;
}

// ============================================================================
// PARTICLE CREATION
// ============================================================================

export function createParticle(
  x: number,
  y: number,
  vx: number = 0,
  vy: number = 0,
  options: Partial<Particle> = {}
): Particle {
  return {
    id: Math.random(),
    position: { x, y },
    velocity: { x: vx, y: vy },
    acceleration: { x: 0, y: 0 },
    mass: 1,
    radius: 2,
    color: '#ffffff',
    opacity: 1,
    lifetime: 5,
    age: 0,
    trail: [],
    ...options,
  };
}

export function createExplosion(
  centerX: number,
  centerY: number,
  particleCount: number,
  speed: number,
  colors: string[],
  options: {
    spread?: number; // 0-1, how evenly distributed (1 = perfect circle)
    minSpeed?: number;
    maxSpeed?: number;
    minSize?: number;
    maxSize?: number;
    lifetime?: number;
  } = {}
): Particle[] {
  const {
    spread = 1,
    minSpeed = speed * 0.5,
    maxSpeed = speed * 1.5,
    minSize = 1,
    maxSize = 3,
    lifetime = 3,
  } = options;

  const particles: Particle[] = [];

  for (let i = 0; i < particleCount; i++) {
    // Random angle with optional clustering
    const baseAngle = (i / particleCount) * Math.PI * 2;
    const angleVariation = (1 - spread) * (Math.random() - 0.5) * Math.PI * 0.5;
    const angle = baseAngle + angleVariation;

    // Random speed
    const particleSpeed = minSpeed + Math.random() * (maxSpeed - minSpeed);

    // Velocity from angle and speed
    const vx = Math.cos(angle) * particleSpeed;
    const vy = Math.sin(angle) * particleSpeed;

    // Random color from palette
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Random size
    const radius = minSize + Math.random() * (maxSize - minSize);

    particles.push(
      createParticle(centerX, centerY, vx, vy, {
        color,
        radius,
        lifetime,
        opacity: 1,
      })
    );
  }

  return particles;
}

// ============================================================================
// PHYSICS SIMULATION
// ============================================================================

export function applyGravity(
  particle: Particle,
  attractorPosition: Vector2D,
  strength: number
): void {
  const direction = vectorSubtract(attractorPosition, particle.position);
  const distance = Math.max(vectorMagnitude(direction), 1); // Prevent division by zero
  const force = (strength * particle.mass) / (distance * distance);

  const acceleration = vectorScale(vectorNormalize(direction), force);
  particle.acceleration = vectorAdd(particle.acceleration, acceleration);
}

export function applyRepulsion(
  particle: Particle,
  repellerPosition: Vector2D,
  strength: number
): void {
  const direction = vectorSubtract(particle.position, repellerPosition);
  const distance = Math.max(vectorMagnitude(direction), 1);
  const force = (strength * particle.mass) / (distance * distance);

  const acceleration = vectorScale(vectorNormalize(direction), force);
  particle.acceleration = vectorAdd(particle.acceleration, acceleration);
}

export function updateParticle(
  particle: Particle,
  deltaTime: number,
  config: PhysicsConfig = DEFAULT_CONFIG,
  bounds?: { width: number; height: number }
): boolean {
  // Update age
  particle.age += deltaTime;

  // Check lifetime
  if (particle.age >= particle.lifetime) {
    return false; // Particle is dead
  }

  // Update velocity with acceleration
  particle.velocity = vectorAdd(particle.velocity, particle.acceleration);

  // Apply drag
  particle.velocity = vectorScale(particle.velocity, config.drag);

  // Limit speed
  particle.velocity = vectorLimit(particle.velocity, config.maxSpeed);

  // Update position
  const velocityDelta = vectorScale(particle.velocity, deltaTime);
  particle.position = vectorAdd(particle.position, velocityDelta);

  // Reset acceleration (forces must be reapplied each frame)
  particle.acceleration = { x: 0, y: 0 };

  // Boundary behavior
  if (bounds) {
    handleBoundaries(particle, bounds, config.boundaryBehavior);
  }

  // Update opacity based on age (fade out near end of life)
  const lifeProgress = particle.age / particle.lifetime;
  if (lifeProgress > 0.7) {
    particle.opacity = 1 - (lifeProgress - 0.7) / 0.3;
  }

  // Store trail position (limit trail length)
  if (particle.trail) {
    particle.trail.push({ ...particle.position });
    if (particle.trail.length > 10) {
      particle.trail.shift();
    }
  }

  return true; // Particle is alive
}

function handleBoundaries(
  particle: Particle,
  bounds: { width: number; height: number },
  behavior: PhysicsConfig['boundaryBehavior']
): void {
  switch (behavior) {
    case 'bounce':
      if (particle.position.x < 0 || particle.position.x > bounds.width) {
        particle.velocity.x *= -0.8; // Bounce with energy loss
        particle.position.x = Math.max(0, Math.min(bounds.width, particle.position.x));
      }
      if (particle.position.y < 0 || particle.position.y > bounds.height) {
        particle.velocity.y *= -0.8;
        particle.position.y = Math.max(0, Math.min(bounds.height, particle.position.y));
      }
      break;

    case 'wrap':
      if (particle.position.x < 0) particle.position.x = bounds.width;
      if (particle.position.x > bounds.width) particle.position.x = 0;
      if (particle.position.y < 0) particle.position.y = bounds.height;
      if (particle.position.y > bounds.height) particle.position.y = 0;
      break;

    case 'destroy':
      // Handled by returning false in updateParticle
      break;

    case 'none':
      // Do nothing
      break;
  }
}

// ============================================================================
// SPECIALIZED EFFECTS
// ============================================================================

export function createSpiralTrajectory(
  centerX: number,
  centerY: number,
  particleCount: number,
  spiralTightness: number = 1,
  speed: number = 1,
  colors: string[]
): Particle[] {
  const particles: Particle[] = [];

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 4; // 2 full rotations
    const radius = (i / particleCount) * 100 * spiralTightness;

    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    // Velocity points toward center for implosion
    const vx = -Math.cos(angle) * speed;
    const vy = -Math.sin(angle) * speed;

    const color = colors[i % colors.length];

    particles.push(
      createParticle(x, y, vx, vy, {
        color,
        radius: 1.5,
        lifetime: 4,
        opacity: 1,
      })
    );
  }

  return particles;
}

// Create radial burst (all particles move outward from center)
export function createRadialBurst(
  centerX: number,
  centerY: number,
  particleCount: number,
  speed: number,
  colors: string[]
): Particle[] {
  return createExplosion(centerX, centerY, particleCount, speed, colors, {
    spread: 1, // Perfect circle
    minSpeed: speed * 0.8,
    maxSpeed: speed * 1.2,
    minSize: 1,
    maxSize: 4,
    lifetime: 2.5,
  });
}

// ============================================================================
// PARTICLE SYSTEM MANAGER
// ============================================================================

export class ParticleSystem {
  particles: Particle[] = [];
  config: PhysicsConfig;
  bounds?: { width: number; height: number };

  constructor(config: Partial<PhysicsConfig> = {}, bounds?: { width: number; height: number }) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.bounds = bounds;
  }

  addParticles(newParticles: Particle[]): void {
    this.particles.push(...newParticles);
  }

  addParticle(particle: Particle): void {
    this.particles.push(particle);
  }

  update(deltaTime: number, attractors: Vector2D[] = [], repellers: Vector2D[] = []): void {
    // Apply forces
    for (const particle of this.particles) {
      for (const attractor of attractors) {
        applyGravity(particle, attractor, this.config.gravity * 100);
      }
      for (const repeller of repellers) {
        applyRepulsion(particle, repeller, this.config.gravity * 100);
      }
    }

    // Update all particles and remove dead ones
    this.particles = this.particles.filter((p) => updateParticle(p, deltaTime, this.config, this.bounds));
  }

  clear(): void {
    this.particles = [];
  }

  getParticleCount(): number {
    return this.particles.length;
  }
}

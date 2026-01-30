// ============================================================================
// BIG BANG HORIZON - "Genesis Eternal" (Epic Tier)
// ============================================================================
// Achievement: "Eternal Keeper" - Use Eras for 3 consecutive years
// 
// Features:
// - 200+ stars (desktop) / 60 stars (mobile) in parallax layers
// - 3-5 planets with orbital mechanics
// - Nebulae with rotation and glow effects
// - STAR IMPLOSION → EXPLOSION cycle every 30 seconds
// - Advanced particle physics with gravity simulation
// - Mobile-optimized performance

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ParticleSystem,
  createExplosion,
  createRadialBurst,
  type Particle,
  type Vector2D,
} from '../../utils/particlePhysics';

interface BigBangHorizonProps {
  height: string;
  positioning: string;
  performanceStyle: React.CSSProperties;
  isMobile?: boolean;
}

// Phases of the Big Bang cycle
type BigBangPhase = 'calm' | 'premonition' | 'implosion' | 'explosion' | 'aftermath';

// Color palettes
const STAR_COLORS = ['#ffffff', '#fff9e6', '#ffe4b3', '#ffd9a3', '#aac5ff', '#e0e6ff'];
const NEBULA_COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6', '#10b981'];
const EXPLOSION_COLORS = ['#ffffff', '#fff9e6', '#ffd700', '#ff8800', '#ff6b6b', '#4169e1'];

export function BigBangHorizon({ height, positioning, performanceStyle, isMobile = false }: BigBangHorizonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const phaseTimerRef = useRef<number>(0);

  // State
  const [phase, setPhase] = useState<BigBangPhase>('calm');
  const [implosionCenter, setImplosionCenter] = useState<Vector2D | null>(null);
  
  // Particle system
  const particleSystemRef = useRef<ParticleSystem | null>(null);

  // Performance config
  const STAR_COUNT = isMobile ? 60 : 200;
  const PLANET_COUNT = isMobile ? 2 : 4;
  const PARTICLE_COUNT_EXPLOSION = isMobile ? 400 : 1200; // MASSIVE increase from 150/500

  // Generate static stars (don't regenerate on each render)
  const stars = useMemo(() => {
    return Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage
      y: Math.random() * 100,
      size: 0.5 + Math.random() * 2,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      twinkleSpeed: 2 + Math.random() * 3,
      twinkleDelay: Math.random() * 2,
      layer: Math.floor(Math.random() * 3), // 0, 1, 2 for parallax
      opacity: 0.3 + Math.random() * 0.7,
    }));
  }, [STAR_COUNT]);

  // Generate planets
  const planets = useMemo(() => {
    return Array.from({ length: PLANET_COUNT }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60,
      y: 30 + Math.random() * 40,
      size: isMobile ? 8 + Math.random() * 15 : 15 + Math.random() * 30,
      color: ['#e07855', '#7ca3d6', '#f4d58d', '#8b6b5f'][i % 4],
      orbitSpeed: 60 + Math.random() * 40, // seconds per orbit
      orbitRadius: 2 + Math.random() * 3,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [PLANET_COUNT, isMobile]);

  // Generate nebulae
  const nebulae = useMemo(() => {
    if (isMobile) return []; // Skip on mobile for performance
    return Array.from({ length: 2 }, (_, i) => ({
      id: i,
      x: 30 + i * 40,
      y: 40 + i * 10,
      size: 100 + Math.random() * 80,
      color: NEBULA_COLORS[Math.floor(Math.random() * NEBULA_COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: 180 + Math.random() * 120, // seconds per rotation
    }));
  }, [isMobile]);

  // Initialize canvas and particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Initialize particle system with bounds
      if (!particleSystemRef.current) {
        particleSystemRef.current = new ParticleSystem(
          {
            gravity: 3,
            drag: 0.995,
            maxSpeed: isMobile ? 8 : 15,
            collisionEnabled: false,
            boundaryBehavior: 'none',
          },
          { width: canvas.width, height: canvas.height }
        );
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    // Animation loop
    let lastTime = performance.now();
    phaseTimerRef.current = 0;

    const animate = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Max 0.1s to prevent huge jumps
      lastTime = currentTime;
      phaseTimerRef.current += deltaTime;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update phase based on timer
      updatePhase(deltaTime);

      // Render everything
      renderBackground(ctx, canvas.width, canvas.height);
      renderNebulae(ctx, canvas.width, canvas.height);
      renderStars(ctx, canvas.width, canvas.height, currentTime);
      renderPlanets(ctx, canvas.width, canvas.height, currentTime);
      renderParticles(ctx, deltaTime);
      renderPhaseEffects(ctx, canvas.width, canvas.height, currentTime);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', updateSize);
    };
  }, [phase, implosionCenter, isMobile]);

  // Phase management
  const updatePhase = (deltaTime: number) => {
    const timer = phaseTimerRef.current;

    // Phase transitions (30-second cycle)
    if (phase === 'calm' && timer >= 22) {
      setPhase('premonition');
      // Pick a random star for implosion
      const randomStar = stars[Math.floor(Math.random() * stars.length)];
      setImplosionCenter({
        x: (randomStar.x / 100) * (canvasRef.current?.width || 800),
        y: (randomStar.y / 100) * (canvasRef.current?.height || 200),
      });
    } else if (phase === 'premonition' && timer >= 25) {
      setPhase('implosion');
      // Create implosion particles
      if (implosionCenter && particleSystemRef.current) {
        const spiralParticles = Array.from({ length: isMobile ? 40 : 100 }, (_, i) => {
          const angle = (i / (isMobile ? 40 : 100)) * Math.PI * 6;
          const radius = 100 + (i / (isMobile ? 40 : 100)) * 150;
          const x = implosionCenter.x + Math.cos(angle) * radius;
          const y = implosionCenter.y + Math.sin(angle) * radius;

          return {
            id: Math.random(),
            position: { x, y },
            velocity: { x: 0, y: 0 },
            acceleration: { x: 0, y: 0 },
            mass: 1,
            radius: 1.5,
            color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
            opacity: 1,
            lifetime: 3,
            age: 0,
          } as Particle;
        });

        particleSystemRef.current.addParticles(spiralParticles);
      }
    } else if (phase === 'implosion' && timer >= 28) {
      setPhase('explosion');
      // Create explosion
      if (implosionCenter && particleSystemRef.current) {
        particleSystemRef.current.clear();
        const explosionParticles = createRadialBurst(
          implosionCenter.x,
          implosionCenter.y,
          PARTICLE_COUNT_EXPLOSION,
          isMobile ? 150 : 250, // MASSIVE velocity increase from 80/120
          EXPLOSION_COLORS
        );
        particleSystemRef.current.addParticles(explosionParticles);
      }
    } else if (phase === 'explosion' && timer >= 30.5) { // Extended from 29.5 to 30.5
      setPhase('aftermath');
    } else if (phase === 'aftermath' && timer >= 32) {
      // Reset cycle
      setPhase('calm');
      phaseTimerRef.current = 0;
      setImplosionCenter(null);
      particleSystemRef.current?.clear();
    }
  };

  // Render functions
  const renderBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Deep space gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0f0f23');
    gradient.addColorStop(0.5, '#1a0a2e');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  const renderNebulae = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    nebulae.forEach((nebula) => {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.filter = 'blur(40px)';

      const x = (nebula.x / 100) * width;
      const y = (nebula.y / 100) * height;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, nebula.size);
      gradient.addColorStop(0, nebula.color);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.fillRect(x - nebula.size, y - nebula.size, nebula.size * 2, nebula.size * 2);

      ctx.restore();
    });
  };

  const renderStars = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    stars.forEach((star) => {
      const x = (star.x / 100) * width;
      const y = (star.y / 100) * height;

      // Twinkling effect
      const twinkle = Math.sin((time / 1000) * star.twinkleSpeed + star.twinkleDelay) * 0.3 + 0.7;

      // Pulse effect during premonition near implosion center
      let opacity = star.opacity * twinkle;
      if (phase === 'premonition' && implosionCenter) {
        const distance = Math.sqrt(Math.pow(x - implosionCenter.x, 2) + Math.pow(y - implosionCenter.y, 2));
        if (distance < 150) {
          opacity *= 0.5 + Math.sin(time / 100) * 0.5;
        }
      }

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(x, y, star.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add glow for larger stars
      if (star.size > 1.5) {
        ctx.globalAlpha = opacity * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, star.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    });
  };

  const renderPlanets = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    planets.forEach((planet) => {
      const orbitX = Math.cos((time / 1000 / planet.orbitSpeed) * Math.PI * 2 + planet.phase) * planet.orbitRadius;
      const orbitY = Math.sin((time / 1000 / planet.orbitSpeed) * Math.PI * 2 + planet.phase) * planet.orbitRadius;

      const x = (planet.x / 100) * width + orbitX;
      const y = (planet.y / 100) * height + orbitY;

      ctx.save();
      
      // Planet body
      ctx.fillStyle = planet.color;
      ctx.beginPath();
      ctx.arc(x, y, planet.size, 0, Math.PI * 2);
      ctx.fill();

      // Subtle glow
      ctx.globalAlpha = 0.3;
      const gradient = ctx.createRadialGradient(x, y, planet.size, x, y, planet.size * 1.5);
      gradient.addColorStop(0, planet.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, planet.size * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  };

  const renderParticles = (ctx: CanvasRenderingContext2D, deltaTime: number) => {
    if (!particleSystemRef.current) return;

    // Apply gravity during implosion phase
    const attractors: Vector2D[] = [];
    if (phase === 'implosion' && implosionCenter) {
      attractors.push(implosionCenter);
    }

    // Update particle system
    particleSystemRef.current.update(deltaTime, attractors, []);

    // Render particles
    particleSystemRef.current.particles.forEach((particle) => {
      // Safety check: ensure radius is positive
      const safeRadius = Math.max(0.1, particle.radius);
      
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, safeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Add glow
      if (phase === 'explosion') {
        ctx.globalAlpha = particle.opacity * 0.5;
        ctx.beginPath();
        ctx.arc(particle.position.x, particle.position.y, safeRadius * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  };

  const renderPhaseEffects = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    if (!implosionCenter) return;

    // Premonition: pulsing glow at implosion center
    if (phase === 'premonition') {
      const pulse = Math.sin((time / 1000) * 8) * 0.5 + 0.5;
      ctx.save();
      ctx.globalAlpha = 0.3 + pulse * 0.4;
      const gradient = ctx.createRadialGradient(
        implosionCenter.x,
        implosionCenter.y,
        0,
        implosionCenter.x,
        implosionCenter.y,
        50
      );
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(implosionCenter.x, implosionCenter.y, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Implosion: black hole with ring
    if (phase === 'implosion') {
      ctx.save();
      
      // Black center
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(implosionCenter.x, implosionCenter.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Glowing ring
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = '#ff6b00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(implosionCenter.x, implosionCenter.y, 12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // Explosion: flash and shockwave
    if (phase === 'explosion') {
      const explosionAge = phaseTimerRef.current - 28;
      const flashIntensity = Math.max(0, 1 - explosionAge * 1.5); // Slower fade for longer flash

      // ULTRA INTENSE white flash - but not so bright it washes out the rings
      if (flashIntensity > 0 && explosionAge < 0.3) { // Only flash for first 0.3 seconds
        ctx.save();
        ctx.globalAlpha = flashIntensity * 0.7; // Reduced from 0.98 so rings are visible
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // MASSIVE expanding shockwave rings - with progressive acceleration
      // Start slower so rings are visible, then accelerate
      const accelerationFactor = Math.min(1, explosionAge * 2); // Ramps up over 0.5 seconds
      const baseSpeed = isMobile ? 300 : 500; // Start at original speed
      const maxSpeed = isMobile ? 600 : 1000; // Max speed
      const currentSpeed = baseSpeed + (maxSpeed - baseSpeed) * accelerationFactor;
      const shockwaveRadius = Math.max(0, explosionAge * currentSpeed);
      const shockwaveOpacity = Math.max(0, 1 - explosionAge * 0.6); // Slower fade

      if (shockwaveOpacity > 0) {
        // Ring 1: Outermost white shockwave - MASSIVE
        ctx.save();
        ctx.globalAlpha = shockwaveOpacity * 0.9;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 10;
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(implosionCenter.x, implosionCenter.y, shockwaveRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Ring 2: Cyan shockwave
        ctx.save();
        ctx.globalAlpha = shockwaveOpacity * 0.85;
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 8;
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.arc(implosionCenter.x, implosionCenter.y, shockwaveRadius * 0.85, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Ring 3: Primary blue shockwave
        ctx.save();
        ctx.globalAlpha = shockwaveOpacity * 0.8;
        ctx.strokeStyle = '#4169e1';
        ctx.lineWidth = 8;
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#4169e1';
        ctx.beginPath();
        ctx.arc(implosionCenter.x, implosionCenter.y, shockwaveRadius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Ring 4: Secondary purple shockwave
        ctx.save();
        ctx.globalAlpha = shockwaveOpacity * 0.7;
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 6;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(implosionCenter.x, implosionCenter.y, shockwaveRadius * 0.55, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Ring 5: Magenta shockwave
        ctx.save();
        ctx.globalAlpha = shockwaveOpacity * 0.6;
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 5;
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#ff00ff';
        ctx.beginPath();
        ctx.arc(implosionCenter.x, implosionCenter.y, shockwaveRadius * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Ring 6: Orange shockwave
        ctx.save();
        ctx.globalAlpha = shockwaveOpacity * 0.5;
        ctx.strokeStyle = '#ff6b00';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff6b00';
        ctx.beginPath();
        ctx.arc(implosionCenter.x, implosionCenter.y, shockwaveRadius * 0.25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Ring 7: Inner gold shockwave
        ctx.save();
        ctx.globalAlpha = shockwaveOpacity * 0.4;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ffd700';
        ctx.beginPath();
        ctx.arc(implosionCenter.x, implosionCenter.y, shockwaveRadius * 0.12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // MASSIVE expanding colored energy sphere
      if (explosionAge < 1.2) { // Extended duration
        const sphereRadius = Math.max(0, explosionAge * (isMobile ? 300 : 600)); // Adjusted from 400/700
        const sphereOpacity = Math.max(0, 1.0 - explosionAge * 0.7); // Slower fade
        
        ctx.save();
        ctx.globalAlpha = sphereOpacity * 0.6; // Reduced so it doesn't overpower the rings
        const energyGradient = ctx.createRadialGradient(
          implosionCenter.x, implosionCenter.y, 0,
          implosionCenter.x, implosionCenter.y, sphereRadius
        );
        energyGradient.addColorStop(0, '#ffffff');
        energyGradient.addColorStop(0.2, '#ffd700');
        energyGradient.addColorStop(0.4, '#4169e1');
        energyGradient.addColorStop(0.6, '#8b5cf6');
        energyGradient.addColorStop(0.8, '#ff00ff');
        energyGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = energyGradient;
        ctx.beginPath();
        ctx.arc(implosionCenter.x, implosionCenter.y, sphereRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Secondary explosion wave (delayed) - THIS IS THE RED RING
      if (explosionAge > 0.3 && explosionAge < 1.5) {
        const secondaryRadius = Math.max(0, (explosionAge - 0.3) * (isMobile ? 400 : 700)); // Slowed down
        const secondaryOpacity = Math.max(0, 0.6 - (explosionAge - 0.3) * 0.5);
        
        ctx.save();
        ctx.globalAlpha = secondaryOpacity;
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 5;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(implosionCenter.x, implosionCenter.y, secondaryRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  return (
    <motion.div
      className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
      style={performanceStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      {/* Canvas for dynamic effects */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          imageRendering: 'crisp-edges',
        }}
      />

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
    </motion.div>
  );
}
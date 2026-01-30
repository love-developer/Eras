// ============================================================================
// DAWN ETERNAL HORIZON - "Dawn Eternal" (Epic Tier)
// ============================================================================
// Achievement: "Golden Hour Guardian" - Create 50 capsules between 5-7 AM
// 
// Features:
// - Perpetual sunrise with dynamic color shifting
// - Volumetric god rays that track mouse position
// - Cloud layer with 3-level parallax
// - Golden burst every 45 seconds (divine sunrise effect)
// - Golden particles rain down like blessing
// - Flying birds that cast shadows
// - Mobile-optimized solid colors

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ParticleSystem,
  createParticle,
  type Particle,
} from '../../utils/particlePhysics';

interface DawnEternalHorizonProps {
  height: string;
  positioning: string;
  performanceStyle: React.CSSProperties;
  isMobile?: boolean;
}

// Golden hour color palette
const DAWN_COLORS = {
  sky: ['#fef3c7', '#fde68a', '#fbbf24', '#f59e0b', '#fb923c', '#f97316'],
  sun: '#fbbf24',
  clouds: '#fff7ed',
  rays: '#fcd34d',
};

type DawnPhase = 'calm' | 'preBurst' | 'burst' | 'afterBurst';

export function DawnEternalHorizon({ height, positioning, performanceStyle, isMobile = false }: DawnEternalHorizonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const phaseTimerRef = useRef<number>(0);
  const mousePositionRef = useRef({ x: 0.5, y: 0.5 }); // Normalized 0-1

  // State
  const [phase, setPhase] = useState<DawnPhase>('calm');
  
  // Particle system for golden rain
  const particleSystemRef = useRef<ParticleSystem | null>(null);

  // Performance config
  const CLOUD_COUNT = isMobile ? 3 : 8;
  const BIRD_COUNT = isMobile ? 2 : 5;
  const RAY_COUNT = isMobile ? 5 : 12;
  const RAIN_PARTICLES = isMobile ? 40 : 100;

  // Generate clouds
  const clouds = useMemo(() => {
    return Array.from({ length: CLOUD_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 120 - 10, // -10 to 110 for overflow
      y: 20 + Math.random() * 40,
      size: isMobile ? 40 + Math.random() * 30 : 60 + Math.random() * 60,
      speed: 0.5 + Math.random() * 1.5, // pixels per second
      layer: Math.floor(Math.random() * 3), // 0, 1, 2 for parallax
      opacity: 0.3 + Math.random() * 0.4,
    }));
  }, [CLOUD_COUNT, isMobile]);

  // Generate birds
  const birds = useMemo(() => {
    return Array.from({ length: BIRD_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 30 + Math.random() * 30,
      speed: 5 + Math.random() * 5,
      flapSpeed: 2 + Math.random(),
      size: isMobile ? 8 : 12,
    }));
  }, [BIRD_COUNT, isMobile]);

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      mousePositionRef.current = {
        x: e.clientX / rect.width,
        y: e.clientY / rect.height,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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

      // Initialize particle system
      if (!particleSystemRef.current) {
        particleSystemRef.current = new ParticleSystem(
          {
            gravity: 0.5,
            drag: 0.98,
            maxSpeed: 3,
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
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      phaseTimerRef.current += deltaTime;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update phase
      updatePhase(deltaTime);

      // Render everything
      renderSky(ctx, canvas.width, canvas.height, currentTime);
      renderSun(ctx, canvas.width, canvas.height, currentTime);
      renderGodRays(ctx, canvas.width, canvas.height, currentTime);
      renderClouds(ctx, canvas.width, canvas.height, currentTime);
      renderBirds(ctx, canvas.width, canvas.height, currentTime);
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
  }, [phase, isMobile]);

  // Phase management
  const updatePhase = (deltaTime: number) => {
    const timer = phaseTimerRef.current;

    // Phase transitions (45-second cycle)
    if (phase === 'calm' && timer >= 42) {
      setPhase('preBurst');
    } else if (phase === 'preBurst' && timer >= 44) {
      setPhase('burst');
      // Create golden rain
      if (particleSystemRef.current && canvasRef.current) {
        particleSystemRef.current.clear();
        
        // Spawn particles across top of screen
        for (let i = 0; i < RAIN_PARTICLES; i++) {
          const particle = createParticle(
            Math.random() * canvasRef.current.width,
            -10,
            (Math.random() - 0.5) * 2, // slight horizontal drift
            2 + Math.random() * 2, // downward velocity
            {
              color: DAWN_COLORS.sun,
              radius: 2 + Math.random() * 2,
              opacity: 0.8,
              lifetime: 4,
            }
          );
          particleSystemRef.current.addParticle(particle);
        }
      }
    } else if (phase === 'burst' && timer >= 46) {
      setPhase('afterBurst');
    } else if (phase === 'afterBurst' && timer >= 48) {
      // Reset cycle
      setPhase('calm');
      phaseTimerRef.current = 0;
      particleSystemRef.current?.clear();
    }
  };

  // Render functions
  const renderSky = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    // Gradient sky - golden hour colors
    // Cycle through dawn colors slowly
    const colorCycle = (time / 10000) % 1; // 10 second cycle
    const colorIndex = Math.floor(colorCycle * DAWN_COLORS.sky.length);
    const nextColorIndex = (colorIndex + 1) % DAWN_COLORS.sky.length;
    const colorProgress = (colorCycle * DAWN_COLORS.sky.length) % 1;

    const color1 = DAWN_COLORS.sky[colorIndex];
    const color2 = DAWN_COLORS.sky[nextColorIndex];

    if (isMobile) {
      // Solid color on mobile
      ctx.fillStyle = color1 + '60';
      ctx.fillRect(0, 0, width, height);
    } else {
      // Gradient on desktop
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(0.4, color2);
      gradient.addColorStop(1, '#fb923c');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Darker overlay at bottom
    const bottomGradient = ctx.createLinearGradient(0, height * 0.6, 0, height);
    bottomGradient.addColorStop(0, 'rgba(15, 23, 42, 0)');
    bottomGradient.addColorStop(1, 'rgba(15, 23, 42, 0.4)');
    ctx.fillStyle = bottomGradient;
    ctx.fillRect(0, 0, width, height);
  };

  const renderSun = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const sunX = width * 0.75; // Right side
    const sunY = height * 0.3; // Upper portion
    const sunRadius = isMobile ? 40 : 60;

    // Pulse during pre-burst
    const pulseFactor = phase === 'preBurst' ? 1 + Math.sin(time / 100) * 0.2 : 1;
    const finalRadius = Math.max(1, sunRadius * pulseFactor); // Safety check

    ctx.save();
    
    // Sun body
    const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, finalRadius);
    sunGradient.addColorStop(0, '#ffffff');
    sunGradient.addColorStop(0.3, DAWN_COLORS.sun);
    sunGradient.addColorStop(1, '#f97316');
    
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, finalRadius, 0, Math.PI * 2);
    ctx.fill();

    // Outer glow
    ctx.globalAlpha = 0.4;
    const glowGradient = ctx.createRadialGradient(sunX, sunY, finalRadius, sunX, sunY, finalRadius * 2);
    glowGradient.addColorStop(0, DAWN_COLORS.sun);
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, finalRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const renderGodRays = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    if (isMobile) return; // Skip on mobile for performance

    const sunX = width * 0.75;
    const sunY = height * 0.3;

    // God rays follow mouse position subtly
    const mouseInfluence = 0.3; // How much mouse affects rays
    const targetX = sunX + (mousePositionRef.current.x - 0.75) * width * mouseInfluence;
    const targetY = sunY + (mousePositionRef.current.y - 0.3) * height * mouseInfluence;

    ctx.save();
    ctx.globalAlpha = 0.15;

    for (let i = 0; i < RAY_COUNT; i++) {
      const angle = (i / RAY_COUNT) * Math.PI * 2 + (time / 5000);
      const length = height * 1.5;

      const gradient = ctx.createLinearGradient(
        targetX,
        targetY,
        targetX + Math.cos(angle) * length,
        targetY + Math.sin(angle) * length
      );
      gradient.addColorStop(0, DAWN_COLORS.rays);
      gradient.addColorStop(0.5, DAWN_COLORS.rays + '40');
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(targetX, targetY);
      ctx.arc(targetX, targetY, length, angle - 0.05, angle + 0.05);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  };

  const renderClouds = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    clouds.forEach((cloud) => {
      // Parallax - different layers move at different speeds
      const layerSpeed = 1 - cloud.layer * 0.3; // Layer 0 = 1x, Layer 1 = 0.7x, Layer 2 = 0.4x
      const x = ((cloud.x + (time / 1000) * cloud.speed * layerSpeed) % 120) - 10;
      const y = cloud.y;

      ctx.save();
      ctx.globalAlpha = cloud.opacity;
      ctx.filter = `blur(${cloud.layer * 3 + 2}px)`;

      // Simple ellipse cloud
      const cloudWidth = cloud.size * 1.5;
      const cloudHeight = cloud.size * 0.8;

      ctx.fillStyle = DAWN_COLORS.clouds;
      ctx.beginPath();
      ctx.ellipse(
        (x / 100) * width,
        (y / 100) * height,
        cloudWidth,
        cloudHeight,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.restore();
    });
  };

  const renderBirds = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    birds.forEach((bird) => {
      const x = ((bird.x + (time / 1000) * bird.speed) % 110) - 10;
      const y = bird.y;
      
      // Flapping animation
      const flapCycle = Math.sin((time / 1000) * bird.flapSpeed * Math.PI * 2);
      const wingAngle = flapCycle * 0.5; // -0.5 to 0.5 radians

      const birdX = (x / 100) * width;
      const birdY = (y / 100) * height;

      ctx.save();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      // Left wing
      ctx.beginPath();
      ctx.moveTo(birdX, birdY);
      ctx.lineTo(birdX - bird.size, birdY + bird.size * Math.sin(wingAngle));
      ctx.stroke();

      // Right wing
      ctx.beginPath();
      ctx.moveTo(birdX, birdY);
      ctx.lineTo(birdX + bird.size, birdY + bird.size * Math.sin(wingAngle));
      ctx.stroke();

      ctx.restore();
    });
  };

  const renderParticles = (ctx: CanvasRenderingContext2D, deltaTime: number) => {
    if (!particleSystemRef.current) return;

    // Update particle system
    particleSystemRef.current.update(deltaTime, [], []);

    // Render golden rain particles
    particleSystemRef.current.particles.forEach((particle) => {
      // Safety check: ensure radius is positive
      const safeRadius = Math.max(0.1, particle.radius);
      
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      
      // Draw as golden sparkle
      ctx.fillStyle = particle.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = particle.color;
      
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, safeRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  };

  const renderPhaseEffects = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    // Burst: Divine flash and lens flare
    if (phase === 'burst') {
      const burstAge = phaseTimerRef.current - 44;
      const flashIntensity = Math.max(0, 1 - burstAge);

      if (flashIntensity > 0) {
        const sunX = width * 0.75;
        const sunY = height * 0.3;

        // Radial flash
        ctx.save();
        ctx.globalAlpha = flashIntensity * 0.6;
        
        const flashGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, width);
        flashGradient.addColorStop(0, '#ffffff');
        flashGradient.addColorStop(0.3, DAWN_COLORS.sun);
        flashGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = flashGradient;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();

        // Lens flare circles
        ctx.save();
        ctx.globalAlpha = flashIntensity * 0.8;
        
        const flarePositions = [0.2, 0.4, 0.6];
        flarePositions.forEach((pos, i) => {
          const flareX = sunX - (sunX - width / 2) * pos;
          const flareY = sunY + (height / 2 - sunY) * pos;
          const flareSize = 20 + i * 15;
          
          ctx.fillStyle = DAWN_COLORS.sky[i % DAWN_COLORS.sky.length] + '60';
          ctx.beginPath();
          ctx.arc(flareX, flareY, flareSize, 0, Math.PI * 2);
          ctx.fill();
        });
        
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
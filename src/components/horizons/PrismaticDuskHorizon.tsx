// ============================================================================
// PRISMATIC DUSK HORIZON - "Prismatic Dusk" (Epic Tier)
// ============================================================================
// Achievement: "Theme Connoisseur" - Create at least 1 capsule with all 15 themes
// 
// Features:
// - 3D rotating prism in center that refracts light
// - All 15 theme colors cycling dynamically
// - Theme icons orbit the prism like satellites
// - Rainbow supernova burst every 20 seconds
// - Particles spiral around prism with gravitational pull
// - Mobile-optimized solid colors

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ParticleSystem,
  createExplosion,
  type Particle,
  type Vector2D,
} from '../../utils/particlePhysics';

interface PrismaticDuskHorizonProps {
  height: string;
  positioning: string;
  performanceStyle: React.CSSProperties;
  isMobile?: boolean;
}

// All 15 theme colors from Eras
const THEME_COLORS = [
  '#3b82f6', // Classic Blue
  '#8b5cf6', // Birthday Purple
  '#ec4899', // Love Pink
  '#10b981', // New Beginnings Green
  '#f59e0b', // Golden Hour Amber
  '#ef4444', // Milestone Red
  '#06b6d4', // Adventure Cyan
  '#f97316', // Grateful Heart Orange
  '#84cc16', // Fresh Start Lime
  '#a855f7', // New Year's Eve Purple
  '#14b8a6', // New Nest Teal
  '#f472b6', // Furry Friends Pink
  '#6366f1', // Career Summit Indigo
  '#eab308', // Achievement Gold
  '#64748b', // Memory Lane Gray
];

const THEME_ICONS = ['🎂', '💝', '🌱', '🌅', '🎯', '🎉', '🐾', '💼', '🏆', '🎊', '🏠', '🍂', '🌟', '💫', '📸'];

type PrismPhase = 'cycle' | 'preBurst' | 'burst' | 'afterBurst';

export function PrismaticDuskHorizon({ height, positioning, performanceStyle, isMobile = false }: PrismaticDuskHorizonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const phaseTimerRef = useRef<number>(0);

  // State
  const [phase, setPhase] = useState<PrismPhase>('cycle');
  const [colorIndex, setColorIndex] = useState(0);
  
  // Particle system
  const particleSystemRef = useRef<ParticleSystem | null>(null);

  // Performance config
  const PARTICLE_COUNT_ORBIT = isMobile ? 30 : 80;
  const PARTICLE_COUNT_BURST = isMobile ? 100 : 300;

  // Generate orbiting theme icons
  const orbitingIcons = useMemo(() => {
    return THEME_ICONS.map((icon, i) => ({
      icon,
      angle: (i / THEME_ICONS.length) * Math.PI * 2,
      radius: isMobile ? 80 : 120,
      speed: 0.3, // radians per second
      size: isMobile ? 20 : 28,
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

      // Initialize particle system
      if (!particleSystemRef.current) {
        particleSystemRef.current = new ParticleSystem(
          {
            gravity: 2,
            drag: 0.98,
            maxSpeed: isMobile ? 6 : 10,
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
      renderBackground(ctx, canvas.width, canvas.height, currentTime);
      renderPrism(ctx, canvas.width, canvas.height, currentTime);
      renderOrbitingIcons(ctx, canvas.width, canvas.height, currentTime);
      renderParticles(ctx, deltaTime, canvas.width, canvas.height);
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

    // Cycle colors continuously
    if (Math.floor(timer * 2) !== Math.floor((timer - deltaTime) * 2)) {
      setColorIndex((prev) => (prev + 1) % THEME_COLORS.length);
    }

    // Phase transitions (20-second cycle)
    if (phase === 'cycle' && timer >= 17) {
      setPhase('preBurst');
    } else if (phase === 'preBurst' && timer >= 19) {
      setPhase('burst');
      // Create rainbow burst
      if (particleSystemRef.current && canvasRef.current) {
        const centerX = canvasRef.current.width / 2;
        const centerY = canvasRef.current.height / 2;
        
        particleSystemRef.current.clear();
        const burstParticles = createExplosion(
          centerX,
          centerY,
          PARTICLE_COUNT_BURST,
          isMobile ? 60 : 100,
          THEME_COLORS,
          {
            spread: 1,
            minSpeed: 40,
            maxSpeed: 100,
            minSize: 2,
            maxSize: 5,
            lifetime: 2,
          }
        );
        particleSystemRef.current.addParticles(burstParticles);
      }
    } else if (phase === 'burst' && timer >= 21) {
      setPhase('afterBurst');
    } else if (phase === 'afterBurst' && timer >= 22) {
      // Reset cycle
      setPhase('cycle');
      phaseTimerRef.current = 0;
      particleSystemRef.current?.clear();
    }
  };

  // Render functions
  const renderBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    // Gradient background that shifts through theme colors
    const currentColor = THEME_COLORS[colorIndex];
    const nextColor = THEME_COLORS[(colorIndex + 1) % THEME_COLORS.length];
    
    // Color interpolation for smooth transitions
    const progress = (phaseTimerRef.current % 0.5) * 2; // 0-1 over 0.5 seconds
    
    // Use solid colors on mobile, subtle gradient on desktop
    if (isMobile) {
      ctx.fillStyle = currentColor;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
    } else {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, currentColor + '40');
      gradient.addColorStop(0.5, nextColor + '30');
      gradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
    
    // Base dark overlay
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(0, 0, width, height);
  };

  const renderPrism = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const size = isMobile ? 40 : 60;
    
    // Rotation
    const rotation = (time / 1000) * 0.5; // Slow rotation
    
    // Pre-burst: faster spin
    const spinMultiplier = phase === 'preBurst' ? 3 : 1;
    const finalRotation = rotation * spinMultiplier;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(finalRotation);

    // Draw 3D prism (hexagon with depth)
    const sides = 6;
    const currentColor = THEME_COLORS[colorIndex];
    const nextColor = THEME_COLORS[(colorIndex + 1) % THEME_COLORS.length];

    // Main prism face
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    // Gradient fill
    const prismGradient = ctx.createLinearGradient(-size, -size, size, size);
    prismGradient.addColorStop(0, currentColor);
    prismGradient.addColorStop(0.5, nextColor);
    prismGradient.addColorStop(1, THEME_COLORS[(colorIndex + 2) % THEME_COLORS.length]);
    
    ctx.fillStyle = prismGradient;
    ctx.fill();

    // Glowing outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = phase === 'preBurst' ? 30 : 15;
    ctx.shadowColor = currentColor;
    ctx.stroke();

    // Refraction lines (light rays)
    ctx.shadowBlur = 0;
    for (let i = 0; i < 3; i++) {
      const rayAngle = (time / 1000) * 0.3 + (i * Math.PI * 2) / 3;
      const rayLength = size * 1.5;
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(rayAngle) * rayLength, Math.sin(rayAngle) * rayLength);
      ctx.strokeStyle = THEME_COLORS[(colorIndex + i * 5) % THEME_COLORS.length] + '80';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.restore();

    // Outer glow
    ctx.save();
    ctx.globalAlpha = 0.3;
    const glowGradient = ctx.createRadialGradient(centerX, centerY, size, centerX, centerY, size * 2);
    glowGradient.addColorStop(0, currentColor);
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const renderOrbitingIcons = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const centerX = width / 2;
    const centerY = height / 2;

    orbitingIcons.forEach((iconData, i) => {
      const angle = iconData.angle + (time / 1000) * iconData.speed;
      const x = centerX + Math.cos(angle) * iconData.radius;
      const y = centerY + Math.sin(angle) * iconData.radius;

      // Draw icon
      ctx.save();
      ctx.font = `${iconData.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = THEME_COLORS[i];
      ctx.fillStyle = '#ffffff';
      ctx.fillText(iconData.icon, x, y);
      
      ctx.restore();

      // Connection line to prism
      if (!isMobile) {
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = THEME_COLORS[i];
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.restore();
      }
    });
  };

  const renderParticles = (ctx: CanvasRenderingContext2D, deltaTime: number, width: number, height: number) => {
    if (!particleSystemRef.current) return;

    // Update particle system
    particleSystemRef.current.update(deltaTime, [], []);

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

      // Add glow during burst
      if (phase === 'burst') {
        ctx.globalAlpha = particle.opacity * 0.5;
        ctx.beginPath();
        ctx.arc(particle.position.x, particle.position.y, safeRadius * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  };

  const renderPhaseEffects = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const centerX = width / 2;
    const centerY = height / 2;

    // Pre-burst: pulsing rainbow ring
    if (phase === 'preBurst') {
      const pulse = Math.sin((time / 1000) * 10) * 0.5 + 0.5;
      const radius = Math.max(1, (isMobile ? 60 : 80) + pulse * 20); // Safety check

      ctx.save();
      ctx.globalAlpha = 0.6 + pulse * 0.4;
      
      // Create rainbow gradient ring
      for (let i = 0; i < THEME_COLORS.length; i++) {
        const startAngle = (i / THEME_COLORS.length) * Math.PI * 2;
        const endAngle = ((i + 1) / THEME_COLORS.length) * Math.PI * 2;
        
        ctx.strokeStyle = THEME_COLORS[i];
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.stroke();
      }
      
      ctx.restore();
    }

    // Burst: flash effect
    if (phase === 'burst') {
      const burstAge = phaseTimerRef.current - 19;
      const flashIntensity = Math.max(0, 1 - burstAge * 2);

      if (flashIntensity > 0) {
        ctx.save();
        ctx.globalAlpha = flashIntensity * 0.5;
        
        // Rainbow gradient flash
        const flashGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width);
        THEME_COLORS.forEach((color, i) => {
          flashGradient.addColorStop(i / THEME_COLORS.length, color);
        });
        
        ctx.fillStyle = flashGradient;
        ctx.fillRect(0, 0, width, height);
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
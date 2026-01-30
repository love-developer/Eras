// ============================================================================
// CHRONO APPRENTICE HORIZON - "Chrono Apprentice" (Uncommon Tier)
// ============================================================================
// Achievement: "Time Keeper" - Complete your first capsule tutorial
// 
// Features:
// - Large animated hourglass with flowing sand
// - Orbiting time runes and symbols (clocks, hourglasses, sundials)
// - 50+ bronze sand particles cascading through hourglass
// - Time distortion ripples emanating from center
// - Clock hands rotating at different speeds
// - Bronze/copper color scheme matching achievement visual
// - Mobile-optimized

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ParticleSystem,
  createParticle,
  type Particle,
} from '../../utils/particlePhysics';

interface ChronoApprenticeHorizonProps {
  height: string;
  positioning: string;
  performanceStyle: React.CSSProperties;
  isMobile?: boolean;
}

// Bronze/copper time theme colors
const CHRONO_COLORS = {
  bronze: '#CD7F32',
  copper: '#8B4513',
  sand: '#DEB887',
  glow: '#CD7F32',
  rune: '#D4AF37', // Ancient gold
};

// Time runes (Unicode clock symbols)
const TIME_RUNES = ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '⏰', '⏳', '⏱️', '🕰️'];

export function ChronoApprenticeHorizon({ height, positioning, performanceStyle, isMobile = false }: ChronoApprenticeHorizonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Particle system for sand
  const particleSystemRef = useRef<ParticleSystem | null>(null);

  // Performance config
  const SAND_PARTICLES = isMobile ? 30 : 60;
  const RUNE_COUNT = isMobile ? 6 : 10;

  // Generate orbiting time runes
  const timeRunes = useMemo(() => {
    return Array.from({ length: RUNE_COUNT }, (_, i) => ({
      id: i,
      symbol: TIME_RUNES[i % TIME_RUNES.length],
      angle: (i / RUNE_COUNT) * Math.PI * 2,
      radius: isMobile ? 90 : 140,
      speed: 0.2 + Math.random() * 0.1, // radians per second
      size: isMobile ? 20 : 28,
      layer: i % 2, // Two orbital layers
    }));
  }, [RUNE_COUNT, isMobile]);

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
            gravity: 2.5,
            drag: 0.99,
            maxSpeed: 5,
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

    const animate = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render everything
      renderBackground(ctx, canvas.width, canvas.height);
      renderTimeDistortionWaves(ctx, canvas.width, canvas.height, currentTime);
      renderHourglass(ctx, canvas.width, canvas.height, currentTime);
      renderClockHands(ctx, canvas.width, canvas.height, currentTime);
      renderOrbitingRunes(ctx, canvas.width, canvas.height, currentTime);
      renderSandParticles(ctx, deltaTime, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', updateSize);
    };
  }, [isMobile]);

  // Render functions
  const renderBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (isMobile) {
      // Solid bronze glow on mobile
      ctx.fillStyle = CHRONO_COLORS.bronze + '25';
      ctx.fillRect(0, 0, width, height);
    } else {
      // Radial gradient
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.6);
      gradient.addColorStop(0, CHRONO_COLORS.bronze + '30');
      gradient.addColorStop(0.6, CHRONO_COLORS.copper + '20');
      gradient.addColorStop(1, '#0f172a00');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Dark base
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fillRect(0, 0, width, height);
  };

  const renderTimeDistortionWaves = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const centerX = width / 2;
    const centerY = height / 2;

    // Rippling time distortion waves
    ctx.save();
    ctx.strokeStyle = CHRONO_COLORS.bronze;
    ctx.lineWidth = 2;

    for (let i = 0; i < 4; i++) {
      const wavePhase = ((time / 2000) + i * 0.25) % 1;
      const radius = wavePhase * (isMobile ? 120 : 180);
      const alpha = 1 - wavePhase;

      ctx.globalAlpha = alpha * 0.4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  };

  const renderHourglass = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const hourglassWidth = isMobile ? 60 : 100;
    const hourglassHeight = isMobile ? 100 : 160;

    ctx.save();

    // Hourglass body glow
    ctx.globalAlpha = 0.3;
    const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, hourglassWidth);
    glowGradient.addColorStop(0, CHRONO_COLORS.glow);
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, hourglassWidth, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;

    // Upper bulb
    ctx.strokeStyle = CHRONO_COLORS.bronze;
    ctx.lineWidth = 3;
    ctx.fillStyle = CHRONO_COLORS.copper + '30';
    
    ctx.beginPath();
    ctx.moveTo(centerX - hourglassWidth / 2, centerY - hourglassHeight / 2);
    ctx.lineTo(centerX + hourglassWidth / 2, centerY - hourglassHeight / 2);
    ctx.lineTo(centerX + hourglassWidth / 3, centerY - 10);
    ctx.lineTo(centerX - hourglassWidth / 3, centerY - 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lower bulb
    ctx.beginPath();
    ctx.moveTo(centerX - hourglassWidth / 2, centerY + hourglassHeight / 2);
    ctx.lineTo(centerX + hourglassWidth / 2, centerY + hourglassHeight / 2);
    ctx.lineTo(centerX + hourglassWidth / 3, centerY + 10);
    ctx.lineTo(centerX - hourglassWidth / 3, centerY + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Neck (narrowest part)
    ctx.strokeStyle = CHRONO_COLORS.bronze;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - hourglassWidth / 3, centerY - 10);
    ctx.lineTo(centerX - 4, centerY);
    ctx.lineTo(centerX - hourglassWidth / 3, centerY + 10);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + hourglassWidth / 3, centerY - 10);
    ctx.lineTo(centerX + 4, centerY);
    ctx.lineTo(centerX + hourglassWidth / 3, centerY + 10);
    ctx.stroke();

    // Sand level in bottom bulb (filling up over time)
    const sandLevel = (Math.sin(time / 8000) + 1) / 2; // 0 to 1
    const sandHeight = sandLevel * (hourglassHeight / 2 - 10);
    
    ctx.fillStyle = CHRONO_COLORS.sand;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    
    // Bottom sand pile (triangular shape)
    const sandTop = centerY + hourglassHeight / 2 - sandHeight;
    const sandBottom = centerY + hourglassHeight / 2;
    const sandWidth = (hourglassWidth / 2) * (1 - sandLevel * 0.3);
    
    ctx.moveTo(centerX - sandWidth, sandBottom);
    ctx.lineTo(centerX + sandWidth, sandBottom);
    ctx.lineTo(centerX + sandWidth * 0.6, sandTop);
    ctx.lineTo(centerX - sandWidth * 0.6, sandTop);
    ctx.closePath();
    ctx.fill();

    // Add sand glow
    ctx.globalAlpha = 0.5;
    ctx.shadowBlur = 15;
    ctx.shadowColor = CHRONO_COLORS.sand;
    ctx.fillStyle = CHRONO_COLORS.sand;
    ctx.fill();

    ctx.restore();

    // Spawn falling sand particles
    if (particleSystemRef.current && Math.random() < 0.4) {
      const particle = createParticle(
        centerX + (Math.random() - 0.5) * 4,
        centerY - 8,
        (Math.random() - 0.5) * 0.5,
        1 + Math.random(),
        {
          color: CHRONO_COLORS.sand,
          radius: 1 + Math.random(),
          opacity: 0.8,
          lifetime: 2,
        }
      );
      particleSystemRef.current.addParticle(particle);
    }
  };

  const renderClockHands = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const clockRadius = isMobile ? 35 : 55;

    ctx.save();

    // Clock face circle
    ctx.strokeStyle = CHRONO_COLORS.rune;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, clockRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Hour marks
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const startX = centerX + Math.cos(angle) * (clockRadius - 5);
      const startY = centerY + Math.sin(angle) * (clockRadius - 5);
      const endX = centerX + Math.cos(angle) * clockRadius;
      const endY = centerY + Math.sin(angle) * clockRadius;
      
      ctx.strokeStyle = CHRONO_COLORS.bronze;
      ctx.lineWidth = i % 3 === 0 ? 3 : 1;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // Rotating clock hands
    ctx.globalAlpha = 0.7;
    
    // Hour hand (slow)
    const hourAngle = ((time / 10000) % 1) * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = CHRONO_COLORS.bronze;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(hourAngle) * (clockRadius * 0.5),
      centerY + Math.sin(hourAngle) * (clockRadius * 0.5)
    );
    ctx.stroke();

    // Minute hand (faster)
    const minuteAngle = ((time / 2000) % 1) * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = CHRONO_COLORS.sand;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(minuteAngle) * (clockRadius * 0.75),
      centerY + Math.sin(minuteAngle) * (clockRadius * 0.75)
    );
    ctx.stroke();

    // Center dot
    ctx.fillStyle = CHRONO_COLORS.rune;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const renderOrbitingRunes = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const centerX = width / 2;
    const centerY = height / 2;

    timeRunes.forEach((rune) => {
      const angle = rune.angle + (time / 1000) * rune.speed;
      const layerRadius = rune.layer === 0 ? rune.radius : rune.radius * 0.7;
      const x = centerX + Math.cos(angle) * layerRadius;
      const y = centerY + Math.sin(angle) * layerRadius;

      // Draw rune symbol
      ctx.save();
      ctx.font = `${rune.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = CHRONO_COLORS.glow;
      ctx.globalAlpha = rune.layer === 0 ? 0.8 : 0.6;
      ctx.fillStyle = CHRONO_COLORS.rune;
      ctx.fillText(rune.symbol, x, y);
      
      ctx.restore();

      // Connection line to center (for outer layer only)
      if (!isMobile && rune.layer === 0) {
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = CHRONO_COLORS.bronze;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.restore();
      }
    });
  };

  const renderSandParticles = (ctx: CanvasRenderingContext2D, deltaTime: number, width: number, height: number) => {
    if (!particleSystemRef.current) return;

    // Update particle system
    particleSystemRef.current.update(deltaTime, [], []);

    // Render sand particles
    particleSystemRef.current.particles.forEach((particle) => {
      const safeRadius = Math.max(0.1, particle.radius);
      
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      ctx.shadowBlur = 4;
      ctx.shadowColor = CHRONO_COLORS.sand;
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, safeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
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

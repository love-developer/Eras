// ============================================================================
// CREATIVE NEXUS HORIZON - "Creative Nexus" (Epic Tier)
// ============================================================================
// Achievement: "Multimedia Master" - Upload 50 photos, 50 videos, 50 audio files
// 
// Features:
// - Holographic media thumbnails floating in 3D space
// - Tri-media convergence every 25 seconds
// - Camera shutter snap, film reel spin, audio wave pulse
// - Creative explosion when media types collide
// - Pixels scatter and reform into new arrangement
// - CMY color mixing as particles intersect
// - Interactive hover reveals media icons

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ParticleSystem,
  createExplosion,
  type Particle,
  type Vector2D,
} from '../../utils/particlePhysics';

interface CreativeNexusHorizonProps {
  height: string;
  positioning: string;
  performanceStyle: React.CSSProperties;
  isMobile?: boolean;
}

// CMY color scheme (Cyan, Magenta, Yellow)
const MEDIA_COLORS = {
  photo: '#06b6d4', // Cyan
  video: '#ec4899', // Magenta
  audio: '#fbbf24', // Yellow
};

type ConvergencePhase = 'orbit' | 'approach' | 'collision' | 'explosion' | 'reform';

interface MediaIcon {
  type: 'photo' | 'video' | 'audio';
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
}

export function CreativeNexusHorizon({ height, positioning, performanceStyle, isMobile = false }: CreativeNexusHorizonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const phaseTimerRef = useRef<number>(0);

  // State
  const [phase, setPhase] = useState<ConvergencePhase>('orbit');
  const [mediaIcons, setMediaIcons] = useState<MediaIcon[]>([]);
  
  // Particle system
  const particleSystemRef = useRef<ParticleSystem | null>(null);

  // Performance config
  const PARTICLE_COUNT_ORBIT = isMobile ? 20 : 50;
  const PARTICLE_COUNT_EXPLOSION = isMobile ? 80 : 200;

  // Initialize media icons
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Create 3 main media icons at different positions
    const icons: MediaIcon[] = [
      {
        type: 'photo',
        x: centerX - 80,
        y: centerY - 40,
        vx: 0,
        vy: 0,
        rotation: 0,
        rotationSpeed: 0.5,
        scale: 1,
      },
      {
        type: 'video',
        x: centerX + 80,
        y: centerY - 40,
        vx: 0,
        vy: 0,
        rotation: 0,
        rotationSpeed: 0.7,
        scale: 1,
      },
      {
        type: 'audio',
        x: centerX,
        y: centerY + 60,
        vx: 0,
        vy: 0,
        rotation: 0,
        rotationSpeed: 0.6,
        scale: 1,
      },
    ];

    setMediaIcons(icons);
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
            gravity: 1,
            drag: 0.97,
            maxSpeed: isMobile ? 8 : 12,
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
      updatePhase(deltaTime, canvas.width, canvas.height);

      // Render everything
      renderBackground(ctx, canvas.width, canvas.height, currentTime);
      renderMediaGrid(ctx, canvas.width, canvas.height, currentTime);
      renderMediaIcons(ctx, canvas.width, canvas.height, currentTime);
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
  }, [phase, mediaIcons, isMobile]);

  // Phase management
  const updatePhase = (deltaTime: number, width: number, height: number) => {
    const timer = phaseTimerRef.current;
    const centerX = width / 2;
    const centerY = height / 2;

    // Phase transitions (25-second cycle)
    if (phase === 'orbit' && timer >= 20) {
      setPhase('approach');
    } else if (phase === 'approach' && timer >= 23) {
      setPhase('collision');
    } else if (phase === 'collision' && timer >= 23.5) {
      setPhase('explosion');
      
      // Create explosion particles
      if (particleSystemRef.current) {
        particleSystemRef.current.clear();
        
        // Three-color explosion
        const colors = [MEDIA_COLORS.photo, MEDIA_COLORS.video, MEDIA_COLORS.audio];
        const explosionParticles = createExplosion(
          centerX,
          centerY,
          PARTICLE_COUNT_EXPLOSION,
          isMobile ? 60 : 100,
          colors,
          {
            spread: 1,
            minSpeed: 30,
            maxSpeed: 80,
            minSize: 2,
            maxSize: 4,
            lifetime: 2.5,
          }
        );
        particleSystemRef.current.addParticles(explosionParticles);
      }
    } else if (phase === 'explosion' && timer >= 25) {
      setPhase('reform');
    } else if (phase === 'reform' && timer >= 27) {
      // Reset cycle
      setPhase('orbit');
      phaseTimerRef.current = 0;
      particleSystemRef.current?.clear();
      
      // Reset media icon positions
      setMediaIcons(prev => prev.map((icon, i) => ({
        ...icon,
        x: i === 0 ? centerX - 80 : i === 1 ? centerX + 80 : centerX,
        y: i === 2 ? centerY + 60 : centerY - 40,
        vx: 0,
        vy: 0,
        scale: 1,
      })));
    }

    // Update media icon positions during approach
    if (phase === 'approach') {
      setMediaIcons(prev => prev.map(icon => {
        const dx = centerX - icon.x;
        const dy = centerY - icon.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
          return {
            ...icon,
            x: icon.x + (dx / distance) * 50 * deltaTime,
            y: icon.y + (dy / distance) * 50 * deltaTime,
          };
        }
        return icon;
      }));
    }
  };

  // Render functions
  const renderBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    // Digital grid background
    if (isMobile) {
      // Solid dark background on mobile
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
    } else {
      // Gradient on desktop
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#1e293b');
      gradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
  };

  const renderMediaGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    if (isMobile) return; // Skip grid on mobile

    // Animated grid lines
    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.2;

    const gridSize = 40;
    const offset = (time / 100) % gridSize;

    // Vertical lines
    for (let x = -offset; x < width + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = -offset; y < height + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  };

  const renderMediaIcons = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    mediaIcons.forEach((icon) => {
      ctx.save();
      ctx.translate(icon.x, icon.y);
      ctx.rotate(icon.rotation + (time / 1000) * icon.rotationSpeed);
      ctx.scale(icon.scale, icon.scale);

      const size = isMobile ? 30 : 40;
      const color = MEDIA_COLORS[icon.type];

      // Holographic effect - draw multiple offset copies
      const offsets = isMobile ? 1 : 3;
      for (let i = 0; i < offsets; i++) {
        ctx.save();
        ctx.globalAlpha = 0.3 - i * 0.1;
        ctx.translate(i * 2, i * 2);

        // Draw icon based on type
        if (icon.type === 'photo') {
          // Camera icon
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.fillStyle = color + '40';
          
          // Camera body
          ctx.fillRect(-size / 2, -size / 2, size, size);
          ctx.strokeRect(-size / 2, -size / 2, size, size);
          
          // Lens
          ctx.beginPath();
          ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
          ctx.stroke();
        } else if (icon.type === 'video') {
          // Film reel icon
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.fillStyle = color + '40';
          
          // Triangle play button
          ctx.beginPath();
          ctx.moveTo(-size / 3, -size / 2);
          ctx.lineTo(-size / 3, size / 2);
          ctx.lineTo(size / 2, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (icon.type === 'audio') {
          // Waveform icon
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          
          const bars = 5;
          const barWidth = size / bars;
          for (let j = 0; j < bars; j++) {
            const x = -size / 2 + j * barWidth + barWidth / 2;
            const height = (Math.sin((time / 1000) * 3 + j) * 0.5 + 0.5) * size;
            
            ctx.beginPath();
            ctx.moveTo(x, -height / 2);
            ctx.lineTo(x, height / 2);
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      // Glow
      ctx.globalAlpha = 0.5;
      ctx.shadowBlur = 20;
      ctx.shadowColor = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(-size / 2, -size / 2, size, size);

      ctx.restore();
    });
  };

  const renderParticles = (ctx: CanvasRenderingContext2D, deltaTime: number) => {
    if (!particleSystemRef.current) return;

    // Update particle system
    particleSystemRef.current.update(deltaTime, [], []);

    // Render particles
    particleSystemRef.current.particles.forEach((particle) => {
      // Safety check: ensure radius is positive
      const safeRadius = Math.max(0.1, particle.radius);
      
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      
      // Draw as pixel square (digital aesthetic)
      ctx.fillStyle = particle.color;
      ctx.shadowBlur = 5;
      ctx.shadowColor = particle.color;
      
      const pixelSize = safeRadius * 1.5;
      ctx.fillRect(
        particle.position.x - pixelSize / 2,
        particle.position.y - pixelSize / 2,
        pixelSize,
        pixelSize
      );

      ctx.restore();
    });
  };

  const renderPhaseEffects = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const centerX = width / 2;
    const centerY = height / 2;

    // Collision: Flash and shockwave
    if (phase === 'collision') {
      const collisionAge = phaseTimerRef.current - 23;
      const intensity = Math.max(0, 1 - collisionAge * 2);

      if (intensity > 0) {
        // Flash
        ctx.save();
        ctx.globalAlpha = intensity * 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();

        // Shockwave
        const shockwaveRadius = Math.max(0, collisionAge * (isMobile ? 200 : 400));
        ctx.save();
        ctx.globalAlpha = intensity;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, shockwaveRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Explosion: CMY color mixing rings
    if (phase === 'explosion') {
      const explosionAge = phaseTimerRef.current - 23.5;
      const ringRadius = Math.max(0, explosionAge * (isMobile ? 100 : 200));

      ctx.save();
      ctx.globalAlpha = Math.max(0, 0.6 - explosionAge * 0.3);
      
      // Three expanding rings (C, M, Y)
      const colors = [MEDIA_COLORS.photo, MEDIA_COLORS.video, MEDIA_COLORS.audio];
      colors.forEach((color, i) => {
        const offset = i * 30;
        ctx.strokeStyle = color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius + offset, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.restore();
    }

    // Approach: Connection lines
    if (phase === 'approach') {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 2;

      mediaIcons.forEach((icon, i) => {
        ctx.strokeStyle = MEDIA_COLORS[icon.type];
        ctx.beginPath();
        ctx.moveTo(icon.x, icon.y);
        ctx.lineTo(centerX, centerY);
        ctx.stroke();
      });

      ctx.restore();
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
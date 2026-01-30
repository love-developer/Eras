// ============================================================================
// NOSTALGIA WEAVER HORIZON - "Nostalgia Weaver" (Epic Tier)
// ============================================================================
// Achievement: "Nostalgia Weaver" - Various nostalgia-themed accomplishments
// 
// Features:
// - Tapestry pattern with woven threads
// - Memory fragments float like photos in the wind
// - Thread weaving animation creating constellations
// - Golden hour lighting effect
// - Memory burst every 30 seconds (threads converge into beautiful tapestry)
// - Sepia-toned particles representing memories
// - Mobile-optimized solid colors

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ParticleSystem,
  createParticle,
  type Particle,
} from '../../utils/particlePhysics';

interface NostalgiaWeaverHorizonProps {
  height: string;
  positioning: string;
  performanceStyle: React.CSSProperties;
  isMobile?: boolean;
}

// Nostalgic warm color palette
const NOSTALGIA_COLORS = ['#d97706', '#f59e0b', '#fbbf24', '#92400e', '#78350f'];
const MEMORY_ICONS = ['📸', '💌', '🎞️', '📖', '🎨', '🌅'];

type WeavingPhase = 'drift' | 'gather' | 'weave' | 'tapestry' | 'disperse';

export function NostalgiaWeaverHorizon({ height, positioning, performanceStyle, isMobile = false }: NostalgiaWeaverHorizonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const phaseTimerRef = useRef<number>(0);

  // State
  const [phase, setPhase] = useState<WeavingPhase>('drift');
  
  // Particle system for memory fragments
  const particleSystemRef = useRef<ParticleSystem | null>(null);

  // Performance config
  const THREAD_COUNT = isMobile ? 8 : 16;
  const MEMORY_COUNT = isMobile ? 15 : 40;
  const PARTICLE_COUNT_WEAVE = isMobile ? 60 : 150;

  // Generate floating memory fragments
  const memories = useMemo(() => {
    return Array.from({ length: MEMORY_COUNT }, (_, i) => ({
      id: i,
      icon: MEMORY_ICONS[Math.floor(Math.random() * MEMORY_ICONS.length)],
      x: Math.random() * 100,
      y: Math.random() * 80,
      size: isMobile ? 16 : 20,
      drift: {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 1,
      },
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.5,
      opacity: 0.4 + Math.random() * 0.4,
    }));
  }, [MEMORY_COUNT, isMobile]);

  // Generate weaving threads
  const threads = useMemo(() => {
    return Array.from({ length: THREAD_COUNT }, (_, i) => ({
      id: i,
      startX: Math.random() * 100,
      startY: Math.random() * 100,
      controlX: Math.random() * 100,
      controlY: Math.random() * 100,
      endX: Math.random() * 100,
      endY: Math.random() * 100,
      color: NOSTALGIA_COLORS[Math.floor(Math.random() * NOSTALGIA_COLORS.length)],
      thickness: isMobile ? 2 : 3,
      progress: 0,
    }));
  }, [THREAD_COUNT, isMobile]);

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
            gravity: 0.1,
            drag: 0.99,
            maxSpeed: 4,
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
      renderTapestryPattern(ctx, canvas.width, canvas.height, currentTime);
      renderThreads(ctx, canvas.width, canvas.height, currentTime);
      renderMemories(ctx, canvas.width, canvas.height, currentTime);
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
  const updatePhase = (deltaTime: number, width: number, height: number) => {
    const timer = phaseTimerRef.current;

    // Phase transitions (30-second cycle)
    if (phase === 'drift' && timer >= 24) {
      setPhase('gather');
    } else if (phase === 'gather' && timer >= 26) {
      setPhase('weave');
      // Create weaving particles
      if (particleSystemRef.current) {
        particleSystemRef.current.clear();
        
        // Spawn golden particles representing threads being woven
        for (let i = 0; i < PARTICLE_COUNT_WEAVE; i++) {
          const angle = (i / PARTICLE_COUNT_WEAVE) * Math.PI * 2;
          const radius = width * 0.3;
          const x = width / 2 + Math.cos(angle) * radius;
          const y = height / 2 + Math.sin(angle) * radius;
          
          const particle = createParticle(
            x,
            y,
            -Math.cos(angle) * 30,
            -Math.sin(angle) * 30,
            {
              color: NOSTALGIA_COLORS[Math.floor(Math.random() * NOSTALGIA_COLORS.length)],
              radius: 2 + Math.random() * 2,
              opacity: 0.8,
              lifetime: 2,
            }
          );
          particleSystemRef.current.addParticle(particle);
        }
      }
    } else if (phase === 'weave' && timer >= 28) {
      setPhase('tapestry');
    } else if (phase === 'tapestry' && timer >= 29.5) {
      setPhase('disperse');
    } else if (phase === 'disperse' && timer >= 32) {
      // Reset cycle
      setPhase('drift');
      phaseTimerRef.current = 0;
      particleSystemRef.current?.clear();
    }
  };

  // Render functions
  const renderBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    // Warm nostalgic gradient
    if (isMobile) {
      // Solid warm color on mobile
      ctx.fillStyle = '#92400e';
      ctx.globalAlpha = 0.3;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
    } else {
      // Gradient on desktop
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#78350f');
      gradient.addColorStop(0.5, '#92400e');
      gradient.addColorStop(1, '#d97706');
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
    }
    
    // Dark overlay
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(0, 0, width, height);
  };

  const renderTapestryPattern = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    if (isMobile) return; // Skip on mobile for performance

    // Woven texture pattern
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1;

    const spacing = 20;
    const offset = (time / 100) % spacing;

    // Horizontal threads
    for (let y = -offset; y < height + spacing; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical threads
    for (let x = -offset; x < width + spacing; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    ctx.restore();
  };

  const renderThreads = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    ctx.save();
    
    threads.forEach((thread, i) => {
      // Calculate progress based on phase
      let progress = 0;
      if (phase === 'weave' || phase === 'tapestry') {
        progress = Math.min(1, (phaseTimerRef.current - 26) / 2);
      } else if (phase === 'gather') {
        progress = (phaseTimerRef.current - 24) / 2;
      }

      // Thread path (Bézier curve)
      const startX = (thread.startX / 100) * width;
      const startY = (thread.startY / 100) * height;
      const controlX = (thread.controlX / 100) * width;
      const controlY = (thread.controlY / 100) * height;
      const endX = (thread.endX / 100) * width;
      const endY = (thread.endY / 100) * height;

      ctx.strokeStyle = thread.color;
      ctx.lineWidth = thread.thickness;
      ctx.globalAlpha = 0.3 + progress * 0.5;
      ctx.lineCap = 'round';

      // Draw thread
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      if (progress > 0) {
        // Animate drawing the thread
        const currentEndX = startX + (endX - startX) * progress;
        const currentEndY = startY + (endY - startY) * progress;
        const currentControlX = startX + (controlX - startX) * progress;
        const currentControlY = startY + (controlY - startY) * progress;
        
        ctx.quadraticCurveTo(currentControlX, currentControlY, currentEndX, currentEndY);
        ctx.stroke();

        // Add glow during weave phase
        if (phase === 'weave') {
          ctx.shadowBlur = 10;
          ctx.shadowColor = thread.color;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
    });

    ctx.restore();
  };

  const renderMemories = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    memories.forEach((memory) => {
      // Drift animation
      const driftX = Math.sin(time / 1000 + memory.id) * 10;
      const driftY = Math.cos(time / 1500 + memory.id) * 8;
      
      const x = (memory.x / 100) * width + driftX;
      const y = (memory.y / 100) * height + driftY;

      // During gather phase, move toward center
      let finalX = x;
      let finalY = y;
      
      if (phase === 'gather' || phase === 'weave') {
        const gatherProgress = Math.min(1, (phaseTimerRef.current - 24) / 2);
        const centerX = width / 2;
        const centerY = height / 2;
        
        finalX = x + (centerX - x) * gatherProgress * 0.5;
        finalY = y + (centerY - y) * gatherProgress * 0.5;
      }

      // Render memory icon
      ctx.save();
      ctx.translate(finalX, finalY);
      ctx.rotate(memory.rotation + (time / 2000) * memory.rotationSpeed);
      
      ctx.globalAlpha = memory.opacity;
      ctx.font = `${memory.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Sepia glow
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#fbbf24';
      ctx.fillText(memory.icon, 0, 0);
      
      ctx.restore();
    });
  };

  const renderParticles = (ctx: CanvasRenderingContext2D, deltaTime: number) => {
    if (!particleSystemRef.current) return;

    // Gravity pull during weave phase
    const attractors: { x: number; y: number }[] = [];
    if (phase === 'weave' && canvasRef.current) {
      attractors.push({
        x: canvasRef.current.width / 2,
        y: canvasRef.current.height / 2,
      });
    }

    // Update particle system
    particleSystemRef.current.update(deltaTime, attractors, []);

    // Render golden weaving particles
    particleSystemRef.current.particles.forEach((particle) => {
      // Safety check: ensure radius is positive
      const safeRadius = Math.max(0.1, particle.radius);
      
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = particle.color;
      
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, safeRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  };

  const renderPhaseEffects = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const centerX = width / 2;
    const centerY = height / 2;

    // Tapestry: Beautiful completed pattern
    if (phase === 'tapestry') {
      const tapestryAge = phaseTimerRef.current - 28;
      const glowIntensity = Math.sin(tapestryAge * Math.PI * 2) * 0.5 + 0.5;

      // Radiant golden glow
      ctx.save();
      ctx.globalAlpha = 0.4 + glowIntensity * 0.3;
      
      const glowGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        isMobile ? 100 : 200
      );
      glowGradient.addColorStop(0, '#fbbf24');
      glowGradient.addColorStop(0.5, '#f59e0b40');
      glowGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, width, height);
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
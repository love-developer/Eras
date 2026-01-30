// ============================================================================
// LEGACY ARCHITECT HORIZON - "Legacy Architect" (Epic Tier)
// ============================================================================
// Achievement: "Vault Guardian" - Complete the Vault Mastery tutorial
// 
// CONCEPT: A cosmic architectural forge where monuments materialize from golden energy
// 
// Features:
// - GRAND ARCHITECTURE: Monumental temple rising from cosmic void
// - GOLDEN ENERGY FLOW: Particle streams that construct the monument
// - SACRED GEOMETRY: Divine proportions and golden ratio patterns
// - BLUEPRINT WIREFRAME: Evolving from plans to solid gold
// - 45-second transformation cycle with clear visual progression

import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface LegacyArchitectHorizonProps {
  height: string;
  positioning: string;
  performanceStyle: React.CSSProperties;
  isMobile?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
  size: number;
  color: string;
}

export function LegacyArchitectHorizon({ height, positioning, performanceStyle, isMobile = false }: LegacyArchitectHorizonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Main animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = (timestamp: number) => {
      const deltaTime = Math.min(1 / 30, 1 / 60);
      time += deltaTime;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Get cycle progress (0-1 over 45 seconds)
      const cycleTime = time % 45;
      const cycleProgress = cycleTime / 45;

      // Determine phase
      let phase: 'void' | 'blueprint' | 'energy' | 'forge' | 'monument' | 'radiant' | 'fade';
      let phaseProgress = 0;

      if (cycleTime < 5) {
        phase = 'void';
        phaseProgress = cycleTime / 5;
      } else if (cycleTime < 12) {
        phase = 'blueprint';
        phaseProgress = (cycleTime - 5) / 7;
      } else if (cycleTime < 20) {
        phase = 'energy';
        phaseProgress = (cycleTime - 12) / 8;
      } else if (cycleTime < 28) {
        phase = 'forge';
        phaseProgress = (cycleTime - 20) / 8;
      } else if (cycleTime < 36) {
        phase = 'monument';
        phaseProgress = (cycleTime - 28) / 8;
      } else if (cycleTime < 42) {
        phase = 'radiant';
        phaseProgress = (cycleTime - 36) / 6;
      } else {
        phase = 'fade';
        phaseProgress = (cycleTime - 42) / 3;
      }

      const isGolden = phase === 'monument' || phase === 'radiant';
      const buildProgress = phase === 'void' ? 0 :
                           phase === 'blueprint' ? phaseProgress * 0.2 :
                           phase === 'energy' ? 0.2 + phaseProgress * 0.3 :
                           phase === 'forge' ? 0.5 + phaseProgress * 0.5 :
                           phase === 'monument' || phase === 'radiant' ? 1 :
                           1 - phaseProgress;

      // === BACKGROUND ===
      const bgGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h));
      if (isGolden) {
        bgGradient.addColorStop(0, 'rgba(255, 215, 0, 0.15)');
        bgGradient.addColorStop(0.5, '#1a1a2e');
        bgGradient.addColorStop(1, '#0a0a14');
      } else {
        bgGradient.addColorStop(0, '#1a1a2e');
        bgGradient.addColorStop(1, '#0a0a14');
      }
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, w, h);

      // === STARS ===
      const starCount = isMobile ? 60 : 150;
      for (let i = 0; i < starCount; i++) {
        const sx = ((i * 73) % w);
        const sy = ((i * 137) % h);
        const size = (i % 3) === 0 ? 1.5 : 0.8;
        const twinkle = Math.sin(time * 2 + i) * 0.3 + 0.7;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.6})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // === BLUEPRINT GRID (visible during blueprint/energy phases) ===
      if (phase === 'blueprint' || phase === 'energy') {
        const gridAlpha = phase === 'blueprint' ? phaseProgress : 1 - phaseProgress * 0.5;
        ctx.save();
        ctx.globalAlpha = gridAlpha * 0.4;
        ctx.strokeStyle = '#5B9BD5';
        ctx.lineWidth = 1;

        // Perspective grid
        const gridSize = isMobile ? 20 : 30;
        const horizonY = h * 0.6;
        
        // Horizontal lines
        for (let i = 0; i < gridSize; i++) {
          const y = horizonY + (i / gridSize) * h * 0.4;
          const perspective = 1 - (i / gridSize) * 0.6;
          ctx.globalAlpha = gridAlpha * 0.4 * perspective;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Vertical lines
        for (let i = 0; i < gridSize; i++) {
          const x = (i / gridSize) * w;
          const vanish = w / 2;
          const convergence = (x - vanish) / vanish;
          ctx.globalAlpha = gridAlpha * 0.4 * (1 - Math.abs(convergence) * 0.5);
          ctx.beginPath();
          ctx.moveTo(x, horizonY);
          ctx.lineTo(x + convergence * w * 0.2, h);
          ctx.stroke();
        }

        ctx.restore();
      }

      // === SACRED GEOMETRY CENTER ===
      if (phase !== 'void' && phase !== 'fade') {
        const geomAlpha = phase === 'fade' ? 1 - phaseProgress : Math.min(1, cycleProgress * 3);
        const geomColor = isGolden ? '#FFD700' : '#5B9BD5';
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(time * 0.3);
        ctx.globalAlpha = geomAlpha * 0.7;
        ctx.strokeStyle = geomColor;
        ctx.lineWidth = 2;

        // Nested circles with golden ratio
        for (let layer = 0; layer < 4; layer++) {
          const radius = (isMobile ? 25 : 50) * Math.pow(1.618, layer);
          ctx.globalAlpha = geomAlpha * (0.7 - layer * 0.15);
          
          // Circle
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.stroke();

          // Hexagon
          if (layer % 2 === 0) {
            ctx.beginPath();
            for (let i = 0; i <= 6; i++) {
              const angle = (i / 6) * Math.PI * 2;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      // === GOLDEN PARTICLES ===
      if (phase === 'energy' || phase === 'forge' || phase === 'monument') {
        const maxParticles = isMobile ? 80 : 250;
        const spawnRate = phase === 'forge' ? 0.8 : 0.4;

        // Spawn particles
        if (particlesRef.current.length < maxParticles && Math.random() < spawnRate) {
          const angle = Math.random() * Math.PI * 2;
          const dist = isMobile ? 120 : 200;
          const speed = phase === 'forge' ? 60 : 40;
          
          particlesRef.current.push({
            x: cx + Math.cos(angle) * dist,
            y: cy + Math.sin(angle) * dist,
            vx: -Math.cos(angle) * speed,
            vy: -Math.sin(angle) * speed,
            age: 0,
            maxAge: 1.5 + Math.random(),
            size: 1.5 + Math.random() * 2,
            color: Math.random() > 0.3 ? '#FFD700' : '#FFBF00',
          });
        }

        // Update particles
        particlesRef.current = particlesRef.current.filter(p => {
          p.age += deltaTime;
          p.x += p.vx * deltaTime;
          p.y += p.vy * deltaTime;

          // Pull toward center
          const dx = cx - p.x;
          const dy = cy - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 5) {
            p.vx += (dx / dist) * 80 * deltaTime;
            p.vy += (dy / dist) * 80 * deltaTime;
          }

          // Render
          const alpha = Math.min(1, 1 - p.age / p.maxAge);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          return p.age < p.maxAge;
        });
      } else {
        particlesRef.current = [];
      }

      // === THE MONUMENT ===
      if (buildProgress > 0.05) {
        const monumentColor = isGolden ? '#FFD700' : '#5B9BD5';
        const baseY = h * 0.8;

        // Pillars
        const pillarCount = isMobile ? 5 : 11;
        const pillarSpacing = (isMobile ? 120 : 220);
        const pillarWidth = isMobile ? 10 : 18;
        const maxHeight = isMobile ? 80 : 140;

        for (let i = 0; i < pillarCount; i++) {
          const pillarProgress = Math.max(0, Math.min(1, (buildProgress - i * 0.05) * 1.5));
          if (pillarProgress <= 0) continue;

          const offsetX = (i - (pillarCount - 1) / 2) * (pillarSpacing / pillarCount);
          const x = cx + offsetX;
          const heightVariation = Math.sin(i * 0.7) * 0.2 + 0.9;
          const pillarHeight = maxHeight * heightVariation * pillarProgress;
          const topY = baseY - pillarHeight;

          // 3D pillar
          const leftX = x - pillarWidth / 2;
          const rightX = x + pillarWidth / 2;

          // Front face
          const frontGrad = ctx.createLinearGradient(leftX, topY, rightX, topY);
          frontGrad.addColorStop(0, monumentColor + '70');
          frontGrad.addColorStop(0.5, monumentColor);
          frontGrad.addColorStop(1, monumentColor + '70');
          ctx.fillStyle = frontGrad;
          ctx.fillRect(leftX, topY, pillarWidth, pillarHeight);

          // Side face
          ctx.fillStyle = monumentColor + '40';
          ctx.beginPath();
          ctx.moveTo(rightX, topY);
          ctx.lineTo(rightX + 8, topY - 4);
          ctx.lineTo(rightX + 8, baseY - 4);
          ctx.lineTo(rightX, baseY);
          ctx.closePath();
          ctx.fill();

          // Top cap
          ctx.fillStyle = monumentColor + 'CC';
          ctx.beginPath();
          ctx.moveTo(leftX, topY);
          ctx.lineTo(x, topY - 8);
          ctx.lineTo(rightX + 8, topY - 4);
          ctx.lineTo(rightX, topY);
          ctx.closePath();
          ctx.fill();

          // Glow
          if (isGolden) {
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#FFD700';
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.strokeRect(leftX, topY, pillarWidth, pillarHeight);
            ctx.restore();
          }
        }

        // Central dome (appears at 60%+)
        if (buildProgress > 0.6 && !isMobile) {
          const domeProgress = Math.min(1, (buildProgress - 0.6) / 0.4);
          const domeY = h * 0.4;
          const domeW = 110 * domeProgress;
          const domeH = 75 * domeProgress;

          ctx.save();
          ctx.globalAlpha = domeProgress * 0.9;
          ctx.strokeStyle = monumentColor;
          ctx.lineWidth = 3;

          ctx.beginPath();
          ctx.ellipse(cx, domeY, domeW, domeH, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Dome segments
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, domeY - domeH);
            ctx.lineTo(
              cx + Math.cos(angle) * domeW,
              domeY + Math.sin(angle) * domeH * 0.3
            );
            ctx.stroke();
          }

          if (isGolden) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#FFD700';
            ctx.stroke();
          }

          ctx.restore();
        }

        // Arches (appears at 70%+)
        if (buildProgress > 0.7 && !isMobile) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, (buildProgress - 0.7) / 0.3);
          ctx.strokeStyle = monumentColor;
          ctx.lineWidth = 3;

          for (let i = 0; i < pillarCount - 1; i++) {
            const offsetX1 = (i - (pillarCount - 1) / 2) * (pillarSpacing / pillarCount);
            const offsetX2 = ((i + 1) - (pillarCount - 1) / 2) * (pillarSpacing / pillarCount);
            const x1 = cx + offsetX1;
            const x2 = cx + offsetX2;
            const archY = baseY - maxHeight * 0.85;

            const midX = (x1 + x2) / 2;
            const archHeight = Math.abs(x2 - x1) * 0.35;

            ctx.beginPath();
            ctx.moveTo(x1, archY);
            ctx.quadraticCurveTo(midX, archY - archHeight, x2, archY);
            ctx.stroke();
          }

          ctx.restore();
        }
      }

      // === RADIANT GLOW ===
      if (phase === 'radiant') {
        const pulse = Math.sin(time * 3) * 0.3 + 0.7;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = pulse * 0.4;

        const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.6);
        glowGrad.addColorStop(0, '#FFE66D');
        glowGrad.addColorStop(0.3, '#FFD700');
        glowGrad.addColorStop(0.6, '#FFBF00');
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, w, h);

        // God rays
        const rayCount = isMobile ? 16 : 32;
        for (let i = 0; i < rayCount; i++) {
          const angle = (i / rayCount) * Math.PI * 2 + time * 0.5;
          const length = Math.max(w, h);

          const rayGrad = ctx.createLinearGradient(
            cx, cy,
            cx + Math.cos(angle) * length,
            cy + Math.sin(angle) * length
          );
          rayGrad.addColorStop(0, '#FFD700');
          rayGrad.addColorStop(0.2, 'rgba(255, 215, 0, 0.3)');
          rayGrad.addColorStop(1, 'transparent');

          ctx.fillStyle = rayGrad;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, length, angle - 0.01, angle + 0.01);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [isMobile]);

  return (
    <motion.div
      className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
      style={performanceStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
    </motion.div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LoadingAnimationProps {
  onComplete: () => void;
}

/**
 * 🔷 Moment Prism Gate Animation - FRAGMENTATION → ASSEMBLY
 * 
 * Animation Flow:
 * - 6 triangular prism facets start scattered around screen
 * - Facets spiral inward in hexagonal orbital pattern
 * - Snap together forming complete hexagon prism
 * - Central core pulses with light
 * - Entire hexagon rises diagonally to top-left corner
 * - Fade to reveal Dashboard
 * 
 * Colors: HOME Classic exact shades (Blue, Teal, Gold, Purple, Pink, Blue)
 * 
 * Duration: ~5 seconds
 * Mobile-optimized: No gradients, pure transforms
 */
export function LoadingAnimation({ onComplete }: LoadingAnimationProps) {
  const [stage, setStage] = useState<'split' | 'orbit' | 'merge' | 'reveal' | 'settle' | 'complete'>('split');
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);

  console.log('🎬🎬🎬 LoadingAnimation component RENDERING (MOMENT PRISM GATE)');
  console.log('🎬 Current stage:', stage);

  // Detect mobile on mount
  useEffect(() => {
    try {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      console.log('📱 LoadingAnimation: isMobile =', mobile);
      setTimeout(() => {
        console.log('✅ LoadingAnimation: Ready to render');
        setIsReady(true);
      }, 50);
    } catch (e) {
      console.error('❌ Error detecting mobile:', e);
      setError(e as Error);
    }
  }, []);

  // Prism facet colors - HOME Classic exact colors (NO gradients for mobile compatibility)
  const facetColors = [
    '#9333ea',  // Purple (Draft) - Position 0 / #1 (moved from #6)
    '#ec4899',  // Pink (All Capsules) - Position 1 / #2 (moved from #5)
    '#3b82f6',  // Blue (Scheduled) - Position 2 / #3 (moved from #1)
    'rgba(255, 255, 255, 0.15)',  // Translucent - Position 3 / #4 (STAYS)
    '#10b981',  // Emerald/Teal (Delivered) - Position 4 / #5 (moved from #2)
    '#f59e0b',  // Amber/Gold (Received) - Position 5 / #6 (moved from #3)
  ];

  useEffect(() => {
    console.log('⏱️ LoadingAnimation: Setting up Prism Gate animation timers');
    try {
      const timers = [
        setTimeout(() => {
          console.log('🎬 Stage: orbit (facets spiraling inward)');
          setStage('orbit');
        }, 400),
        setTimeout(() => {
          console.log('🎬 Stage: merge (facets snapping together)');
          setStage('merge');
        }, 2600),
        setTimeout(() => {
          console.log('🎬 Stage: reveal (core light pulsing)');
          setStage('reveal');
        }, 3500),
        setTimeout(() => {
          console.log('🎬 Stage: settle (final glow)');
          setStage('settle');
        }, 4200),
        setTimeout(() => {
          console.log('🎬 Stage: complete');
          setStage('complete');
        }, 5000),
        setTimeout(() => {
          console.log('✅ LoadingAnimation: Prism Gate complete, calling onComplete');
          onComplete();
        }, 5100),
      ];

      return () => {
        console.log('🧹 LoadingAnimation: Cleaning up timers');
        timers.forEach(clearTimeout);
      };
    } catch (e) {
      console.error('❌ Error setting up timers:', e);
      setError(e as Error);
    }
  }, [onComplete]);

  if (error) {
    console.error('❌ LoadingAnimation ERROR:', error);
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-[99999]">
        <div className="text-white text-center">
          <p>Animation Error</p>
          <button 
            onClick={onComplete}
            className="mt-4 px-4 py-2 bg-white text-slate-900 rounded"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-[99999]" />
    );
  }

  // Generate hexagon vertices (final assembled positions)
  const hexRadius = 80;
  const hexVertices = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60 - 90) * (Math.PI / 180); // Start at top
    return {
      x: Math.cos(angle) * hexRadius,
      y: Math.sin(angle) * hexRadius
    };
  });

  // Generate facets (triangles from center to adjacent vertices)
  const facets = facetColors.map((color, i) => {
    const v1 = hexVertices[i];
    const v2 = hexVertices[(i + 1) % 6];
    
    // Scatter position (far from center)
    const scatterAngle = (i * 60) * (Math.PI / 180);
    const scatterRadius = 300;
    const scatterX = Math.cos(scatterAngle) * scatterRadius;
    const scatterY = Math.sin(scatterAngle) * scatterRadius;
    
    return {
      id: i,
      color,
      // SVG path: triangle from origin to v1 to v2
      path: `M 0 0 L ${v1.x} ${v1.y} L ${v2.x} ${v2.y} Z`,
      scatterX,
      scatterY,
      // Sparkle position (midpoint of outer edge)
      sparkleX: (v1.x + v2.x) / 2,
      sparkleY: (v1.y + v2.y) / 2
    };
  });

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-[99999] overflow-hidden">
      <AnimatePresence>
        {stage !== 'complete' && (
          <motion.div
            className="relative"
            style={{ width: '100vw', height: '100vh' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Prism Facets */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                width={isMobile ? 300 : 400}
                height={isMobile ? 300 : 400}
                viewBox="-200 -200 400 400"
                className="overflow-visible"
              >
                {/* Wrap everything in a group that moves together during settle */}
                <motion.g
                  initial={{ x: 0, y: 0, rotate: 0, scale: 1 }}
                  animate={{
                    x: stage === 'settle' ? (isMobile ? -280 : -580) : 0,
                    y: stage === 'settle' ? (isMobile ? -220 : -280) : 0,
                    rotate: stage === 'settle' ? 720 : 0,
                    scale: stage === 'settle' ? (isMobile ? 0.25 : 0.35) : 1,
                  }}
                  transition={{
                    duration: 0.8,
                    ease: "easeInOut"
                  }}
                >
                  {/* Central core (appears during reveal) */}
                  {(stage === 'reveal' || stage === 'settle') && (
                    <motion.circle
                      cx="0"
                      cy="0"
                      r="40"
                      fill="#fef3c7"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: stage === 'settle' ? 1 : [0, 1.2, 1],
                        opacity: stage === 'settle' ? 0.9 : 1 
                      }}
                      transition={{ 
                        duration: stage === 'settle' ? 0.8 : 0.6,
                        ease: "easeOut" 
                      }}
                    />
                  )}

                  {/* 6 Hexagonal Facets */}
                  {facets.map((facet, i) => {
                    // Determine transform based on stage
                    let x = facet.scatterX;
                    let y = facet.scatterY;
                    let opacity = 0;
                    let scale = 0.5;
                    let rotate = 360 + i * 45; // Spin effect

                    if (stage === 'orbit') {
                      // Spiraling inward WITH SPIN
                      x = facet.scatterX * 0.3;
                      y = facet.scatterY * 0.3;
                      opacity = 1;
                      scale = 0.8;
                      rotate = 720 + i * 90; // Full 2x spin during orbit
                    } else if (stage === 'merge' || stage === 'reveal' || stage === 'settle') {
                      // Assembled at center (STAY at 0,0 - the parent group moves)
                      x = 0;
                      y = 0;
                      opacity = stage === 'settle' ? 0 : 1;
                      scale = 1;
                      rotate = 1080; // Continue spinning to 3 full rotations
                    }

                    return (
                      <g key={facet.id}>
                        {/* Triangular facet */}
                        <motion.path
                          d={facet.path}
                          fill={facet.color}
                          stroke="#ffffff"
                          strokeWidth={stage === 'merge' || stage === 'reveal' || stage === 'settle' ? 2 : 1}
                          initial={{
                            x: facet.scatterX,
                            y: facet.scatterY,
                            opacity: 0,
                            scale: 0.5,
                            rotate: 360 + i * 45
                          }}
                          animate={{
                            x,
                            y,
                            opacity,
                            scale,
                            rotate
                          }}
                          transition={{
                            duration: stage === 'split' ? 0.4 : stage === 'orbit' ? 2.2 : 0.9,
                            ease: stage === 'merge' ? [0.68, -0.55, 0.27, 1.55] : "easeInOut",
                            delay: stage === 'split' ? i * 0.05 : 0
                          }}
                        />
                      </g>
                    );
                  })}

                  {/* Outer glow ring (appears during reveal) */}
                  {(stage === 'reveal' || stage === 'settle') && (
                    <motion.circle
                      cx="0"
                      cy="0"
                      r="95"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="3"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ 
                        scale: stage === 'settle' ? 1.1 : 1,
                        opacity: stage === 'settle' ? 0 : 0.4 
                      }}
                      transition={{ duration: 0.8 }}
                    />
                  )}

                  {/* Inner glow ring (appears during reveal) */}
                  {(stage === 'reveal' || stage === 'settle') && (
                    <motion.circle
                      cx="0"
                      cy="0"
                      r="48"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: 1,
                        opacity: 0.6
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </motion.g>
              </svg>
            </div>

            {/* "ERAS" text (fades in during reveal) */}
            {(stage === 'reveal' || stage === 'settle') && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: stage === 'settle' ? 0 : 1,
                  scale: 1 
                }}
                transition={{ duration: 0.6 }}
              >
                <div 
                  className="text-white font-black tracking-tight"
                  style={{
                    fontSize: isMobile ? '20px' : '28px',
                    fontFamily: '"SF Pro Display", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)',
                    letterSpacing: '-0.02em'
                  }}
                >
                  ERAS
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
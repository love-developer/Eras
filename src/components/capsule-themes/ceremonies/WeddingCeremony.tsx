import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Heart } from 'lucide-react';

interface WeddingCeremonyProps {
  isVisible: boolean;
  onComplete: () => void;
}

// Atmospheric color interpolation
const interpolateColor = (color1: number[], color2: number[], factor: number): string => {
  const result = color1.map((c, i) => Math.round(c + factor * (color2[i] - c)));
  return `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
};

// Sky color stops based on sun height (0 = horizon, 1 = top)
const SKY_GRADIENT_COLORS = [
  // Horizon (0.0 - 0.2): Deep oranges and magentas
  { stop: 0.0, top: [124, 58, 237], bottom: [244, 114, 182] }, // purple to pink
  { stop: 0.2, top: [139, 92, 246], bottom: [251, 146, 60] },  // violet to orange
  // Mid (0.2 - 0.5): Transition zone
  { stop: 0.5, top: [186, 230, 253], bottom: [254, 215, 170] }, // light blue to peach
  // High (0.5 - 1.0): Daytime blues
  { stop: 0.8, top: [125, 211, 252], bottom: [186, 230, 253] }, // blue to light blue
  { stop: 1.0, top: [56, 189, 248], bottom: [135, 206, 235] },  // sky blue
];

const SUN_COLORS = [
  { threshold: 0.0, color: [234, 88, 12] },   // Deep red-orange (horizon)
  { threshold: 0.15, color: [251, 146, 60] }, // Orange
  { threshold: 0.4, color: [251, 191, 36] },  // Golden
  { threshold: 0.6, color: [254, 240, 138] }, // Light yellow
  { threshold: 1.0, color: [255, 255, 255] }, // White (high sun)
];

export function WeddingCeremony({ isVisible, onComplete }: WeddingCeremonyProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [sunPosition, setSunPosition] = useState({ x: 70, y: 15 }); // Start at top-right
  const [goldenHourTriggered, setGoldenHourTriggered] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [cloudOffset, setCloudOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Motion values for smooth dragging
  const sunY = useMotionValue(sunPosition.y);

  // Calculate sun height percentage (0 = horizon, 1 = top)
  const getSunHeightPercent = () => {
    return Math.max(0, Math.min(1, sunPosition.y / 70)); // 70 is horizon line
  };

  // Get sky colors based on sun height
  const getSkyColors = () => {
    const height = getSunHeightPercent();
    
    // Find the two color stops to interpolate between
    let lowerStop = SKY_GRADIENT_COLORS[0];
    let upperStop = SKY_GRADIENT_COLORS[SKY_GRADIENT_COLORS.length - 1];
    
    for (let i = 0; i < SKY_GRADIENT_COLORS.length - 1; i++) {
      if (height >= SKY_GRADIENT_COLORS[i].stop && height <= SKY_GRADIENT_COLORS[i + 1].stop) {
        lowerStop = SKY_GRADIENT_COLORS[i];
        upperStop = SKY_GRADIENT_COLORS[i + 1];
        break;
      }
    }
    
    const factor = (height - lowerStop.stop) / (upperStop.stop - lowerStop.stop);
    
    return {
      top: interpolateColor(lowerStop.top, upperStop.top, factor),
      bottom: interpolateColor(lowerStop.bottom, upperStop.bottom, factor),
    };
  };

  // Get sun color based on height
  const getSunColor = () => {
    const height = getSunHeightPercent();
    
    let color = SUN_COLORS[0].color;
    for (let i = 0; i < SUN_COLORS.length - 1; i++) {
      if (height >= SUN_COLORS[i].threshold && height <= SUN_COLORS[i + 1].threshold) {
        const factor = (height - SUN_COLORS[i].threshold) / (SUN_COLORS[i + 1].threshold - SUN_COLORS[i].threshold);
        color = SUN_COLORS[i].color.map((c, idx) => 
          Math.round(c + factor * (SUN_COLORS[i + 1].color[idx] - c))
        );
        break;
      }
    }
    
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  };

  // Get sun size based on height (larger at horizon)
  const getSunSize = () => {
    const height = getSunHeightPercent();
    const baseSize = 60;
    const horizonBoost = 40;
    return baseSize + horizonBoost * (1 - height);
  };

  // Cloud drift animation
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setCloudOffset(prev => (prev + 0.1) % 100);
    }, 50);
    
    return () => clearInterval(interval);
  }, [isVisible]);

  // Initialize audio
  useEffect(() => {
    if (isVisible && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.log('Audio not available');
      }
    }
  }, [isVisible]);

  // Play tone
  const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.2) => {
    if (!audioContextRef.current) return;
    
    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.log('Sound playback failed');
    }
  };

  const vibrate = (pattern: number | number[]) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // Handle drag
  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    
    const newY = ((clientY - rect.top) / rect.height) * 100;
    const newX = ((clientX - rect.left) / rect.width) * 100;
    
    // Constrain Y to 5-75% (can't go too high or too low)
    const constrainedY = Math.max(5, Math.min(75, newY));
    
    setSunPosition({ x: newX, y: constrainedY });
    sunY.set(constrainedY);
    
    // Check if reached horizon (golden hour trigger)
    if (constrainedY >= 68 && !goldenHourTriggered) {
      triggerGoldenHour();
    }
  };

  // Trigger golden hour moment
  const triggerGoldenHour = () => {
    setGoldenHourTriggered(true);
    
    // Snap to horizon
    setSunPosition(prev => ({ ...prev, y: 70 }));
    
    // Haptic and audio
    vibrate([100, 50, 100]);
    playTone(440, 0.3, 'sine', 0.25);
    setTimeout(() => playTone(554, 0.5, 'sine', 0.2), 150);
    
    // Reveal after light show
    setTimeout(() => {
      setShowReveal(true);
      vibrate([50, 30, 50, 30, 100]);
      
      setTimeout(() => {
        onComplete();
      }, 3000);
    }, 2000);
  };

  if (!isVisible) return null;

  const skyColors = getSkyColors();
  const sunColor = getSunColor();
  const sunSize = getSunSize();

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none"
      onMouseMove={handleDrag}
      onTouchMove={handleDrag}
      onMouseUp={() => setIsDragging(false)}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* Sky gradient */}
      <div 
        className="absolute inset-0 transition-all duration-500"
        style={{
          background: `linear-gradient(to bottom, ${skyColors.top}, ${skyColors.bottom})`
        }}
      />

      {/* Stars (visible at low sun positions) */}
      {getSunHeightPercent() < 0.2 && (
        <div className="absolute inset-0">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${(i * 13.7) % 100}%`,
                top: `${(i * 7.3) % 40}%`,
              }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 2 + (i % 3),
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      )}

      {/* Volumetric clouds */}
      <div className="absolute inset-0 pointer-events-none">
        {[0, 1, 2, 3, 4].map((cloudIndex) => {
          const baseY = 15 + cloudIndex * 12;
          const baseX = (cloudIndex * 25 + cloudOffset) % 120 - 20;
          const isNearSun = Math.abs(baseY - sunPosition.y) < 15 && Math.abs(baseX - sunPosition.x) < 20;
          
          return (
            <motion.div
              key={cloudIndex}
              className="absolute"
              style={{
                left: `${baseX}%`,
                top: `${baseY}%`,
                filter: 'blur(1px)',
              }}
              animate={{
                opacity: isNearSun && getSunHeightPercent() < 0.3 ? [0.6, 0.9, 0.6] : 0.7,
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {/* Cloud shape */}
              <div className="relative">
                <div 
                  className="w-24 h-8 rounded-full transition-all duration-500"
                  style={{
                    background: isNearSun && getSunHeightPercent() < 0.3
                      ? `linear-gradient(to right, rgba(251, 146, 60, 0.4), rgba(244, 114, 182, 0.3))`
                      : 'rgba(255, 255, 255, 0.6)',
                  }}
                />
                <div 
                  className="absolute top-2 left-6 w-20 h-6 rounded-full transition-all duration-500"
                  style={{
                    background: isNearSun && getSunHeightPercent() < 0.3
                      ? `rgba(251, 191, 36, 0.3)`
                      : 'rgba(255, 255, 255, 0.5)',
                  }}
                />
                <div 
                  className="absolute top-4 left-12 w-16 h-5 rounded-full transition-all duration-500"
                  style={{
                    background: isNearSun && getSunHeightPercent() < 0.3
                      ? `rgba(251, 146, 60, 0.25)`
                      : 'rgba(255, 255, 255, 0.4)',
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Flying birds (silhouettes) */}
      {[0, 1, 2].map((birdIndex) => (
        <motion.div
          key={birdIndex}
          className="absolute text-2xl pointer-events-none"
          initial={{ x: '-10%', y: `${30 + birdIndex * 10}%` }}
          animate={{ 
            x: '110%',
            y: `${30 + birdIndex * 10 + Math.sin(Date.now() / 1000 + birdIndex) * 5}%`
          }}
          transition={{
            duration: 15 + birdIndex * 3,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ opacity: getSunHeightPercent() < 0.5 ? 0.6 : 0.3 }}
        >
          🦅
        </motion.div>
      ))}

      {/* Mountain silhouette */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none">
        <svg viewBox="0 0 1000 300" className="w-full h-full" preserveAspectRatio="none">
          {/* Far mountains */}
          <path
            d="M0,200 L200,120 L350,160 L500,80 L650,140 L800,100 L1000,180 L1000,300 L0,300 Z"
            fill="rgba(15, 23, 42, 0.3)"
          />
          {/* Mid mountains */}
          <path
            d="M0,240 L150,180 L280,200 L450,140 L600,190 L750,160 L900,200 L1000,220 L1000,300 L0,300 Z"
            fill="rgba(15, 23, 42, 0.5)"
          />
          {/* Close mountains */}
          <path
            d="M0,260 L120,220 L250,240 L400,200 L550,230 L700,210 L850,240 L1000,250 L1000,300 L0,300 Z"
            fill="rgba(15, 23, 42, 0.8)"
          />
        </svg>
      </div>

      {/* Water reflection */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(15, 23, 42, 0.2) 100%)',
        }}
      >
        {/* Reflected sun */}
        {sunPosition.y >= 60 && (
          <motion.div
            className="absolute rounded-full blur-md"
            style={{
              left: `${sunPosition.x}%`,
              top: `${(70 - sunPosition.y) * 2 + 10}%`,
              width: `${sunSize * 0.8}px`,
              height: `${sunSize * 1.5}px`,
              background: `radial-gradient(circle, ${sunColor} 0%, transparent 70%)`,
              opacity: 0.4,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
        
        {/* Ripples */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute left-0 right-0 h-px bg-white/10"
            style={{
              top: `${30 + i * 20}%`,
            }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              scaleX: [1, 1.02, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* The Sun (draggable) */}
      <motion.div
        className="absolute rounded-full cursor-grab active:cursor-grabbing"
        style={{
          left: `${sunPosition.x}%`,
          top: `${sunPosition.y}%`,
          width: `${sunSize}px`,
          height: `${sunSize}px`,
          background: `radial-gradient(circle, ${sunColor} 0%, ${sunColor} 60%, transparent 100%)`,
          boxShadow: goldenHourTriggered 
            ? `0 0 ${sunSize * 2}px ${sunSize / 2}px ${sunColor}` 
            : `0 0 ${sunSize}px ${sunSize / 4}px ${sunColor}`,
          transform: 'translate(-50%, -50%)',
        }}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Sun core */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 60%)`,
          }}
        />
      </motion.div>

      {/* God rays (when at horizon) */}
      <AnimatePresence>
        {goldenHourTriggered && (
          <>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
              const angle = -40 + i * 10;
              return (
                <motion.div
                  key={i}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${sunPosition.x}%`,
                    top: `${sunPosition.y}%`,
                    width: '2px',
                    height: '200%',
                    background: `linear-gradient(to top, ${sunColor.replace('rgb', 'rgba').replace(')', ', 0.3)')} 0%, transparent 60%)`,
                    transformOrigin: 'bottom center',
                    transform: `translate(-50%, 0) rotate(${angle}deg)`,
                  }}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ 
                    opacity: [0, 0.6, 0.4, 0.6, 0.4],
                    scaleY: 1,
                  }}
                  transition={{
                    opacity: { duration: 2, repeat: Infinity },
                    scaleY: { duration: 1, ease: 'easeOut' },
                  }}
                />
              );
            })}
          </>
        )}
      </AnimatePresence>

      {/* Lens flare (when at horizon) */}
      <AnimatePresence>
        {goldenHourTriggered && (
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: `${sunPosition.x}%`,
              top: `${sunPosition.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0.7], scale: [0, 3, 2] }}
            transition={{ duration: 1.5 }}
          >
            {/* Main flare */}
            <div
              className="w-32 h-32 rounded-full"
              style={{
                background: `radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%)`,
              }}
            />
            {/* Secondary flares */}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 rounded-full"
                style={{
                  width: `${40 - i * 10}px`,
                  height: `${40 - i * 10}px`,
                  background: `radial-gradient(circle, rgba(251, 146, 60, ${0.3 - i * 0.1}) 0%, transparent 70%)`,
                  transform: `translate(calc(-50% + ${(i + 1) * 40}px), -50%)`,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <AnimatePresence>
        {!goldenHourTriggered && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-8 left-0 right-0 text-center z-50 pointer-events-none"
          >
            <h2 
              className="text-4xl font-serif font-bold mb-2 drop-shadow-lg transition-colors duration-500"
              style={{
                color: getSunHeightPercent() < 0.3 ? '#fef3c7' : '#78716c',
              }}
            >
              Golden Hour
            </h2>
            <p 
              className="text-lg italic drop-shadow transition-colors duration-500"
              style={{
                color: getSunHeightPercent() < 0.3 ? '#fde68a' : '#a8a29e',
              }}
            >
              Drag the sun to the horizon
            </p>
            
            {/* Progress indicator */}
            <motion.div 
              className="mt-4 mx-auto w-48 h-2 bg-white/20 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-amber-300 to-orange-500 rounded-full"
                style={{
                  width: `${Math.max(0, (1 - getSunHeightPercent()) * 100)}%`,
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Golden Hour Achievement */}
      <AnimatePresence>
        {showReveal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none"
          >
            {/* Warm overlay */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at center, rgba(251, 146, 60, 0.2) 0%, transparent 70%)',
              }}
            />
            
            {/* Success message */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="relative text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-8xl mb-6"
              >
                🌅
              </motion.div>
              
              <h3 
                className="text-5xl font-serif font-bold mb-4"
                style={{
                  color: '#fef3c7',
                  textShadow: '0 0 30px rgba(251, 191, 36, 0.8), 0 4px 6px rgba(0,0,0,0.3)',
                }}
              >
                Golden Hour Captured
              </h3>
              
              <p className="text-xl text-amber-200 italic">
                Your moment bathed in perfect light
              </p>
            </motion.div>

            {/* Sparkle particles */}
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-3xl"
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.5],
                  rotate: Math.random() * 360,
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: Math.random() * 0.5,
                }}
              >
                {['✨', '🌟', '☀️', '💛'][i % 4]}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS for animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

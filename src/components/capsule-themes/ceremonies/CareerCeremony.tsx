import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Flag } from 'lucide-react';

interface CareerCeremonyProps {
  onComplete: () => void;
  isVisible: boolean;
}

// Waypoints for the climbing path (percentage positions on screen)
const WAYPOINTS = [
  { x: 10, y: 90 },  // Base camp
  { x: 20, y: 75 },  // Lower slopes
  { x: 35, y: 60 },  // Mid-mountain 1
  { x: 50, y: 45 },  // Mid-mountain 2
  { x: 70, y: 30 },  // Upper slopes
  { x: 85, y: 15 },  // Near summit
  { x: 90, y: 10 },  // Summit
];

const MILESTONES = [
  { index: 1, text: 'Journey Begins', elevation: '1,700 ft' },
  { index: 3, text: 'Halfway There', elevation: '5,100 ft' },
  { index: 5, text: 'Above the Clouds', elevation: '8,500 ft' },
];

export function CareerCeremony({ onComplete, isVisible }: CareerCeremonyProps) {
  const [currentWaypoint, setCurrentWaypoint] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showAchievement, setShowAchievement] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showFlag, setShowFlag] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastClickTimeRef = useRef(0);

  const progress = currentWaypoint / (WAYPOINTS.length - 1);
  const elevation = Math.round(progress * 10000);

  // Initialize audio context on first interaction
  useEffect(() => {
    if (isVisible && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.log('Audio not available');
      }
    }
  }, [isVisible]);

  // Play sounds
  const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
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

  const playFootstep = (step: number) => {
    // Ascending scale - higher pitch each step
    const baseFreq = 200 + (step * 50);
    playSound(baseFreq, 0.1, 'square', 0.2);
  };

  const playAchievement = () => {
    // Chime sound
    playSound(523.25, 0.3, 'sine', 0.3); // C5
    setTimeout(() => playSound(659.25, 0.3, 'sine', 0.3), 100); // E5
  };

  const playSummitCelebration = () => {
    // Triumphant chord progression
    [261.63, 329.63, 392.00].forEach((freq, i) => {
      setTimeout(() => playSound(freq, 1.0, 'sine', 0.25), i * 100);
    });
  };

  // Haptic feedback
  const vibrate = (pattern: number | number[]) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // Handle click/tap to advance
  const handleClick = () => {
    if (isMoving || showCelebration || currentWaypoint >= WAYPOINTS.length - 1) return;
    
    const now = Date.now();
    if (now - lastClickTimeRef.current < 300) return; // Prevent spam clicking
    
    lastClickTimeRef.current = now;
    setShowInstructions(false);
    advanceClimber();
  };

  const advanceClimber = () => {
    setIsMoving(true);
    lastClickTimeRef.current = Date.now();
    
    const nextWaypoint = currentWaypoint + 1;
    
    // Play footstep sound
    playFootstep(nextWaypoint);
    
    // Haptic feedback
    vibrate(30);
    
    // Move climber
    setTimeout(() => {
      setCurrentWaypoint(nextWaypoint);
      setIsMoving(false);
      
      // Check for milestones
      const milestone = MILESTONES.find(m => m.index === nextWaypoint);
      if (milestone) {
        setShowAchievement(milestone.text);
        playAchievement();
        vibrate([20, 40, 60]);
        setTimeout(() => setShowAchievement(null), 1500);
      }
      
      // Check if reached summit
      if (nextWaypoint === WAYPOINTS.length - 1) {
        reachSummit();
      }
    }, 400);
  };

  const reachSummit = () => {
    setTimeout(() => {
      // Plant flag
      setShowFlag(true);
      playSound(100, 0.3, 'square', 0.4); // Thunk sound
      vibrate(50);
      
      setTimeout(() => {
        // Sunrise and celebration
        setShowCelebration(true);
        playSummitCelebration();
        vibrate([50, 30, 50, 30, 100]);
        
        setTimeout(() => {
          onComplete();
        }, 2500);
      }, 800);
    }, 300);
  };

  // Sky gradient based on progress
  const getSkyGradient = () => {
    if (progress < 0.17) {
      // Base camp - Night
      return 'linear-gradient(to bottom, #1a1a3e, #0d0d1f)';
    } else if (progress < 0.33) {
      // Lower slopes - Early dawn
      return 'linear-gradient(to bottom, #2a2550, #1a1a3e)';
    } else if (progress < 0.50) {
      // Mid-mountain - Dawn approaching
      return 'linear-gradient(to bottom, #4a3a7e, #2a2550)';
    } else if (progress < 0.83) {
      // Upper slopes - Dawn breaking
      return 'linear-gradient(to bottom, #6a5a9e, #4a3a7e)';
    } else if (progress < 1.0) {
      // Near summit - Sunrise approaching
      return 'linear-gradient(to bottom, #8a7abe 0%, #ff8fa3 50%, #ffb380 100%)';
    } else {
      // Summit - Full sunrise
      return 'linear-gradient(to bottom, #87ceeb 0%, #ffd700 50%, #ff6b35 100%)';
    }
  };

  const starsOpacity = Math.max(0, 1 - progress * 1.5);
  const cloudsVisible = progress > 0.33;
  const cloudsOpacity = Math.min(0.7, (progress - 0.33) * 2);
  const sunVisible = progress > 0.67;
  const sunIntensity = Math.min(1, (progress - 0.67) * 3);

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden"
      style={{ background: getSkyGradient(), transition: 'background 0.4s ease' }}
      onClick={handleClick}
    >
      {/* Stars */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: starsOpacity, transition: 'opacity 0.4s ease' }}
      >
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${10 + (i * 6) % 80}%`,
              top: `${5 + (i * 7) % 40}%`,
              opacity: 0.6 + (i % 3) * 0.2,
            }}
          />
        ))}
      </div>

      {/* Sun */}
      {sunVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: sunIntensity, scale: 1 }}
          className="absolute"
          style={{
            right: '15%',
            top: '12%',
            width: '80px',
            height: '80px',
          }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: 'radial-gradient(circle, #fffacd 0%, #ffd700 50%, transparent 70%)',
              boxShadow: `0 0 ${40 * sunIntensity}px ${20 * sunIntensity}px rgba(255, 215, 0, ${0.6 * sunIntensity})`,
            }}
          />
        </motion.div>
      )}

      {/* Clouds */}
      {cloudsVisible && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: cloudsOpacity, transition: 'opacity 0.4s ease' }}
        >
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full blur-sm"
              style={{
                left: `${20 + i * 25}%`,
                bottom: `${10 + i * 5}%`,
                width: `${100 + i * 30}px`,
                height: `${40 + i * 10}px`,
                background: progress > 0.9 ? '#fff5e6' : '#e8d5f0',
                opacity: 0.4,
              }}
            />
          ))}
        </div>
      )}

      {/* Mountain Silhouette */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Mountain shape */}
        <path
          d="M 0,100 L 0,60 L 30,40 L 50,20 L 70,35 L 90,10 L 100,15 L 100,100 Z"
          fill="#0a0a14"
          opacity="0.9"
        />
      </svg>

      {/* Climbing Path */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Path segments */}
        {WAYPOINTS.slice(0, -1).map((point, i) => {
          const nextPoint = WAYPOINTS[i + 1];
          const isCompleted = i < currentWaypoint;
          const isCurrent = i === currentWaypoint;
          
          return (
            <g key={i}>
              {/* Path line */}
              <line
                x1={point.x}
                y1={point.y}
                x2={nextPoint.x}
                y2={nextPoint.y}
                stroke={isCompleted ? '#ffd700' : '#4a5a7a'}
                strokeWidth="0.8"
                strokeDasharray={isCompleted ? '0' : '2,2'}
                opacity={isCompleted ? 1 : 0.6}
                style={{
                  filter: isCompleted ? 'drop-shadow(0 0 3px #ffd700)' : 'none',
                  transition: 'all 0.4s ease',
                }}
              />
              
              {/* Waypoint markers */}
              <circle
                cx={point.x}
                cy={point.y}
                r={isCompleted ? '1.5' : '1'}
                fill={isCompleted ? '#ffd700' : '#4a5a7a'}
                opacity={isCompleted ? 1 : 0.4}
                style={{
                  filter: isCompleted ? 'drop-shadow(0 0 2px #ffd700)' : 'none',
                  transition: 'all 0.4s ease',
                }}
              />
              
              {/* Pulse on current segment */}
              {isCurrent && !isMoving && (
                <circle
                  cx={nextPoint.x}
                  cy={nextPoint.y}
                  r="2"
                  fill="none"
                  stroke="#ffd700"
                  strokeWidth="0.5"
                  opacity="0"
                >
                  <animate
                    attributeName="r"
                    values="2;4;2"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.8;0;0.8"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}
        
        {/* Final waypoint (summit) */}
        <circle
          cx={WAYPOINTS[WAYPOINTS.length - 1].x}
          cy={WAYPOINTS[WAYPOINTS.length - 1].y}
          r={currentWaypoint === WAYPOINTS.length - 1 ? '2' : '1.2'}
          fill={currentWaypoint === WAYPOINTS.length - 1 ? '#ffd700' : '#ff6b35'}
          opacity={currentWaypoint === WAYPOINTS.length - 1 ? 1 : 0.7}
          style={{
            filter: currentWaypoint === WAYPOINTS.length - 1 ? 'drop-shadow(0 0 3px #ffd700)' : 'none',
            transition: 'all 0.4s ease',
          }}
        />
      </svg>

      {/* Climber */}
      <motion.div
        className="absolute z-20 pointer-events-none"
        style={{
          left: `${WAYPOINTS[currentWaypoint].x}%`,
          top: `${WAYPOINTS[currentWaypoint].y}%`,
        }}
        animate={{
          left: `${WAYPOINTS[currentWaypoint].x}%`,
          top: `${WAYPOINTS[currentWaypoint].y}%`,
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        <User
          className="w-6 h-6"
          style={{
            color: progress > 0.5 ? '#ffd700' : '#ffffff',
            filter: `drop-shadow(0 0 4px ${progress > 0.5 ? '#ffd700' : '#ffffff'})`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      </motion.div>

      {/* Flag at summit */}
      <AnimatePresence>
        {showFlag && (
          <motion.div
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="absolute z-30 pointer-events-none"
            style={{
              left: `${WAYPOINTS[WAYPOINTS.length - 1].x}%`,
              top: `${WAYPOINTS[WAYPOINTS.length - 1].y}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <Flag className="w-8 h-8 text-red-500" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none z-40">
        {/* Instructions */}
        <AnimatePresence>
          {showInstructions && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 text-center"
            >
              <h2 className="text-2xl text-white mb-2" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                Career Summit
              </h2>
              <p className="text-white/80 text-sm" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                Tap to climb the mountain
              </p>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="mt-4 text-3xl"
              >
                ☝️
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Elevation Counter */}
        <div className="absolute bottom-8 left-6">
          <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
            <div className="text-white/60 text-xs">Elevation</div>
            <div className="text-white text-xl font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {elevation.toLocaleString()} ft
            </div>
          </div>
        </div>

        {/* Milestone Achievement */}
        <AnimatePresence>
          {showAchievement && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-1/3 left-1/2 -translate-x-1/2"
            >
              <div className="bg-white/95 backdrop-blur-md px-6 py-3 rounded-full border-2 border-green-400 shadow-lg">
                <p className="text-green-600 font-semibold">✨ {showAchievement}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Summit Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center z-50"
          >
            {/* Celebration particles */}
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10%',
                }}
                animate={{
                  y: ['0vh', '120vh'],
                  rotate: [0, Math.random() * 720 - 360],
                  opacity: [1, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 1,
                  delay: i * 0.03,
                  ease: 'easeIn',
                }}
              >
                {['⭐', '🏆', '💼', '📈', '✨', '🎯'][i % 6]}
              </motion.div>
            ))}

            {/* Success message */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="bg-white/95 backdrop-blur-md p-8 rounded-2xl border-4 border-yellow-400 text-center shadow-2xl"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Flag className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-4xl font-bold text-blue-600 mb-2">Summit Reached!</h2>
              <p className="text-blue-500 text-lg">Career milestone unlocked</p>
              <div className="mt-4 text-yellow-600 text-xl font-mono">
                {elevation.toLocaleString()} ft
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
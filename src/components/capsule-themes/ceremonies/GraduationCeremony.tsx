import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, CheckCircle2 } from 'lucide-react';

interface GraduationCeremonyProps {
  onComplete: () => void;
  isVisible: boolean;
}

type SystemStatus = 'checking' | 'ready';
type LaunchStage = 'idle' | 'ignition' | 'liftoff' | 'separation' | 'orbit' | 'deployed';

export function GraduationCeremony({ onComplete, isVisible }: GraduationCeremonyProps) {
  const [countdown, setCountdown] = useState<number>(5);
  const [isPressing, setIsPressing] = useState(false);
  const [launchStage, setLaunchStage] = useState<LaunchStage>('idle');
  const [systemStatus, setSystemStatus] = useState<Record<string, SystemStatus>>({
    fuel: 'checking',
    navigation: 'checking',
    thrusters: 'checking',
  });
  const [rocketPosition, setRocketPosition] = useState({ y: 0, scale: 1 });
  const [showFirstStage, setShowFirstStage] = useState(true);
  const [terminalMessages, setTerminalMessages] = useState<string[]>([]);
  const [hud, setHud] = useState({ fuel: 0, altitude: 0, gForce: 0 });
  const [buttonHeat, setButtonHeat] = useState(0); // 0-100
  const [showOrbitalRings, setShowOrbitalRings] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const shakeIntervalRef = useRef<number | null>(null);

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

  // Play sound
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

  const playBeep = () => playSound(800, 0.1, 'square', 0.2);
  const playRumble = () => playSound(60, 0.3, 'sawtooth', 0.3);
  const playExplosion = () => playSound(100, 0.4, 'sawtooth', 0.35);

  const vibrate = (pattern: number | number[]) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // Add terminal message
  const addTerminalMessage = (msg: string) => {
    setTerminalMessages(prev => [...prev.slice(-3), msg]); // Keep last 4 messages
    playBeep();
  };

  // Handle button click
  const handleButtonClick = () => {
    if (launchStage !== 'idle') return; // Can't click during launch
    
    if (countdown === 5) {
      // First click - start systems
      addTerminalMessage('> INITIATING SEQUENCE...');
      setSystemStatus({ fuel: 'ready', navigation: 'ready', thrusters: 'ready' });
      setHud({ fuel: 100, altitude: 0, gForce: 0 });
      addTerminalMessage('> ALL SYSTEMS GO');
    }
    
    const newCountdown = countdown - 1;
    setCountdown(newCountdown);
    
    // Update button heat based on clicks remaining
    setButtonHeat((5 - newCountdown) * 20); // 20%, 40%, 60%, 80%, 100%
    
    playBeep();
    vibrate(50 + (5 - newCountdown) * 15);
    
    if (newCountdown > 0) {
      playRumble();
      addTerminalMessage(`> T-${newCountdown}`);
    } else {
      // LIFTOFF!
      launchSequence();
    }
  };

  // Launch sequence
  const launchSequence = () => {
    setCountdown(0);
    addTerminalMessage('> IGNITION!');
    vibrate([100, 50, 100]);
    
    // Stage 1: Ignition and Liftoff (0-1s)
    setTimeout(() => {
      setLaunchStage('ignition');
      playExplosion();
      
      // Start screen shake
      shakeIntervalRef.current = window.setInterval(() => {
        vibrate(30);
      }, 200);
    }, 500);
    
    // Stage 2: Liftoff (1s)
    setTimeout(() => {
      setLaunchStage('liftoff');
      addTerminalMessage('> LIFTOFF CONFIRMED');
      animateRocket();
    }, 1000);
    
    // Stage 3: First stage separation (3s)
    setTimeout(() => {
      setLaunchStage('separation');
      setShowFirstStage(false);
      playExplosion();
      vibrate([50, 30, 50]);
      addTerminalMessage('> STAGE 1 SEPARATION');
      
      // Stop screen shake
      if (shakeIntervalRef.current) {
        clearInterval(shakeIntervalRef.current);
        shakeIntervalRef.current = null;
      }
    }, 3000);
    
    // Stage 4: Orbit achieved (5s)
    setTimeout(() => {
      setLaunchStage('orbit');
      addTerminalMessage('> ORBIT ACHIEVED');
      setShowOrbitalRings(true);
    }, 5000);
    
    // Stage 5: Deployment (6.5s)
    setTimeout(() => {
      setLaunchStage('deployed');
      addTerminalMessage('> CAPSULE DEPLOYED');
      vibrate([100, 50, 100, 50, 200]);
      
      // Complete ceremony
      setTimeout(() => {
        onComplete();
      }, 2500);
    }, 6500);
  };

  // Animate rocket movement
  const animateRocket = () => {
    const duration = 5000; // 5 seconds to orbit
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Exponential acceleration
      const yPos = -progress * 120; // Move up 120% of screen
      const scale = Math.max(0.1, 1 - progress * 0.9); // Shrink to 10%
      
      setRocketPosition({ y: yPos, scale });
      
      // Update HUD
      setHud({
        fuel: Math.max(0, 100 - progress * 100),
        altitude: Math.round(progress * 400), // 400km
        gForce: Math.round(1 + progress * 2.5), // 1G to 3.5G
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  };

  if (!isVisible) return null;

  const allSystemsReady = Object.values(systemStatus).every(s => s === 'ready');

  return (
    <div className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Stars background */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.3 + Math.random() * 0.7,
              animation: `twinkle ${2 + Math.random() * 3}s infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Mission Control HUD */}
      <AnimatePresence>
        {launchStage !== 'deployed' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-6 left-0 right-0 z-50 px-4"
          >
            <div className="max-w-2xl mx-auto space-y-3">
              {/* Title */}
              <div className="text-center">
                <h2 className="text-3xl font-black uppercase text-blue-400 tracking-tighter">
                  Launchpad
                </h2>
                <p className="text-blue-300/60 font-mono text-xs mt-1">
                  {launchStage === 'idle' ? 'CLICK TO BEGIN COUNTDOWN' : 'MISSION IN PROGRESS'}
                </p>
              </div>

              {/* System Status Indicators */}
              <div className="flex gap-3 justify-center">
                {Object.entries(systemStatus).map(([system, status]) => (
                  <motion.div
                    key={system}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 bg-slate-800/90 backdrop-blur-sm px-3 py-2 rounded border border-slate-700"
                  >
                    {status === 'ready' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin" />
                    )}
                    <span className="text-xs font-mono uppercase text-slate-300">
                      {system}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* HUD Meters */}
              {countdown !== null && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-3 gap-3"
                >
                  {/* Fuel */}
                  <div className="bg-slate-800/90 backdrop-blur-sm p-3 rounded border border-slate-700">
                    <div className="text-xs font-mono text-slate-400 mb-1">FUEL</div>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black text-green-400 font-mono">{hud.fuel}</span>
                      <span className="text-xs text-slate-500 mb-1">%</span>
                    </div>
                  </div>

                  {/* Altitude */}
                  <div className="bg-slate-800/90 backdrop-blur-sm p-3 rounded border border-slate-700">
                    <div className="text-xs font-mono text-slate-400 mb-1">ALTITUDE</div>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black text-blue-400 font-mono">{hud.altitude}</span>
                      <span className="text-xs text-slate-500 mb-1">km</span>
                    </div>
                  </div>

                  {/* G-Force */}
                  <div className="bg-slate-800/90 backdrop-blur-sm p-3 rounded border border-slate-700">
                    <div className="text-xs font-mono text-slate-400 mb-1">G-FORCE</div>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black text-orange-400 font-mono">{hud.gForce}</span>
                      <span className="text-xs text-slate-500 mb-1">G</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Terminal Messages */}
              {terminalMessages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-black/80 backdrop-blur-sm p-3 rounded border border-green-900/50 font-mono text-xs"
                >
                  {terminalMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-green-400"
                    >
                      {msg}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launch Pad and Rocket */}
      <div className="relative flex items-center justify-center flex-1 w-full">
        {/* Launch Pad Structure */}
        {launchStage === 'idle' || launchStage === 'ignition' ? (
          <div className="absolute bottom-20 flex flex-col items-center">
            {/* Clamps */}
            <div className="flex gap-16 mb-2">
              <div className="w-3 h-16 bg-gradient-to-b from-slate-600 to-slate-700 rounded" />
              <div className="w-3 h-16 bg-gradient-to-b from-slate-600 to-slate-700 rounded" />
            </div>

            {/* Platform */}
            <div className="w-32 h-4 bg-gradient-to-b from-slate-700 to-slate-800 rounded-t border-t-2 border-slate-600" />
            <div className="w-40 h-8 bg-gradient-to-b from-slate-800 to-slate-900 rounded-b" />
          </div>
        ) : null}

        {/* Rocket */}
        <AnimatePresence>
          {launchStage !== 'deployed' && (
            <motion.div
              className="absolute pointer-events-none"
              style={{
                bottom: '30%',
              }}
              animate={{
                y: `${rocketPosition.y}vh`,
                scale: rocketPosition.scale,
              }}
              transition={{ type: 'linear', duration: 0.05 }}
            >
              {/* Rocket body */}
              <div className="relative flex flex-col items-center">
                {/* Nose cone */}
                <div
                  className="w-16 h-20 bg-gradient-to-b from-red-500 to-red-600"
                  style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
                />

                {/* Upper stage */}
                <div className="w-16 h-24 bg-gradient-to-b from-slate-300 to-slate-400 relative">
                  {/* Window */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue-900 rounded-full border-2 border-slate-500" />
                  {/* Stripes */}
                  <div className="absolute top-14 left-0 right-0 h-2 bg-red-600" />
                </div>

                {/* First stage (separates) */}
                <AnimatePresence>
                  {showFirstStage && (
                    <motion.div
                      exit={{
                        y: 50,
                        opacity: 0,
                        rotate: Math.random() > 0.5 ? 45 : -45,
                      }}
                      transition={{ duration: 1 }}
                      className="w-16 h-32 bg-gradient-to-b from-slate-400 to-slate-500"
                    >
                      {/* Fuel tanks detail */}
                      <div className="h-full flex gap-1 p-1">
                        <div className="flex-1 bg-slate-600 rounded-full" />
                        <div className="flex-1 bg-slate-600 rounded-full" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Fins */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between">
                  <div
                    className="w-8 h-16 bg-gradient-to-br from-slate-400 to-slate-600 -translate-x-6"
                    style={{ clipPath: 'polygon(100% 0%, 100% 100%, 0% 100%)' }}
                  />
                  <div
                    className="w-8 h-16 bg-gradient-to-bl from-slate-400 to-slate-600 translate-x-6"
                    style={{ clipPath: 'polygon(0% 0%, 100% 100%, 0% 100%)' }}
                  />
                </div>

                {/* Exhaust flames */}
                {(launchStage === 'ignition' || launchStage === 'liftoff' || launchStage === 'separation') && (
                  <>
                    {/* Main flame */}
                    <motion.div
                      className="absolute top-full left-1/2 -translate-x-1/2"
                      animate={{
                        scaleY: [1, 1.3, 1, 1.4, 1],
                        opacity: [0.9, 1, 0.9, 1, 0.9],
                      }}
                      transition={{
                        duration: 0.15,
                        repeat: Infinity,
                      }}
                    >
                      <div
                        className="w-20 h-32 bg-gradient-to-b from-white via-orange-500 to-red-600"
                        style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', filter: 'blur(3px)' }}
                      />
                    </motion.div>

                    {/* Inner bright core */}
                    <motion.div
                      className="absolute top-full left-1/2 -translate-x-1/2"
                      animate={{
                        scaleY: [1, 1.2, 1],
                        opacity: [1, 0.8, 1],
                      }}
                      transition={{
                        duration: 0.1,
                        repeat: Infinity,
                      }}
                    >
                      <div
                        className="w-12 h-24 bg-gradient-to-b from-yellow-100 via-yellow-400 to-orange-500"
                        style={{ clipPath: 'polygon(50% 0%, 20% 100%, 80% 100%)' }}
                      />
                    </motion.div>

                    {/* Smoke particles */}
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute top-full"
                        initial={{ y: 0, x: -8 + i * 2, opacity: 0.6, scale: 0.5 }}
                        animate={{
                          y: [0, 40, 80],
                          x: -8 + i * 2 + (Math.random() - 0.5) * 20,
                          opacity: [0.6, 0.3, 0],
                          scale: [0.5, 1, 1.5],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      >
                        <div className="w-4 h-4 bg-gray-500/50 rounded-full blur-sm" />
                      </motion.div>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ignition Button */}
      <div className="absolute bottom-16 z-40">
        <motion.button
          className="relative w-48 h-48 rounded-full flex items-center justify-center group touch-none select-none"
          style={{
            background: buttonHeat > 66 
              ? 'radial-gradient(circle at 30% 30%, #ef4444, #dc2626, #991b1b)'
              : buttonHeat > 33 
              ? 'radial-gradient(circle at 30% 30%, #f97316, #ea580c, #c2410c)'
              : 'radial-gradient(circle at 30% 30%, #3b82f6, #2563eb, #1e40af)',
            boxShadow: buttonHeat > 66
              ? '0 0 60px rgba(239, 68, 68, 0.8), 0 0 100px rgba(239, 68, 68, 0.4), inset 0 0 30px rgba(255, 255, 255, 0.2)'
              : buttonHeat > 33
              ? '0 0 60px rgba(249, 115, 22, 0.8), 0 0 100px rgba(249, 115, 22, 0.4), inset 0 0 30px rgba(255, 255, 255, 0.2)'
              : '0 0 60px rgba(59, 130, 246, 0.6), 0 0 100px rgba(59, 130, 246, 0.3), inset 0 0 30px rgba(255, 255, 255, 0.15)',
          }}
          onMouseDown={() => setIsPressing(true)}
          onMouseUp={() => setIsPressing(false)}
          onMouseLeave={() => setIsPressing(false)}
          onTouchStart={() => setIsPressing(true)}
          onTouchEnd={() => setIsPressing(false)}
          whileTap={{ scale: 0.95 }}
          onClick={handleButtonClick}
        >
          {/* Metallic border rim with segments */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            {/* Outer metallic ring */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, #94a3b8, #cbd5e1, #94a3b8, #64748b, #94a3b8, #cbd5e1, #94a3b8)',
                padding: '8px',
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: buttonHeat > 66 
                    ? 'radial-gradient(circle at 30% 30%, #ef4444, #dc2626, #991b1b)'
                    : buttonHeat > 33 
                    ? 'radial-gradient(circle at 30% 30%, #f97316, #ea580c, #c2410c)'
                    : 'radial-gradient(circle at 30% 30%, #3b82f6, #2563eb, #1e40af)',
                }}
              />
            </div>
            
            {/* Segment notches */}
            {[...Array(16)].map((_, i) => (
              <div
                key={i}
                className="absolute top-0 left-1/2 w-0.5 h-3 bg-slate-800 origin-top"
                style={{
                  transform: `rotate(${i * 22.5}deg) translateX(-50%)`,
                }}
              />
            ))}
          </div>

          {/* Glowing core pulse */}
          <motion.div
            className="absolute inset-4 rounded-full"
            style={{
              background: buttonHeat > 66
                ? 'radial-gradient(circle, rgba(254, 202, 202, 0.6), transparent)'
                : buttonHeat > 33
                ? 'radial-gradient(circle, rgba(254, 215, 170, 0.6), transparent)'
                : 'radial-gradient(circle, rgba(191, 219, 254, 0.5), transparent)',
            }}
            animate={{
              scale: isPressing ? [1, 1.3, 1] : [1, 1.15, 1],
              opacity: isPressing ? [0.6, 1, 0.6] : [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: isPressing ? 0.6 : 2,
              repeat: Infinity,
            }}
          />

          {/* Pulsing energy rings - enhanced */}
          {isPressing && (
            <>
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: `4px solid ${
                      buttonHeat > 66 ? '#ef4444' : buttonHeat > 33 ? '#f97316' : '#3b82f6'
                    }`,
                  }}
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.25,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </>
          )}

          {/* Electric sparks when heating up */}
          {isPressing && buttonHeat > 50 && (
            <>
              {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                return (
                  <motion.div
                    key={`spark-${i}`}
                    className="absolute w-1 h-4 bg-yellow-300 rounded-full"
                    style={{
                      left: `${50 + Math.cos(angle) * 45}%`,
                      top: `${50 + Math.sin(angle) * 45}%`,
                      transformOrigin: 'center',
                      rotate: `${angle * (180 / Math.PI)}deg`,
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scaleY: [0, 1, 0],
                    }}
                    transition={{
                      duration: 0.4,
                      repeat: Infinity,
                      delay: i * 0.1,
                      repeatDelay: 0.3,
                    }}
                  />
                );
              })}
            </>
          )}

          {/* Countdown or Icon */}
          <AnimatePresence mode="wait">
            {countdown > 0 && countdown < 5 ? (
              <motion.div
                key={countdown}
                initial={{ scale: 2, opacity: 0, rotate: -180 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0, rotate: 180 }}
                className="text-7xl font-black text-white z-10"
                style={{
                  textShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px currentColor',
                  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))',
                }}
              >
                {countdown}
              </motion.div>
            ) : countdown === 0 ? (
              <motion.div
                key="go"
                initial={{ scale: 2, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: 1,
                }}
                exit={{ scale: 3, opacity: 0 }}
                transition={{
                  scale: { duration: 0.5, repeat: Infinity },
                }}
                className="text-6xl font-black text-green-400 z-10"
                style={{
                  textShadow: '0 0 30px rgba(74, 222, 128, 1), 0 0 60px rgba(74, 222, 128, 0.8)',
                  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))',
                }}
              >
                GO!
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Progress ring - enhanced */}
          <svg className="absolute inset-[-12px] w-[calc(100%+24px)] h-[calc(100%+24px)] -rotate-90 pointer-events-none">
            {/* Background track */}
            <circle
              cx="50%"
              cy="50%"
              r="48%"
              fill="none"
              stroke="rgba(100, 116, 139, 0.3)"
              strokeWidth="6"
            />
            {/* Progress */}
            <circle
              cx="50%"
              cy="50%"
              r="48%"
              fill="none"
              stroke={buttonHeat > 66 ? '#ef4444' : buttonHeat > 33 ? '#f97316' : '#3b82f6'}
              strokeWidth="6"
              strokeDasharray="300"
              strokeDashoffset={countdown !== null ? 300 - (300 * ((4 - (countdown || 3)) / 3)) : 300}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
              style={{
                filter: `drop-shadow(0 0 ${buttonHeat > 50 ? '10px' : '6px'} currentColor)`,
              }}
            />
            
            {/* Glowing dots on progress ring */}
            {countdown !== null && countdown < 3 && (
              <circle
                cx="50%"
                cy="2%"
                r="4"
                fill={buttonHeat > 66 ? '#fca5a5' : buttonHeat > 33 ? '#fdba74' : '#93c5fd'}
                style={{
                  filter: 'drop-shadow(0 0 8px currentColor)',
                }}
              />
            )}
          </svg>

          {/* Heat shimmer effect */}
          {buttonHeat > 70 && (
            <motion.div
              className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
              }}
              animate={{
                y: ['-100%', '100%'],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}

          {/* Steam/smoke around button edges - enhanced */}
          {isPressing && buttonHeat > 30 && (
            <>
              {Array.from({ length: 16 }).map((_, i) => {
                const angle = (i / 16) * Math.PI * 2;
                return (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${50 + Math.cos(angle) * 55}%`,
                      top: `${50 + Math.sin(angle) * 55}%`,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 0.6, 0],
                      scale: [0, 1.5, 2.5],
                      x: Math.cos(angle) * 30,
                      y: Math.sin(angle) * 30,
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.08,
                      ease: 'easeOut',
                    }}
                  >
                    <div 
                      className="w-4 h-4 rounded-full blur-md"
                      style={{
                        background: buttonHeat > 66 
                          ? 'radial-gradient(circle, rgba(239, 68, 68, 0.8), transparent)'
                          : buttonHeat > 33
                          ? 'radial-gradient(circle, rgba(249, 115, 22, 0.8), transparent)'
                          : 'radial-gradient(circle, rgba(59, 130, 246, 0.6), transparent)',
                      }}
                    />
                  </motion.div>
                );
              })}
            </>
          )}
        </motion.button>
      </div>

      {/* Orbital Achievement */}
      <AnimatePresence>
        {launchStage === 'orbit' || launchStage === 'deployed' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center z-50 bg-gradient-to-b from-black via-blue-950/50 to-black"
          >
            {/* Earth */}
            <motion.div
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="absolute bottom-[-20%] w-[600px] h-[600px]"
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #4a9eff, #1e3a8a 40%, #0a1929 80%)',
                  boxShadow: '0 0 100px 20px rgba(74, 158, 255, 0.3), inset -50px -50px 100px rgba(0,0,0,0.5)',
                }}
              >
                {/* Continents (simplified) */}
                <div className="absolute top-[30%] left-[20%] w-24 h-16 bg-green-800/60 rounded-full blur-sm" />
                <div className="absolute top-[45%] right-[25%] w-32 h-20 bg-green-700/60 rounded-full blur-sm" />
                <div className="absolute bottom-[20%] left-[35%] w-28 h-18 bg-green-900/60 rounded-full blur-sm" />
              </div>
            </motion.div>

            {/* Orbiting satellite/capsule */}
            <motion.div
              initial={{ scale: 0, rotate: 0 }}
              animate={{
                scale: 1,
                rotate: 360,
              }}
              transition={{
                scale: { delay: 0.8, type: 'spring' },
                rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
              }}
              className="absolute"
              style={{
                top: '40%',
                left: '50%',
              }}
            >
              <div
                className="w-12 h-12 bg-gradient-to-br from-slate-300 to-slate-500 rounded"
                style={{
                  transform: 'translateX(-50%) translateY(-200px)',
                  boxShadow: '0 0 20px rgba(255,255,255,0.5)',
                }}
              >
                {/* Solar panels */}
                <div className="absolute top-1/2 -translate-y-1/2 -left-8 w-6 h-16 bg-blue-900 border-2 border-yellow-500" />
                <div className="absolute top-1/2 -translate-y-1/2 -right-8 w-6 h-16 bg-blue-900 border-2 border-yellow-500" />
              </div>
            </motion.div>

            {/* Orbital rings */}
            {showOrbitalRings && (
              <>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full border-2 border-blue-400/30"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 3 + i, opacity: 0.2 - i * 0.06 }}
                    transition={{
                      duration: 2,
                      delay: i * 0.3,
                    }}
                    style={{
                      width: '200px',
                      height: '200px',
                      top: '40%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                ))}
              </>
            )}

            {/* Success text */}
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="absolute top-[20%] text-center"
            >
              <motion.h2
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-4"
                style={{ textShadow: '0 0 40px rgba(147, 197, 253, 0.5)' }}
              >
                ORBIT ACHIEVED
              </motion.h2>
              <p className="text-2xl text-blue-300">
                Next Chapter Deployed
              </p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="mt-4 text-blue-400/60 font-mono text-sm"
              >
                ALT: {hud.altitude} km • VEL: 7.8 km/s
              </motion.div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Themed confetti */}
      <AnimatePresence>
        {launchStage === 'deployed' && (
          <>
            {Array.from({ length: 30 }).map((_, i) => {
              const emoji = ['🚀', '🛰️', '⭐', '✨', '💫'][i % 5];
              return (
                <motion.div
                  key={i}
                  className="absolute text-3xl pointer-events-none"
                  initial={{ y: '-10%', x: `${Math.random() * 100}%`, opacity: 1, rotate: 0 }}
                  animate={{
                    y: '110%',
                    rotate: Math.random() * 720 - 360,
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    delay: Math.random() * 1,
                    ease: 'linear',
                  }}
                >
                  {emoji}
                </motion.div>
              );
            })}

            {/* Golden rocket trails */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={`trail-${i}`}
                className="absolute w-1 h-12 pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, #ffd700, transparent)',
                  left: `${Math.random() * 100}%`,
                }}
                initial={{ y: '-10%', opacity: 0.8 }}
                animate={{
                  y: '110%',
                  opacity: [0.8, 0.4, 0],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: Math.random() * 1.5,
                  ease: 'linear',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* CSS for star twinkle */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
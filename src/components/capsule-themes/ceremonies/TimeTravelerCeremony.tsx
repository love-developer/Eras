import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fingerprint, ScanLine, Zap, Eye } from 'lucide-react';

interface TimeTravelerCeremonyProps {
  onComplete: () => void;
  isVisible: boolean;
}

export function TimeTravelerCeremony({ onComplete, isVisible }: TimeTravelerCeremonyProps) {
  const [progress, setProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [showHologram, setShowHologram] = useState(false);
  const [decryptionPhase, setDecryptionPhase] = useState<'idle' | 'scanning' | 'decrypting' | 'complete'>('idle');
  const intervalRef = useRef<number | null>(null);

  const startScan = useCallback(() => {
    if (scanComplete) return;
    setIsScanning(true);
    setDecryptionPhase('scanning');
    setShowHologram(true);
    
    // Haptic feedback start
    if (navigator.vibrate) navigator.vibrate(50);

    // Clear any existing interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2; // Speed of scan (faster now)
        if (next >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          
          // Start decryption phase
          setDecryptionPhase('decrypting');
          
          setTimeout(() => {
            setScanComplete(true);
            setDecryptionPhase('complete');
            
            // Success haptic
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            
            setTimeout(() => {
              onComplete();
            }, 1500);
          }, 1000);
          
          return 100;
        }
        // Continuous light haptic feedback during scan (if supported)
        if (navigator.vibrate && Math.random() > 0.7) navigator.vibrate(5);
        return next;
      });
    }, 20); // 50 updates per second
  }, [scanComplete, onComplete]);

  const stopScan = useCallback(() => {
    if (scanComplete) return;
    setIsScanning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Rapidly decrease progress instead of instant reset
    const decayInterval = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev - 5;
        if (next <= 0) {
          clearInterval(decayInterval);
          return 0;
        }
        return next;
      });
    }, 10);
  }, [scanComplete]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="relative flex flex-col items-center justify-center gap-8 z-50 select-none">
      {/* Scanner Container */}
      <motion.div
        className="relative w-48 h-48 cursor-pointer"
        onMouseDown={startScan}
        onMouseUp={stopScan}
        onMouseLeave={stopScan}
        onTouchStart={startScan}
        onTouchEnd={stopScan}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Background Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
        
        {/* Progress Ring (SVG) */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
          <circle
            cx="96"
            cy="96"
            r="90"
            fill="none"
            stroke={isScanning ? "#22d3ee" : "#0891b2"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="565.48" // 2 * PI * 90
            strokeDashoffset={565.48 * (1 - progress / 100)}
            className="transition-all duration-75"
          />
        </svg>

        {/* Inner Circle / Button */}
        <div 
          className={`absolute inset-4 rounded-full flex items-center justify-center transition-all duration-300 ${
            isScanning ? 'bg-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.4)]' : 'bg-black/40 backdrop-blur-sm'
          }`}
        >
          <Fingerprint 
            className={`w-20 h-20 transition-all duration-300 ${
              isScanning ? 'text-cyan-400 scale-110' : 'text-cyan-700'
            }`} 
          />
          
          {/* Scanning Beam */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                className="absolute w-full h-2 bg-cyan-400/50 blur-sm"
                initial={{ top: "10%" }}
                animate={{ top: ["10%", "90%", "10%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Pulse Effect when idle */}
        {!isScanning && !scanComplete && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-cyan-500/30"
            animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Instructions / Status */}
      <div className="text-center space-y-2">
        <motion.h3 
          className="text-2xl font-bold text-white font-mono tracking-wider"
          animate={{ opacity: isScanning ? [1, 0.5, 1] : 1 }}
          transition={{ duration: 0.5, repeat: isScanning ? Infinity : 0 }}
        >
          {scanComplete ? "ACCESS GRANTED" : isScanning ? "IDENTIFYING..." : "BIOMETRIC SCAN"}
        </motion.h3>
        
        <p className="text-cyan-200/60 font-mono text-sm">
          {scanComplete 
            ? "Identity Verified" 
            : "Hold to verify temporal identity"}
        </p>

        {/* Tech Decor */}
        <div className="flex justify-center gap-1 mt-4">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className={`w-2 h-2 rounded-full ${progress > i * 20 ? 'bg-cyan-400' : 'bg-cyan-900'}`}
              animate={isScanning ? { opacity: [0.3, 1, 0.3] } : {}}
              transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
            />
          ))}
        </div>
      </div>

      {/* HOLOGRAPHIC OVERLAY */}
      <AnimatePresence>
        {showHologram && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none overflow-hidden"
          >
            {/* Scanning Grid */}
            <motion.div
              className="absolute inset-0"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%']
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{
                backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            />

            {/* Matrix Code Rain */}
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={`matrix-${i}`}
                className="absolute top-0 font-mono text-xs text-cyan-400/40"
                style={{
                  left: `${(i * 7)}%`,
                }}
                initial={{ y: -100 }}
                animate={{ y: ['-100%', '100%'] }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'linear'
                }}
              >
                {Array.from({ length: 20 }).map((_, j) => (
                  <div key={j}>
                    {Math.random() > 0.5 ? '1' : '0'}
                  </div>
                ))}
              </motion.div>
            ))}

            {/* Hologram Glitch Effect */}
            <motion.div
              className="absolute inset-0 bg-cyan-500/10"
              animate={{
                opacity: [0, 0.3, 0],
                x: [0, 2, -2, 0]
              }}
              transition={{
                duration: 0.1,
                repeat: Infinity,
                repeatDelay: 2 + Math.random() * 3
              }}
            />

            {/* Scan Lines */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34, 211, 238, 0.03) 2px, rgba(34, 211, 238, 0.03) 4px)'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* DECRYPTION PHASE */}
      <AnimatePresence>
        {decryptionPhase === 'decrypting' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="text-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Zap className="w-16 h-16 text-cyan-400 mx-auto" />
              </motion.div>
              <div className="px-6 py-3 rounded-lg bg-cyan-950/80 backdrop-blur-md border border-cyan-500/30">
                <p className="text-cyan-300 font-mono text-lg font-bold">
                  DECRYPTING TEMPORAL LOCK...
                </p>
                <div className="flex gap-1 mt-2 justify-center">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-4 bg-cyan-400"
                      animate={{ scaleY: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.5, delay: i * 0.05, repeat: Infinity }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUCCESS STATE */}
      <AnimatePresence>
        {decryptionPhase === 'complete' && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-center"
            >
              <Eye className="w-24 h-24 text-green-400 mx-auto mb-4" />
              <div className="px-8 py-4 rounded-lg bg-green-950/80 backdrop-blur-md border-2 border-green-500/50">
                <p className="text-green-400 font-mono text-2xl font-bold">
                  ✓ IDENTITY CONFIRMED
                </p>
                <p className="text-green-300/60 font-mono text-sm mt-2">
                  Welcome back, Time Traveler
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
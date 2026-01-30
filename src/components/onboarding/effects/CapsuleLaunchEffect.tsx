import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface CapsuleLaunchEffectProps {
  onComplete: () => void;
  capsuleMessage?: string;
  deliveryDate?: Date;
}

export function CapsuleLaunchEffect({ onComplete, capsuleMessage, deliveryDate }: CapsuleLaunchEffectProps) {
  const [phase, setPhase] = useState<'ready' | 'countdown' | 'ignition' | 'launch' | 'portal' | 'complete'>('ready');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const sequence = async () => {
      // Phase 1: Ready (1s)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Phase 2: Countdown (3s)
      setPhase('countdown');
      for (let i = 3; i > 0; i--) {
        setCountdown(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Phase 3: Ignition (0.5s)
      setPhase('ignition');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Phase 4: Launch (2s)
      setPhase('launch');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Phase 5: Portal entry (1.5s)
      setPhase('portal');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Phase 6: Complete (1s)
      setPhase('complete');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Callback
      onComplete();
    };

    sequence();
  }, [onComplete]);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
      {/* Time portal at top */}
      {(phase === 'launch' || phase === 'portal') && (
        <motion.div
          className="absolute top-20 left-1/2 -translate-x-1/2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: phase === 'portal' ? 1.5 : 1, 
            opacity: phase === 'portal' ? 1 : 0.7 
          }}
          transition={{ duration: 0.5 }}
        >
          {/* Portal rings */}
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{
                width: `${100 + i * 40}px`,
                height: `${100 + i * 40}px`,
                borderColor: `rgba(168, 85, 247, ${0.8 - i * 0.15})`
              }}
              animate={{
                rotate: [0, i % 2 === 0 ? 360 : -360],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 3 - i * 0.3,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          ))}
          
          {/* Portal center glow */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.8), rgba(168, 85, 247, 0.3), transparent)'
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />

          {/* Swirl particles */}
          {Array.from({ length: 30 }).map((_, i) => {
            const angle = (i / 30) * Math.PI * 2;
            const radius = 60 + (i % 3) * 20;
            return (
              <motion.div
                key={`swirl-${i}`}
                className="absolute w-2 h-2 rounded-full bg-purple-400"
                style={{
                  left: '50%',
                  top: '50%'
                }}
                animate={{
                  x: [
                    Math.cos(angle) * radius,
                    Math.cos(angle + Math.PI * 2) * radius
                  ],
                  y: [
                    Math.sin(angle) * radius,
                    Math.sin(angle + Math.PI * 2) * radius
                  ],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.05,
                  ease: 'linear'
                }}
              />
            );
          })}
        </motion.div>
      )}

      {/* Capsule */}
      <motion.div
        className="relative z-10"
        initial={{ y: 0, scale: 1 }}
        animate={{
          y: phase === 'ready' ? 0 
             : phase === 'countdown' ? [0, -10, 0]
             : phase === 'ignition' ? [0, -5, 5, -5, 0]
             : phase === 'launch' ? -600
             : phase === 'portal' ? -800
             : -1000,
          scale: phase === 'countdown' ? [1, 1.05, 1]
                 : phase === 'ignition' ? [1, 1.1, 1.05]
                 : phase === 'launch' ? [1.05, 0.8]
                 : phase === 'portal' ? [0.8, 0.3]
                 : 0.1,
          opacity: phase === 'complete' ? 0 : 1,
          rotate: phase === 'portal' ? [0, 720] : 0
        }}
        transition={{
          duration: phase === 'countdown' ? 1
                   : phase === 'ignition' ? 0.3
                   : phase === 'launch' ? 2
                   : phase === 'portal' ? 1.5
                   : 0.5,
          repeat: phase === 'countdown' ? Infinity : 0,
          ease: phase === 'launch' ? 'easeIn' 
                : phase === 'portal' ? 'easeOut'
                : 'easeInOut'
        }}
      >
        {/* Capsule body */}
        <div className="relative w-32 h-40 bg-gradient-to-br from-purple-400 via-pink-400 to-purple-500 rounded-3xl shadow-2xl flex items-center justify-center">
          {/* Capsule glow */}
          <motion.div
            className="absolute inset-0 rounded-3xl"
            style={{
              boxShadow: '0 0 40px rgba(168, 85, 247, 0.8), 0 0 80px rgba(168, 85, 247, 0.4)'
            }}
            animate={{
              boxShadow: [
                '0 0 40px rgba(168, 85, 247, 0.8)',
                '0 0 60px rgba(168, 85, 247, 1)',
                '0 0 40px rgba(168, 85, 247, 0.8)'
              ]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          
          {/* Message icon */}
          <span className="text-5xl relative z-10">💌</span>
          
          {/* Energy rings around capsule */}
          {phase === 'ignition' && (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-3xl border-2 border-purple-300"
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{
                    scale: [1, 1.5, 2],
                    opacity: [1, 0.5, 0]
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeOut'
                  }}
                />
              ))}
            </>
          )}
        </div>
      </motion.div>

      {/* Countdown numbers */}
      {phase === 'countdown' && (
        <motion.div
          className="absolute text-9xl font-bold text-white"
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: [0, 1, 0] }}
          transition={{ duration: 0.8 }}
          key={countdown}
        >
          {countdown}
        </motion.div>
      )}

      {/* Ignition text */}
      {phase === 'ignition' && (
        <motion.div
          className="absolute text-4xl font-bold text-purple-300"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1.5, opacity: [0, 1, 0] }}
          transition={{ duration: 0.5 }}
        >
          IGNITION!
        </motion.div>
      )}

      {/* Launch particles */}
      {(phase === 'ignition' || phase === 'launch' || phase === 'portal') && (
        <div className="absolute inset-0">
          {/* Bottom rocket flames */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={`flame-${i}`}
              className="absolute left-1/2 rounded-full"
              style={{
                width: `${4 + Math.random() * 8}px`,
                height: `${4 + Math.random() * 8}px`,
                background: i % 3 === 0 
                  ? 'rgba(249, 115, 22, 0.8)' 
                  : i % 3 === 1
                  ? 'rgba(251, 191, 36, 0.8)'
                  : 'rgba(239, 68, 68, 0.8)',
                top: '50%',
                marginTop: '80px'
              }}
              animate={{
                y: [0, 100 + Math.random() * 100],
                x: [(Math.random() - 0.5) * 40],
                opacity: [1, 0.6, 0],
                scale: [1, 1.5, 0.5]
              }}
              transition={{
                duration: 0.5 + Math.random() * 0.5,
                repeat: Infinity,
                delay: Math.random() * 0.3,
                ease: 'easeOut'
              }}
            />
          ))}

          {/* Trail particles */}
          {phase === 'launch' && Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={`trail-${i}`}
              className="absolute left-1/2 w-3 h-3 rounded-full bg-purple-400"
              style={{
                top: '50%'
              }}
              animate={{
                y: [0, 100 + i * 20],
                x: [(Math.random() - 0.5) * 30],
                opacity: [1, 0.5, 0],
                scale: [1, 0.5]
              }}
              transition={{
                duration: 1,
                delay: i * 0.05,
                ease: 'easeOut'
              }}
            />
          ))}
        </div>
      )}

      {/* Success message */}
      {phase === 'complete' && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <motion.div
            className="text-6xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{
              duration: 0.5
            }}
          >
            🚀
          </motion.div>
          
          <motion.h2
            className="text-3xl font-bold text-white"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Capsule Launched!
          </motion.h2>
          
          {deliveryDate && (
            <motion.p
              className="text-lg text-white/70"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Arriving on {deliveryDate.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </motion.p>
          )}

          {/* Confetti */}
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={`confetti-${i}`}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: '50%',
                top: '40%',
                background: ['#a855f7', '#ec4899', '#8b5cf6', '#f472b6'][i % 4]
              }}
              initial={{ scale: 0 }}
              animate={{
                y: [0, 200 + Math.random() * 200],
                x: [(Math.random() - 0.5) * 400],
                rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                opacity: [1, 0.8, 0],
                scale: [0, 1, 0.5]
              }}
              transition={{
                duration: 2 + Math.random(),
                delay: Math.random() * 0.3,
                ease: 'easeOut'
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Screen flash on ignition */}
      {phase === 'ignition' && (
        <motion.div
          className="absolute inset-0 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Screen flash on portal entry */}
      {phase === 'portal' && (
        <motion.div
          className="absolute inset-0 bg-purple-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.7, 0] }}
          transition={{ duration: 0.5, delay: 1 }}
        />
      )}
    </div>
  );
}

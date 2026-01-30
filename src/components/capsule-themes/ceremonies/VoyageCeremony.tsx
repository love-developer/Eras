import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Check, Plane, MapPin } from 'lucide-react';

interface VoyageCeremonyProps {
  onComplete: () => void;
  isVisible: boolean;
}

type Phase = 'scanning' | 'approved' | 'gates-opening' | 'boarding';

export function VoyageCeremony({ onComplete, isVisible }: VoyageCeremonyProps) {
  const [phase, setPhase] = useState<Phase>('scanning');
  const [hasInteracted, setHasInteracted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoProgressTimerRef = useRef<NodeJS.Timeout>();
  
  // Auto-progress for non-touchscreen users
  useEffect(() => {
    if (!hasInteracted && isVisible) {
      autoProgressTimerRef.current = setTimeout(() => {
        console.log('🎫 Auto-progressing Boarding Pass ceremony (no interaction detected)');
        handleScan();
      }, 2500);
      
      return () => {
        if (autoProgressTimerRef.current) {
          clearTimeout(autoProgressTimerRef.current);
        }
      };
    }
  }, [hasInteracted, isVisible]);
  
  // Celebration confetti
  const fireConfetti = () => {
    const duration = 2500;
    const end = Date.now() + duration;

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '100';
    
    if (containerRef.current) {
      containerRef.current.appendChild(canvas);
      
      const myConfetti = confetti.create(canvas, {
        resize: true,
        useWorker: true
      });

      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval);
          return;
        }

        myConfetti({
          particleCount: 3,
          spread: 100,
          origin: { x: 0.5, y: 0.4 },
          colors: ['#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE', '#F97316'],
          scalar: 1.3,
          gravity: 0.4,
          ticks: 180
        });
      }, 100);
      
      setTimeout(() => {
        clearInterval(interval);
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      }, duration + 500);
    }
  };

  const handleScan = () => {
    if (phase !== 'scanning') return;
    
    setHasInteracted(true);
    
    if (autoProgressTimerRef.current) {
      clearTimeout(autoProgressTimerRef.current);
    }
    
    setTimeout(() => {
      setPhase('approved');
      
      setTimeout(() => {
        setPhase('gates-opening');
        
        setTimeout(() => {
          setPhase('boarding');
          fireConfetti();
          
          setTimeout(() => {
            onComplete();
          }, 2500);
        }, 1500);
      }, 1200);
    }, 800);
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '20px',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)',
      }}
    >
      {/* Phase 1: Scanning Boarding Pass */}
      {phase === 'scanning' && (
        <div
          style={{
            position: 'relative',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: '380px'
          }}
          onClick={handleScan}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleScan();
            }
          }}
          tabIndex={0}
          aria-label="Click to scan boarding pass"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            {/* Instruction text */}
            <div style={{ textAlign: 'center', marginBottom: '28px', width: '100%' }}>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              >
                <motion.h2 
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: 'white',
                    marginBottom: '12px',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em'
                  }}
                >
                  Boarding Pass Ready
                </motion.h2>
                <p style={{ 
                  color: '#DBEAFE', 
                  fontWeight: 500, 
                  fontSize: '15px', 
                  marginBottom: '6px',
                  lineHeight: 1.4
                }}>
                  Your journey awaits validation
                </p>
                <p style={{ 
                  fontSize: '13px', 
                  color: 'rgba(219, 234, 254, 0.7)',
                  lineHeight: 1.4
                }}>
                  Click to scan and board
                </p>
              </motion.div>
            </div>

            {/* Boarding Pass - SIMPLIFIED FOR MOBILE */}
            <motion.div
              animate={{ 
                rotateY: [0, -2, 0],
                rotateX: [0, 2, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 4,
                ease: 'easeInOut'
              }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '320px',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.4), 0 10px 10px -5px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                transformStyle: 'preserve-3d',
                perspective: '1000px'
              }}
            >
              {/* Header */}
              <div style={{
                background: 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plane style={{ width: '18px', height: '18px', color: 'white' }} />
                  <span style={{ 
                    fontWeight: 700, 
                    fontSize: '15px',
                    color: 'white',
                    letterSpacing: '0.05em'
                  }}>
                    ERAS AIRWAYS
                  </span>
                </div>
                <span style={{
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  background: 'rgba(255,255,255,0.25)',
                  padding: '3px 7px',
                  borderRadius: '4px',
                  color: 'white',
                  fontWeight: 600
                }}>
                  ECON
                </span>
              </div>

              {/* Body */}
              <div style={{ padding: '18px 16px', background: 'white' }}>
                {/* Passenger & Flight */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                  gap: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '9px', 
                      color: '#9CA3AF', 
                      textTransform: 'uppercase',
                      marginBottom: '5px',
                      fontWeight: 600,
                      letterSpacing: '0.05em'
                    }}>
                      Passenger
                    </div>
                    <div style={{ 
                      fontWeight: 700, 
                      color: '#111827', 
                      fontSize: '14px',
                      lineHeight: 1.2
                    }}>
                      Time Traveler
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '9px', 
                      color: '#9CA3AF', 
                      textTransform: 'uppercase',
                      marginBottom: '5px',
                      fontWeight: 600,
                      letterSpacing: '0.05em'
                    }}>
                      Flight
                    </div>
                    <div style={{ 
                      fontWeight: 700, 
                      color: '#111827', 
                      fontSize: '14px',
                      lineHeight: 1.2
                    }}>
                      ER-{new Date().getFullYear()}
                    </div>
                  </div>
                </div>

                {/* From & To */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                  gap: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '9px', 
                      color: '#9CA3AF', 
                      textTransform: 'uppercase',
                      marginBottom: '5px',
                      fontWeight: 600,
                      letterSpacing: '0.05em'
                    }}>
                      From
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin style={{ width: '12px', height: '12px', color: '#2563EB' }} />
                      <div style={{ 
                        fontWeight: 700, 
                        color: '#111827', 
                        fontSize: '13px',
                        lineHeight: 1.2
                      }}>
                        PAST
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '9px', 
                      color: '#9CA3AF', 
                      textTransform: 'uppercase',
                      marginBottom: '5px',
                      fontWeight: 600,
                      letterSpacing: '0.05em'
                    }}>
                      To
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin style={{ width: '12px', height: '12px', color: '#F97316' }} />
                      <div style={{ 
                        fontWeight: 700, 
                        color: '#111827', 
                        fontSize: '13px',
                        lineHeight: 1.2
                      }}>
                        NOW
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gate, Seat, Boarding */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                  gap: '10px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '9px', 
                      color: '#9CA3AF', 
                      textTransform: 'uppercase',
                      marginBottom: '5px',
                      fontWeight: 600,
                      letterSpacing: '0.05em'
                    }}>
                      Gate
                    </div>
                    <div style={{ 
                      fontWeight: 700, 
                      color: '#111827', 
                      fontSize: '14px',
                      lineHeight: 1.2
                    }}>
                      M1
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '9px', 
                      color: '#9CA3AF', 
                      textTransform: 'uppercase',
                      marginBottom: '5px',
                      fontWeight: 600,
                      letterSpacing: '0.05em'
                    }}>
                      Seat
                    </div>
                    <div style={{ 
                      fontWeight: 700, 
                      color: '#111827', 
                      fontSize: '14px',
                      lineHeight: 1.2
                    }}>
                      1A
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '9px', 
                      color: '#9CA3AF', 
                      textTransform: 'uppercase',
                      marginBottom: '5px',
                      fontWeight: 600,
                      letterSpacing: '0.05em'
                    }}>
                      Board
                    </div>
                    <div style={{ 
                      fontWeight: 700, 
                      color: '#111827', 
                      fontSize: '14px',
                      lineHeight: 1.2
                    }}>
                      NOW
                    </div>
                  </div>
                </div>

                {/* Barcode */}
                <div style={{ 
                  marginTop: '12px', 
                  paddingTop: '12px', 
                  borderTop: '1px dashed #D1D5DB' 
                }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: '2px', 
                    height: '44px', 
                    alignItems: 'flex-end',
                    marginBottom: '8px'
                  }}>
                    {[...Array(22)].map((_, i) => (
                      <div
                        key={i}
                        style={{ 
                          flex: 1,
                          background: '#111827',
                          height: `${35 + Math.random() * 65}%`,
                          opacity: 0.85 + Math.random() * 0.15,
                          borderRadius: '1px'
                        }}
                      />
                    ))}
                  </div>
                  <div style={{
                    fontSize: '9px',
                    textAlign: 'center',
                    color: '#9CA3AF',
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em'
                  }}>
                    CAPSULE-{Date.now().toString().slice(-8)}
                  </div>
                </div>
              </div>

              {/* Perforation */}
              <div style={{ 
                position: 'relative', 
                height: '10px', 
                background: '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '0 4px'
              }}>
                {[...Array(14)].map((_, i) => (
                  <div key={i} style={{ 
                    width: '5px', 
                    height: '5px', 
                    borderRadius: '50%', 
                    background: '#2563EB' 
                  }} />
                ))}
              </div>
            </motion.div>

            {/* Scanner hint */}
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{
                marginTop: '22px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div style={{
                width: '100px',
                height: '3px',
                background: '#4ADE80',
                borderRadius: '9999px',
                marginBottom: '8px'
              }} />
              <p style={{ fontSize: '12px', color: '#DBEAFE', fontWeight: 500 }}>Click to scan</p>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* Phase 2: Approved */}
      {phase === 'approved' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ position: 'relative', maxWidth: '320px', width: '100%' }}
        >
          {/* Simplified pass for approved state */}
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'relative',
              width: '100%',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.4)',
              overflow: 'hidden'
            }}
          >
            {/* Scanning beam */}
            <motion.div
              initial={{ y: '-100%' }}
              animate={{ y: '200%' }}
              transition={{ duration: 1, ease: 'linear' }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, transparent, rgba(34, 197, 94, 0.3), transparent)',
                pointerEvents: 'none',
                boxShadow: '0 0 40px rgba(34, 197, 94, 0.6)',
                zIndex: 1
              }}
            />

            <div style={{
              background: 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)',
              padding: '14px 16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plane style={{ width: '18px', height: '18px', color: 'white' }} />
                <span style={{ fontWeight: 700, fontSize: '15px', color: 'white', letterSpacing: '0.05em' }}>
                  ERAS AIRWAYS
                </span>
              </div>
            </div>

            <div style={{ padding: '24px 16px', background: 'white' }}>
              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>Passenger</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>Time Traveler</div>
              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>Flight ER-{new Date().getFullYear()}</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>Gate M1 • Seat 1A</div>
            </div>
          </motion.div>

          {/* APPROVED stamp */}
          <motion.div
            initial={{ scale: 0, rotate: -20, opacity: 0 }}
            animate={{ scale: 1.2, rotate: -15, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4, type: 'spring', bounce: 0.5 }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10
            }}
          >
            <div style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              border: '6px solid #22C55E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(34, 197, 94, 0.15)',
              backdropFilter: 'blur(4px)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <Check style={{ 
                  width: '44px', 
                  height: '44px', 
                  color: '#22C55E', 
                  margin: '0 auto 6px', 
                  strokeWidth: 3 
                }} />
                <p style={{ 
                  fontSize: '18px', 
                  fontWeight: 700, 
                  color: '#22C55E', 
                  letterSpacing: '0.1em' 
                }}>
                  APPROVED
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Phase 3: Gates Opening */}
      {phase === 'gates-opening' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: '-100%' }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: '50%',
              background: 'linear-gradient(to right, #1F2937, #374151)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}
          />
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '50%',
              right: 0,
              background: 'linear-gradient(to left, #1F2937, #374151)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            style={{ position: 'absolute', textAlign: 'center', zIndex: 10 }}
          >
            <motion.div
              animate={{ rotateY: 360 }}
              transition={{ duration: 1, ease: 'linear' }}
              style={{ fontSize: '72px', marginBottom: '16px' }}
            >
              🛫
            </motion.div>
            <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
              Now Boarding
            </h3>
            <p style={{ color: '#DBEAFE', fontSize: '15px' }}>Gate M1 • Journey Begins</p>
          </motion.div>
        </motion.div>
      )}

      {/* Phase 4: Boarding */}
      {phase === 'boarding' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          style={{ position: 'relative', textAlign: 'center' }}
        >
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotateZ: [-2, 2, -2]
            }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            style={{ fontSize: '88px', marginBottom: '20px' }}
          >
            ✈️
          </motion.div>

          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ fontSize: '36px', fontWeight: 700, color: 'white', marginBottom: '12px' }}
          >
            Journey Complete!
          </motion.h2>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ fontSize: '18px', color: '#DBEAFE' }}
          >
            Welcome back, time traveler
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{ marginTop: '28px', display: 'flex', gap: '14px', justifyContent: 'center' }}
          >
            {['Departed', 'In Flight', 'Arrived'].map((status, i) => (
              <motion.div
                key={status}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.9 + i * 0.15 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#22C55E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Check style={{ width: '18px', height: '18px', color: 'white', strokeWidth: 3 }} />
                </div>
                <span style={{ fontSize: '10px', color: '#DBEAFE' }}>{status}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
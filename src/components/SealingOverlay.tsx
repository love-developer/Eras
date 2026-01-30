import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Check, Send, ShieldCheck, Heart, Star, Baby, Zap, Map, Rocket, Music, Gift, Anchor, Disc, PawPrint, Sparkles, Briefcase, Home, GraduationCap } from 'lucide-react';
import { createPortal } from 'react-dom';

interface SealingOverlayProps {
  isVisible: boolean;
  isSuccess: boolean;
  onAnimationComplete?: () => void;
  themeId?: string;
  mode?: 'seal' | 'draft'; // New prop to distinguish between sealing and draft saving
}

interface SealingThemeConfig {
  doorType: 'vertical-metal' | 'vertical-cloud' | 'vertical-parchment' | 'horizontal-glass' | 'horizontal-wood' | 'wrapping-paper' | 'cassette-case' | 'shutter';
  colors: {
    doorBg: string;
    doorBorder: string; // Tailwind class
    text: string; // Tailwind class
    lockIcon: string; // Tailwind class
    lockRingOuter: string; // Tailwind class
    lockRingInner: string; // Tailwind class
    successIcon: string; // Tailwind class
    successText: string; // Tailwind class
    successGlow: string; // Tailwind class
  };
  text: {
    sealing: string;
    success: string;
    topLabel?: string;
    bottomLabel?: string;
  };
  icons: {
    lock: React.ElementType;
    success: React.ElementType;
  };
  rivets?: boolean;
}

const SEALING_THEMES: Record<string, SealingThemeConfig> = {
  standard: {
    doorType: 'vertical-metal',
    colors: {
      doorBg: 'bg-slate-900',
      doorBorder: 'border-amber-500/50',
      text: 'text-slate-700',
      lockIcon: 'text-cyan-400',
      lockRingOuter: 'border-cyan-500/30',
      lockRingInner: 'border-purple-500/20',
      successIcon: 'text-green-400',
      successText: 'text-green-400',
      successGlow: 'shadow-[0_0_50px_rgba(34,197,94,0.3)]'
    },
    text: {
      sealing: 'Encrypting Memories...',
      success: 'Capsule Sealed',
      topLabel: 'Temporal Sealing Mechanism',
      bottomLabel: 'Secure Vault Access'
    },
    icons: {
      lock: Lock,
      success: ShieldCheck
    },
    rivets: true
  },
  new_life: {
    doorType: 'vertical-cloud',
    colors: {
      doorBg: 'bg-gradient-to-b from-purple-100 to-pink-100',
      doorBorder: 'border-white/50',
      text: 'text-purple-400',
      lockIcon: 'text-purple-500',
      lockRingOuter: 'border-purple-300/50',
      lockRingInner: 'border-pink-300/50',
      successIcon: 'text-purple-600',
      successText: 'text-purple-600',
      successGlow: 'shadow-[0_0_50px_rgba(168,85,247,0.3)]'
    },
    text: {
      sealing: 'Tucking memory away...',
      success: 'Safe & Sound',
      topLabel: 'Sweet Dreams',
      bottomLabel: 'Precious Moments'
    },
    icons: {
      lock: Baby,
      success: Heart
    },
    rivets: false
  },
  wedding: {
    doorType: 'vertical-parchment',
    colors: {
      doorBg: 'bg-[#fdfbf7]',
      doorBorder: 'border-amber-400/30',
      text: 'text-amber-800/40',
      lockIcon: 'text-amber-600',
      lockRingOuter: 'border-amber-500/30',
      lockRingInner: 'border-amber-300/30',
      successIcon: 'text-amber-600',
      successText: 'text-amber-700',
      successGlow: 'shadow-[0_0_50px_rgba(217,119,6,0.2)]'
    },
    text: {
      sealing: 'Sealing your promise...',
      success: 'Vow Sealed',
      topLabel: 'Eternal Promise',
      bottomLabel: 'Golden Hour'
    },
    icons: {
      lock: Heart, // Replaced with wax seal visual in render
      success: Heart
    },
    rivets: false
  },
  birthday: {
    doorType: 'wrapping-paper',
    colors: {
      doorBg: 'bg-red-500',
      doorBorder: 'border-yellow-400',
      text: 'text-white/80',
      lockIcon: 'text-yellow-300',
      lockRingOuter: 'border-white/30',
      lockRingInner: 'border-yellow-200/30',
      successIcon: 'text-white',
      successText: 'text-yellow-200',
      successGlow: 'shadow-[0_0_50px_rgba(253,224,71,0.4)]'
    },
    text: {
      sealing: 'Wrapping surprise...',
      success: 'Ready to Gift',
      topLabel: 'Special Delivery',
      bottomLabel: 'Do Not Open'
    },
    icons: {
      lock: Gift,
      success: Star
    },
    rivets: false
  },
  anniversary: {
    doorType: 'vertical-metal', // Will style as velvet
    colors: {
      doorBg: 'bg-rose-950',
      doorBorder: 'border-rose-500/50',
      text: 'text-rose-300/50',
      lockIcon: 'text-rose-400',
      lockRingOuter: 'border-rose-500/30',
      lockRingInner: 'border-pink-400/20',
      successIcon: 'text-rose-400',
      successText: 'text-rose-300',
      successGlow: 'shadow-[0_0_50px_rgba(244,114,182,0.3)]'
    },
    text: {
      sealing: 'Preserving the flame...',
      success: 'Love Locked',
      topLabel: 'Eternal Flame',
      bottomLabel: 'Forever & Always'
    },
    icons: {
      lock: Heart,
      success: Heart
    },
    rivets: false
  },
  future: {
    doorType: 'horizontal-glass',
    colors: {
      doorBg: 'bg-cyan-950/80',
      doorBorder: 'border-emerald-500/50',
      text: 'text-emerald-500/50',
      lockIcon: 'text-emerald-400',
      lockRingOuter: 'border-emerald-500/30',
      lockRingInner: 'border-teal-500/20',
      successIcon: 'text-emerald-400',
      successText: 'text-emerald-400',
      successGlow: 'shadow-[0_0_50px_rgba(52,211,153,0.3)]'
    },
    text: {
      sealing: 'Initializing stasis...',
      success: 'Time Locked',
      topLabel: 'Cryo-Stasis Unit',
      bottomLabel: 'Biometric Lock Engaged'
    },
    icons: {
      lock: Zap,
      success: Lock
    },
    rivets: true
  },
  graduation: {
    doorType: 'shutter',
    colors: {
      doorBg: 'bg-slate-800',
      doorBorder: 'border-yellow-500', // Hazard stripes
      text: 'text-yellow-500',
      lockIcon: 'text-white',
      lockRingOuter: 'border-yellow-500',
      lockRingInner: 'border-black',
      successIcon: 'text-yellow-400',
      successText: 'text-yellow-400',
      successGlow: 'shadow-[0_0_50px_rgba(234,179,8,0.5)]'
    },
    text: {
      sealing: 'Securing for trajectory...',
      success: 'Ready for Launch',
      topLabel: 'Blast Shield',
      bottomLabel: 'Safety Locks Engaged'
    },
    icons: {
      lock: Rocket,
      success: Star
    },
    rivets: true
  },
  friendship: {
    doorType: 'cassette-case',
    colors: {
      doorBg: 'bg-transparent', // Clear plastic
      doorBorder: 'border-teal-500/30',
      text: 'text-teal-900',
      lockIcon: 'text-teal-600',
      lockRingOuter: 'border-teal-400',
      lockRingInner: 'border-pink-400',
      successIcon: 'text-teal-500',
      successText: 'text-teal-600',
      successGlow: 'shadow-[0_0_50px_rgba(45,212,191,0.3)]'
    },
    text: {
      sealing: 'Saving mix...',
      success: 'Recorded',
      topLabel: 'Side A',
      bottomLabel: 'Do Not Tape Over'
    },
    icons: {
      lock: Music, // Replaced by cassette visual
      success: Check
    },
    rivets: false
  },
  travel: {
    doorType: 'horizontal-wood',
    colors: {
      doorBg: 'bg-[#5D4037]', // Leather brown
      doorBorder: 'border-[#3E2723]',
      text: 'text-orange-200/60',
      lockIcon: 'text-amber-400',
      lockRingOuter: 'border-amber-500/50',
      lockRingInner: 'border-orange-900/50',
      successIcon: 'text-amber-400',
      successText: 'text-amber-200',
      successGlow: 'shadow-[0_0_50px_rgba(251,191,36,0.3)]'
    },
    text: {
      sealing: 'Stowing away...',
      success: 'Packed & Ready',
      topLabel: 'Cargo Hold',
      bottomLabel: 'Voyage Log'
    },
    icons: {
      lock: Map,
      success: Check
    },
    rivets: true
  },
  pet: {
    doorType: 'vertical-metal',
    colors: {
      doorBg: 'bg-[#8B5A3C]',
      doorBorder: 'border-[#CD853F]/50',
      text: 'text-[#FFE4B5]/50',
      lockIcon: 'text-[#CD853F]',
      lockRingOuter: 'border-[#CD853F]/30',
      lockRingInner: 'border-[#FFE4B5]/20',
      successIcon: 'text-[#FFE4B5]',
      successText: 'text-[#FFE4B5]',
      successGlow: 'shadow-[0_0_50px_rgba(205,133,63,0.3)]'
    },
    text: {
      sealing: 'Safeguarding memories...',
      success: 'Forever Cherished',
      topLabel: 'Pet Guardian Vault',
      bottomLabel: 'Paw Prints Preserved'
    },
    icons: {
      lock: PawPrint,
      success: Heart
    },
    rivets: false
  },
  gratitude: {
    doorType: 'vertical-parchment',
    colors: {
      doorBg: 'bg-[#FFF5F5]',
      doorBorder: 'border-red-300/30',
      text: 'text-red-800/40',
      lockIcon: 'text-red-600',
      lockRingOuter: 'border-red-500/30',
      lockRingInner: 'border-pink-400/30',
      successIcon: 'text-red-600',
      successText: 'text-red-700',
      successGlow: 'shadow-[0_0_50px_rgba(220,38,38,0.2)]'
    },
    text: {
      sealing: 'Preserving gratitude...',
      success: 'Thanks Sealed',
      topLabel: 'Grateful Heart',
      bottomLabel: 'Count Your Blessings'
    },
    icons: {
      lock: Sparkles,
      success: Heart
    },
    rivets: false
  },
  career: {
    doorType: 'horizontal-glass',
    colors: {
      doorBg: 'bg-[#1E3A8A]/80',
      doorBorder: 'border-blue-500/50',
      text: 'text-blue-400/50',
      lockIcon: 'text-blue-400',
      lockRingOuter: 'border-blue-500/30',
      lockRingInner: 'border-cyan-500/20',
      successIcon: 'text-blue-400',
      successText: 'text-blue-400',
      successGlow: 'shadow-[0_0_50px_rgba(59,130,246,0.4)]'
    },
    text: {
      sealing: 'Archiving achievement...',
      success: 'Summit Reached',
      topLabel: 'Professional Vault',
      bottomLabel: 'Career Milestone Secured'
    },
    icons: {
      lock: Briefcase,
      success: Star
    },
    rivets: true
  },
  new_year: {
    doorType: 'wrapping-paper',
    colors: {
      doorBg: 'bg-purple-600',
      doorBorder: 'border-yellow-400',
      text: 'text-white/80',
      lockIcon: 'text-yellow-300',
      lockRingOuter: 'border-white/30',
      lockRingInner: 'border-purple-300/30',
      successIcon: 'text-yellow-300',
      successText: 'text-yellow-200',
      successGlow: 'shadow-[0_0_50px_rgba(253,224,71,0.5)]'
    },
    text: {
      sealing: 'Setting resolutions...',
      success: 'New Year Sealed',
      topLabel: 'Countdown Active',
      bottomLabel: 'Auld Lang Syne'
    },
    icons: {
      lock: Sparkles,
      success: Star
    },
    rivets: false
  },
  new_home: {
    doorType: 'vertical-metal',
    colors: {
      doorBg: 'bg-[#059669]',
      doorBorder: 'border-emerald-400/50',
      text: 'text-emerald-200/50',
      lockIcon: 'text-emerald-300',
      lockRingOuter: 'border-emerald-400/30',
      lockRingInner: 'border-green-300/20',
      successIcon: 'text-emerald-300',
      successText: 'text-emerald-200',
      successGlow: 'shadow-[0_0_50px_rgba(16,185,129,0.3)]'
    },
    text: {
      sealing: 'Locking the door...',
      success: 'Home Sweet Home',
      topLabel: 'New Nest',
      bottomLabel: 'Keys Secured'
    },
    icons: {
      lock: Home,
      success: Heart
    },
    rivets: true
  },
  first_day: {
    doorType: 'shutter',
    colors: {
      doorBg: 'bg-orange-700',
      doorBorder: 'border-orange-400',
      text: 'text-orange-200',
      lockIcon: 'text-white',
      lockRingOuter: 'border-orange-400',
      lockRingInner: 'border-yellow-300',
      successIcon: 'text-orange-300',
      successText: 'text-orange-200',
      successGlow: 'shadow-[0_0_50px_rgba(234,88,12,0.4)]'
    },
    text: {
      sealing: 'Bell is ringing...',
      success: 'Adventure Begins',
      topLabel: 'First Day',
      bottomLabel: 'Fresh Start Locked'
    },
    icons: {
      lock: GraduationCap,
      success: Star
    },
    rivets: true
  }
};

export function SealingOverlay({ isVisible, isSuccess, onAnimationComplete, themeId = 'standard', mode = 'seal' }: SealingOverlayProps) {
  const [stage, setStage] = useState<'idle' | 'closing' | 'locking' | 'launching'>('idle');
  let theme = SEALING_THEMES[themeId] || SEALING_THEMES.standard;

  // Override theme for draft mode with purple/blue colors
  if (mode === 'draft') {
    theme = {
      ...theme,
      colors: {
        ...theme.colors,
        lockIcon: 'text-purple-400',
        lockRingOuter: 'border-purple-500/30',
        lockRingInner: 'border-blue-500/20',
        successIcon: 'text-blue-400',
        successText: 'text-blue-400',
        successGlow: 'shadow-[0_0_50px_rgba(96,165,250,0.4)]'
      },
      text: {
        ...theme.text,
        sealing: 'Saving Draft...',
        success: 'Draft Saved!'
      }
    };
  }

  useEffect(() => {
    if (isVisible && stage === 'idle') {
      setStage('closing');
      
      // Lock scroll to keep animation in view
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    }
    
    // Cleanup: restore scroll when overlay closes
    if (!isVisible) {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isVisible, stage]);

  useEffect(() => {
    if (isSuccess && stage === 'locking') {
      const timer = setTimeout(() => {
        setStage('launching');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, stage]);

  const handleDoorsClosed = () => {
    if (stage === 'closing') {
      setStage('locking');
    }
  };

  const handleLaunchComplete = () => {
    if (stage === 'launching' && onAnimationComplete) {
      setTimeout(onAnimationComplete, 1000);
    }
  };

  if (!isVisible) return null;

  const renderDoors = () => {
    // 1. Cloud Doors (New Life)
    if (theme.doorType === 'vertical-cloud') {
      return (
        <>
          <motion.div
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ y: stage === 'idle' ? '-100%' : '0%', opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 60 }}
            onAnimationComplete={handleDoorsClosed}
            className="absolute top-0 left-0 right-0 h-[55%] z-10 flex items-end justify-center pb-8"
            style={{ 
              background: 'linear-gradient(to bottom, #f3e8ff 0%, #fbc2eb 100%)',
              maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
            }}
          >
            <div className="absolute bottom-0 w-full h-16 bg-[url('https://api.iconify.design/bi:cloud-fill.svg?color=%23fbc2eb')] bg-repeat-x bg-[length:64px_64px] opacity-50 translate-y-1/2"></div>
            <div className={`font-serif text-sm tracking-widest uppercase ${theme.colors.text} mb-12`}>
              {theme.text.topLabel}
            </div>
          </motion.div>
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: stage === 'idle' ? '100%' : '0%', opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 60 }}
            className="absolute bottom-0 left-0 right-0 h-[55%] z-10 flex items-start justify-center pt-8"
            style={{ 
              background: 'linear-gradient(to top, #f3e8ff 0%, #a18cd1 100%)',
              maskImage: 'linear-gradient(to top, black 80%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to top, black 80%, transparent 100%)'
            }}
          >
             <div className={`font-serif text-sm tracking-widest uppercase ${theme.colors.text} mt-12`}>
              {theme.text.bottomLabel}
            </div>
          </motion.div>
        </>
      );
    }

    // 2. Parchment Doors (Wedding)
    if (theme.doorType === 'vertical-parchment') {
      return (
        <>
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: stage === 'idle' ? '-100%' : '0%' }}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.8 }}
            onAnimationComplete={handleDoorsClosed}
            className={`absolute top-0 bottom-0 left-0 w-1/2 ${theme.colors.doorBg} border-r ${theme.colors.doorBorder} z-10 flex items-center justify-end pr-4 shadow-xl`}
            style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}
          >
            <div className={`rotate-90 origin-right ${theme.colors.text} font-serif tracking-widest uppercase text-xs absolute right-8 top-1/2 -translate-y-1/2`}>
              {theme.text.topLabel}
            </div>
          </motion.div>
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: stage === 'idle' ? '100%' : '0%' }}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.8 }}
            className={`absolute top-0 bottom-0 right-0 w-1/2 ${theme.colors.doorBg} border-l ${theme.colors.doorBorder} z-10 flex items-center justify-start pl-4 shadow-xl`}
             style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}
          >
          </motion.div>
        </>
      );
    }

    // 3. Wrapping Paper (Birthday)
    if (theme.doorType === 'wrapping-paper') {
       return (
        <>
          <motion.div
            initial={{ y: '-100%', skewY: -5 }}
            animate={{ y: stage === 'idle' ? '-100%' : '0%', skewY: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            onAnimationComplete={handleDoorsClosed}
            className="absolute top-0 left-0 right-0 h-1/2 bg-red-500 z-10 flex items-end justify-center pb-8 border-b-4 border-yellow-400"
            style={{ 
              backgroundImage: 'radial-gradient(#FDBA74 20%, transparent 20%), radial-gradient(#FDBA74 20%, transparent 20%)',
              backgroundPosition: '0 0, 20px 20px',
              backgroundSize: '40px 40px'
            }}
          >
            <div className="bg-yellow-400 w-16 h-full absolute left-1/2 -translate-x-1/2"></div>
          </motion.div>
          <motion.div
            initial={{ y: '100%', skewY: 5 }}
            animate={{ y: stage === 'idle' ? '100%' : '0%', skewY: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="absolute bottom-0 left-0 right-0 h-1/2 bg-red-500 z-10 flex items-start justify-center pt-8 border-t-4 border-yellow-400"
            style={{ 
              backgroundImage: 'radial-gradient(#FDBA74 20%, transparent 20%), radial-gradient(#FDBA74 20%, transparent 20%)',
              backgroundPosition: '0 0, 20px 20px',
              backgroundSize: '40px 40px'
            }}
          >
             <div className="bg-yellow-400 w-16 h-full absolute left-1/2 -translate-x-1/2"></div>
          </motion.div>
        </>
      );
    }

    // 4. Horizontal Glass (Future)
    if (theme.doorType === 'horizontal-glass') {
        return (
            <>
                {/* Left Door */}
                <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: stage === 'idle' ? '-100%' : '0%' }}
                    transition={{ type: 'tween', ease: 'anticipate', duration: 0.8 }}
                    onAnimationComplete={handleDoorsClosed}
                    className="absolute top-0 bottom-0 left-0 w-1/2 bg-slate-900/90 backdrop-blur-md border-r-2 border-emerald-500/50 z-10 flex flex-col items-end justify-center pr-8"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(16,185,129,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]" />
                    <div className="font-mono text-xs text-emerald-500/50 mb-4">{`> SYSTEM_LOCK`}</div>
                    <div className="w-full h-px bg-emerald-500/30" />
                </motion.div>
                 {/* Right Door */}
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: stage === 'idle' ? '100%' : '0%' }}
                    transition={{ type: 'tween', ease: 'anticipate', duration: 0.8 }}
                    className="absolute top-0 bottom-0 right-0 w-1/2 bg-slate-900/90 backdrop-blur-md border-l-2 border-emerald-500/50 z-10 flex flex-col items-start justify-center pl-8"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(-45deg,transparent_25%,rgba(16,185,129,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]" />
                    <div className="font-mono text-xs text-emerald-500/50 mb-4">{`> SECURE_MODE`}</div>
                    <div className="w-full h-px bg-emerald-500/30" />
                </motion.div>
            </>
        )
    }

    // 5. Horizontal Wood/Suitcase (Travel)
    if (theme.doorType === 'horizontal-wood') {
        return (
            <>
                 {/* Top Trunk Lid */}
                <motion.div
                    initial={{ y: '-100%' }}
                    animate={{ y: stage === 'idle' ? '-100%' : '0%' }}
                    transition={{ type: 'spring', damping: 20 }}
                    onAnimationComplete={handleDoorsClosed}
                    className="absolute top-0 left-0 right-0 h-1/2 bg-[#5D4037] z-10 flex items-end justify-center pb-8 border-b-8 border-[#3E2723]"
                    style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/leather.png")' }}
                >
                    {/* Brass Corners */}
                    <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-amber-500 rounded-bl-xl opacity-80" />
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-amber-500 rounded-br-xl opacity-80" />
                </motion.div>
                 {/* Bottom Trunk Base */}
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: stage === 'idle' ? '100%' : '0%' }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#5D4037] z-10 flex items-start justify-center pt-8 border-t-8 border-[#3E2723]"
                    style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/leather.png")' }}
                >
                     {/* Brass Corners */}
                     <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-amber-500 rounded-tl-xl opacity-80" />
                    <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-amber-500 rounded-tr-xl opacity-80" />
                </motion.div>
            </>
        )
    }

    // 6. Cassette Case (Friendship)
    if (theme.doorType === 'cassette-case') {
        return (
            <>
                <motion.div
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: stage === 'idle' ? 0 : 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    onAnimationComplete={handleDoorsClosed}
                    className="absolute inset-8 bg-white/20 backdrop-blur-md rounded-xl border border-white/40 z-10 shadow-2xl flex items-center justify-center"
                >
                    {/* Cassette Details */}
                    <div className="absolute top-4 left-4 w-full border-b border-white/20" />
                    <div className="absolute bottom-12 left-0 right-0 h-24 bg-white/10" />
                    {/* Spools */}
                    <div className="flex gap-12">
                        <div className="w-24 h-24 rounded-full border-4 border-white/30 bg-black/10 flex items-center justify-center">
                            <div className="w-4 h-4 bg-white rounded-full animate-spin duration-[2s]" />
                        </div>
                        <div className="w-24 h-24 rounded-full border-4 border-white/30 bg-black/10 flex items-center justify-center">
                             <div className="w-4 h-4 bg-white rounded-full animate-spin duration-[2s]" />
                        </div>
                    </div>
                </motion.div>
            </>
        )
    }
    
    // 7. Shutter (Graduation)
    if (theme.doorType === 'shutter') {
         return (
            <>
                <motion.div
                    initial={{ y: '-100%' }}
                    animate={{ y: stage === 'idle' ? '-100%' : '0%' }}
                    transition={{ type: 'tween', ease: 'circOut', duration: 0.6 }}
                    onAnimationComplete={handleDoorsClosed}
                    className="absolute top-0 left-0 right-0 h-1/2 bg-slate-800 z-10 flex items-end justify-center border-b-8 border-yellow-500"
                >
                    {/* Hazard Stripes */}
                    <div className="absolute bottom-0 w-full h-8 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)] opacity-50" />
                    <div className="mb-8 text-yellow-500 font-black tracking-widest text-2xl uppercase">DANGER</div>
                </motion.div>
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: stage === 'idle' ? '100%' : '0%' }}
                    transition={{ type: 'tween', ease: 'circOut', duration: 0.6 }}
                    className="absolute bottom-0 left-0 right-0 h-1/2 bg-slate-800 z-10 flex items-start justify-center border-t-8 border-yellow-500"
                >
                    <div className="absolute top-0 w-full h-8 bg-[repeating-linear-gradient(-45deg,transparent,transparent_10px,#000_10px,#000_20px)] opacity-50" />
                    <div className="mt-8 text-yellow-500 font-black tracking-widest text-2xl uppercase">HIGH VOLTAGE</div>
                </motion.div>
            </>
        )
    }

    // Default Vertical Doors (Standard, Anniversary)
    return (
      <>
        {/* Top Door */}
        <motion.div
          initial={{ y: '-100%' }}
          animate={{ y: stage === 'idle' ? '-100%' : '0%' }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, mass: 1.5 }}
          onAnimationComplete={handleDoorsClosed}
          className={`absolute top-0 left-0 right-0 h-1/2 ${theme.colors.doorBg} border-b-4 ${theme.colors.doorBorder} shadow-2xl z-10 flex items-end justify-center pb-8`}
        >
          <div className={`${theme.colors.text} font-mono text-xs tracking-[0.5em] uppercase opacity-50 mb-4`}>
            {theme.text.topLabel}
          </div>
        </motion.div>

        {/* Bottom Door */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: stage === 'idle' ? '100%' : '0%' }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, mass: 1.5 }}
          className={`absolute bottom-0 left-0 right-0 h-1/2 ${theme.colors.doorBg} border-t-4 ${theme.colors.doorBorder} shadow-2xl z-10 flex items-start justify-center pt-8`}
        >
          <div className={`${theme.colors.text} font-mono text-xs tracking-[0.5em] uppercase opacity-50 mt-4`}>
            {theme.text.bottomLabel}
          </div>
        </motion.div>
      </>
    );
  };

  const overlayContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm pointer-events-auto"
      />

      {/* Container for doors - uses fixed positioning to ensure centering in viewport */}
      <div className="fixed inset-0 flex items-center justify-center">
        {renderDoors()}
      </div>

      <AnimatePresence mode="wait">
        {stage === 'locking' && (
          <motion.div 
            className="fixed inset-0 z-20 flex items-center justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.3 } }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="relative">
                {/* Spinning Rings - Only for high tech themes or standard */}
                {(themeId === 'standard' || themeId === 'future' || themeId === 'graduation') && (
                  <>
                    <motion.div 
                      className={`absolute inset-0 border-4 border-dashed ${theme.colors.lockRingOuter} rounded-full`}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div 
                      className={`absolute inset-[-20px] border-2 border-dotted ${theme.colors.lockRingInner} rounded-full`}
                      animate={{ rotate: -360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    />
                  </>
                )}

                {/* Special Glow for Magic themes */}
                {(themeId === 'new_life' || themeId === 'wedding' || themeId === 'anniversary') && (
                  <motion.div 
                    className={`absolute inset-[-10px] rounded-full bg-white/20 blur-xl`}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                {/* Lock Container */}
                <div className={`w-32 h-32 rounded-full border-4 ${theme.colors.doorBorder} ${theme.colors.doorBg} flex items-center justify-center shadow-lg`}>
                   <theme.icons.lock className={`w-12 h-12 ${theme.colors.lockIcon}`} />
                </div>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${theme.colors.lockIcon} font-mono text-sm tracking-widest uppercase animate-pulse font-bold`}
              >
                {theme.text.sealing}
              </motion.div>
            </div>
          </motion.div>
        )}

        {stage === 'launching' && (
          <motion.div 
            className="fixed inset-0 z-20 flex items-center justify-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onAnimationComplete={handleLaunchComplete}
          >
            <div className="flex flex-col items-center justify-center gap-6">
             <div className="relative">
               <motion.div 
                 className={`absolute inset-0 rounded-full blur-2xl opacity-20 bg-white`}
                 animate={{ scale: [1, 2], opacity: [0.2, 0] }}
                 transition={{ duration: 1 }}
               />
               <div className={`w-32 h-32 ${theme.colors.doorBg} rounded-full border-4 ${theme.colors.successText} flex items-center justify-center ${theme.colors.successGlow}`}>
                 <theme.icons.success className={`w-14 h-14 ${theme.colors.successIcon}`} />
               </div>
             </div>

             <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${theme.colors.successText} font-mono text-lg tracking-widest uppercase font-bold`}
            >
              {theme.text.success}
            </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Render overlay at document body level using portal
  return typeof document !== 'undefined'
    ? createPortal(overlayContent, document.body)
    : null;
}
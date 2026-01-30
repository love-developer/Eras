import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { 
  Sparkles, 
  Rocket, 
  Zap, 
  Star, 
  Flame,
  Eye,
  Moon,
  Sun,
  Orbit,
  Crown,
  Wand2,
  Play,
  X,
  Wind,
  Waves,
  Target,
  Radio,
  Hexagon,
  Gem,
  Disc,
  Satellite,
  Plane,
  Building
} from 'lucide-react';

interface CosmicEffect {
  id: string;
  name: string;
  description: string;
  category: 'particles' | 'backgrounds' | 'transitions' | 'explosions' | 'animations';
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  colors: string[];
  icon: React.ReactNode;
}

const cosmicEffects: CosmicEffect[] = [
  // PARTICLES & STELLAR EFFECTS
  {
    id: 'asteroid-field',
    name: 'Asteroid Field',
    description: 'Drifting space rocks with rotation and depth',
    category: 'particles',
    rarity: 'uncommon',
    colors: ['#64748b', '#94a3b8'],
    icon: <Orbit className="w-5 h-5" />
  },
  {
    id: 'black-hole',
    name: 'Black Hole Vortex',
    description: 'Gravitational spiral with time dilation effects',
    category: 'particles',
    rarity: 'legendary',
    colors: ['#000000', '#1e1b4b', '#4c1d95'],
    icon: <Moon className="w-5 h-5" />
  },
  {
    id: 'comet-trail',
    name: 'Comet Trail',
    description: 'Blazing trail with tail fade effect',
    category: 'particles',
    rarity: 'uncommon',
    colors: ['#60a5fa', '#93c5fd', '#dbeafe'],
    icon: <Rocket className="w-5 h-5" />
  },
  {
    id: 'supernova',
    name: 'Supernova Explosion',
    description: 'MASSIVE stellar explosion with 250+ particles',
    category: 'explosions',
    rarity: 'legendary',
    colors: ['#fef08a', '#fbbf24', '#f97316', '#dc2626'],
    icon: <Flame className="w-5 h-5" />
  },
  {
    id: 'pulsar',
    name: 'Pulsar Beam',
    description: 'Rotating energy beams with rhythmic pulses',
    category: 'particles',
    rarity: 'epic',
    colors: ['#06b6d4', '#0ea5e9', '#3b82f6'],
    icon: <Zap className="w-5 h-5" />
  },
  {
    id: 'nebula',
    name: 'Nebula Cloud',
    description: 'Swirling cosmic gas with color morphing',
    category: 'backgrounds',
    rarity: 'rare',
    colors: ['#c084fc', '#a855f7', '#9333ea', '#7e22ce'],
    icon: <Sparkles className="w-5 h-5" />
  },
  
  // BACKGROUND EFFECTS
  {
    id: 'galactic-horizon',
    name: 'Galactic Horizon',
    description: 'Dynamic gradient sky with animated stars',
    category: 'backgrounds',
    rarity: 'epic',
    colors: ['#6366f1', '#8b5cf6', '#d946ef'],
    icon: <Sun className="w-5 h-5" />
  },
  {
    id: 'particle-drift',
    name: 'Particle Drift',
    description: 'CSS-only drifting particles (performance optimized)',
    category: 'particles',
    rarity: 'common',
    colors: ['#ffffff'],
    icon: <Star className="w-5 h-5" />
  },
  {
    id: 'portal-glow',
    name: 'Portal Glow',
    description: 'Expanding radial glow with pulse effect',
    category: 'backgrounds',
    rarity: 'rare',
    colors: ['#3b82f6', '#6366f1', '#8b5cf6'],
    icon: <Eye className="w-5 h-5" />
  },
  
  // TRANSITION EFFECTS
  {
    id: 'horizon-activation',
    name: 'Horizon Activation Sequence',
    description: '5-phase epic transition: Zoom Out → Sunset → Travel → Sunrise → Celebration',
    category: 'transitions',
    rarity: 'legendary',
    colors: ['#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'],
    icon: <Rocket className="w-5 h-5" />
  },
  {
    id: 'title-unlock',
    name: 'Title Unlock Animation',
    description: 'Rarity-based reveal with screen shake and particles',
    category: 'transitions',
    rarity: 'epic',
    colors: ['#fbbf24', '#f59e0b', '#f97316'],
    icon: <Crown className="w-5 h-5" />
  },
  
  // ANIMATIONS
  {
    id: 'crown-sparkle',
    name: 'Crown Sparkle',
    description: 'Rotating sparkle with scale bounce',
    category: 'animations',
    rarity: 'legendary',
    colors: ['#fbbf24'],
    icon: <Crown className="w-5 h-5" />
  },
  {
    id: 'vortex-spin',
    name: 'Vortex Spin',
    description: 'Continuous 360° rotation',
    category: 'animations',
    rarity: 'rare',
    colors: ['#8b5cf6'],
    icon: <Wand2 className="w-5 h-5" />
  },
  {
    id: 'scroll-unfurl',
    name: 'Scroll Unfurl',
    description: 'Horizontal scale animation',
    category: 'animations',
    rarity: 'uncommon',
    colors: ['#10b981'],
    icon: <Sparkles className="w-5 h-5" />
  },
  
  // COSMIC EVENTS (from cosmicEvents.tsx)
  {
    id: 'meteor-shower',
    name: 'Meteor Shower',
    description: 'Multiple shooting stars cascading across the sky',
    category: 'particles',
    rarity: 'common',
    colors: ['#fbbf24', '#f59e0b', '#ea580c'],
    icon: <Star className="w-5 h-5" />
  },
  {
    id: 'satellite-pass',
    name: 'Satellite Pass',
    description: 'Realistic satellite crossing with solar panels and blinking lights',
    category: 'particles',
    rarity: 'uncommon',
    colors: ['#94a3b8', '#64748b', '#3b82f6'],
    icon: <Satellite className="w-5 h-5" />
  },
  {
    id: 'spacex-starship',
    name: 'SpaceX Starship',
    description: 'Iconic spacecraft with powerful engine glow and ascent trajectory',
    category: 'particles',
    rarity: 'legendary',
    colors: ['#f8fafc', '#3b82f6', '#fbbf24'],
    icon: <Rocket className="w-5 h-5" />
  },
  {
    id: 'space-station',
    name: 'Space Station',
    description: 'ISS-style orbital structure with solar panels',
    category: 'particles',
    rarity: 'legendary',
    colors: ['#94a3b8', '#3b82f6', '#ef4444'],
    icon: <Building className="w-5 h-5" />
  },
  {
    id: 'star-birth',
    name: 'Star Birth',
    description: 'New star forming with expanding luminosity',
    category: 'particles',
    rarity: 'uncommon',
    colors: ['#fef08a', '#fbbf24', '#ffffff'],
    icon: <Sparkles className="w-5 h-5" />
  },
  {
    id: 'cosmic-vortex',
    name: 'Cosmic Vortex',
    description: 'Swirling spacetime distortion',
    category: 'particles',
    rarity: 'legendary',
    colors: ['#6366f1', '#8b5cf6', '#ec4899'],
    icon: <Disc className="w-5 h-5" />
  },
  {
    id: 'space-lightning',
    name: 'Space Lightning',
    description: 'DRAMATIC diagonal lightning bolts with intense electric discharge',
    category: 'particles',
    rarity: 'legendary',
    colors: ['#8b5cf6', '#a5b4fc', '#ffffff'],
    icon: <Zap className="w-5 h-5" />
  },
  {
    id: 'wormhole',
    name: 'Wormhole',
    description: 'Portal through spacetime with tunnel effect',
    category: 'transitions',
    rarity: 'legendary',
    colors: ['#1e1b4b', '#4c1d95', '#7c3aed'],
    icon: <Target className="w-5 h-5" />
  },
  {
    id: 'crystal-formation',
    name: 'Crystal Formation',
    description: 'Crystalline structures growing from space dust',
    category: 'particles',
    rarity: 'legendary',
    colors: ['#a5f3fc', '#67e8f9', '#06b6d4'],
    icon: <Gem className="w-5 h-5" />
  },
  {
    id: 'stardust-explosion',
    name: 'Stardust Explosion',
    description: 'Sparkling cosmic dust burst',
    category: 'explosions',
    rarity: 'legendary',
    colors: ['#fde68a', '#fcd34d', '#fbbf24'],
    icon: <Sparkles className="w-5 h-5" />
  },
  {
    id: 'planet-transit',
    name: 'Planet Transit',
    description: 'Planet passing across the horizon',
    category: 'particles',
    rarity: 'rare',
    colors: ['#f59e0b', '#ea580c', '#dc2626'],
    icon: <Moon className="w-5 h-5" />
  },
  {
    id: 'ufo-streak',
    name: 'UFO Streak',
    description: 'Mysterious craft with erratic movement',
    category: 'particles',
    rarity: 'legendary',
    colors: ['#10b981', '#22c55e', '#84cc16'],
    icon: <Radio className="w-5 h-5" />
  },
  {
    id: 'cosmic-ray-burst',
    name: 'Cosmic Ray Burst',
    description: 'High-energy particle emission',
    category: 'explosions',
    rarity: 'legendary',
    colors: ['#ec4899', '#f472b6', '#fbbf24'],
    icon: <Zap className="w-5 h-5" />
  }
];

export function DeveloperCosmicEffects() {
  const [selectedEffect, setSelectedEffect] = useState<CosmicEffect | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories = ['all', 'particles', 'backgrounds', 'transitions', 'explosions', 'animations'];

  const filteredEffects = filterCategory === 'all' 
    ? cosmicEffects 
    : cosmicEffects.filter(e => e.category === filterCategory);

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'common': return 'from-slate-500 to-slate-600';
      case 'uncommon': return 'from-green-500 to-emerald-600';
      case 'rare': return 'from-blue-500 to-indigo-600';
      case 'epic': return 'from-purple-500 to-violet-600';
      case 'legendary': return 'from-yellow-400 to-orange-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const renderEffectPreview = (effect: CosmicEffect) => {
    switch (effect.id) {
      case 'asteroid-field':
        return (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-slate-400"
                style={{
                  width: Math.random() * 8 + 4 + 'px',
                  height: Math.random() * 8 + 4 + 'px',
                  left: Math.random() * 100 + '%',
                  top: Math.random() * 100 + '%',
                }}
                animate={{
                  x: [0, Math.random() * 50 - 25],
                  y: [0, Math.random() * 50 - 25],
                  rotate: [0, 360]
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            ))}
          </div>
        );

      case 'black-hole':
        return (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {/* Event horizon */}
            <motion.div
              className="absolute w-20 h-20 rounded-full"
              style={{
                background: 'radial-gradient(circle, #000000 0%, #1e1b4b 40%, #4c1d95 60%, transparent 100%)'
              }}
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 360]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
            {/* Accretion disk spirals */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-16 origin-bottom"
                style={{
                  background: 'linear-gradient(to top, #6366f1, transparent)',
                  left: '50%',
                  top: '50%',
                  marginLeft: '-2px'
                }}
                animate={{
                  rotate: [i * 45, i * 45 + 360]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            ))}
          </div>
        );

      case 'comet-trail':
        return (
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute w-3 h-3 rounded-full bg-blue-300"
              style={{
                boxShadow: '0 0 20px #60a5fa'
              }}
              animate={{
                x: [-50, 250],
                y: [150, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear'
              }}
            >
              {/* Trail */}
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: `linear-gradient(to right, #93c5fd, transparent)`,
                    left: -i * 8 + 'px',
                    top: '2px',
                    opacity: 1 - (i * 0.1)
                  }}
                />
              ))}
            </motion.div>
          </div>
        );

      case 'supernova':
        return (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {isPlaying && (
              <>
                {/* Core flash */}
                <motion.div
                  className="absolute w-8 h-8 rounded-full bg-white"
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: [0, 3, 5], opacity: [1, 0.8, 0] }}
                  transition={{ duration: 1 }}
                />
                {/* Explosion rays */}
                {[...Array(24)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-12 origin-bottom"
                    style={{
                      background: 'linear-gradient(to top, #fbbf24, #dc2626, transparent)',
                      left: '50%',
                      top: '50%',
                      rotate: (i * 15) + 'deg'
                    }}
                    initial={{ scaleY: 0, opacity: 1 }}
                    animate={{ scaleY: [0, 1.5, 1], opacity: [1, 0.8, 0] }}
                    transition={{ duration: 0.8, delay: i * 0.02 }}
                  />
                ))}
                {/* Particles */}
                {[...Array(50)].map((_, i) => {
                  const angle = (i / 50) * Math.PI * 2;
                  const velocity = Math.random() * 100 + 50;
                  return (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 rounded-full bg-orange-400"
                      style={{
                        left: '50%',
                        top: '50%'
                      }}
                      initial={{ x: 0, y: 0, opacity: 1 }}
                      animate={{
                        x: Math.cos(angle) * velocity,
                        y: Math.sin(angle) * velocity,
                        opacity: 0
                      }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                  );
                })}
              </>
            )}
          </div>
        );

      case 'pulsar':
        return (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {/* Core */}
            <motion.div
              className="absolute w-4 h-4 rounded-full bg-cyan-400"
              animate={{
                scale: [1, 1.3, 1],
                boxShadow: [
                  '0 0 10px #06b6d4',
                  '0 0 30px #0ea5e9',
                  '0 0 10px #06b6d4'
                ]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            {/* Beams */}
            {[0, 90, 180, 270].map((angle, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-32 origin-center"
                style={{
                  background: 'linear-gradient(to top, #06b6d4, transparent)',
                  left: '50%',
                  top: '50%',
                  marginLeft: '-2px',
                  marginTop: '-64px'
                }}
                animate={{
                  rotate: [angle, angle + 360],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            ))}
          </div>
        );

      case 'nebula':
        return (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full blur-3xl"
                style={{
                  width: Math.random() * 100 + 50 + 'px',
                  height: Math.random() * 100 + 50 + 'px',
                  left: Math.random() * 100 + '%',
                  top: Math.random() * 100 + '%',
                  background: effect.colors[i % effect.colors.length],
                  opacity: 0.3
                }}
                animate={{
                  x: [0, Math.random() * 50 - 25],
                  y: [0, Math.random() * 50 - 25],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: Math.random() * 5 + 3,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
        );

      case 'galactic-horizon':
        return (
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${effect.colors.join(', ')})`
              }}
              animate={{
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            {/* Stars */}
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-0.5 h-0.5 bg-white rounded-full"
                style={{
                  left: Math.random() * 100 + '%',
                  top: Math.random() * 100 + '%'
                }}
                animate={{
                  opacity: [0.2, 1, 0.2],
                  scale: [1, 1.5, 1]
                }}
                transition={{
                  duration: Math.random() * 2 + 1,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>
        );

      case 'particle-drift':
        return (
          <div className="absolute inset-0 overflow-hidden opacity-60">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-0.5 h-0.5 bg-white rounded-full"
                style={{
                  left: Math.random() * 100 + '%',
                  top: Math.random() * 100 + '%'
                }}
                animate={{
                  x: [0, -50],
                  y: [0, -50]
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            ))}
          </div>
        );

      case 'portal-glow':
        return (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <motion.div
              className="absolute w-20 h-20 rounded-full"
              style={{
                background: `radial-gradient(circle, ${effect.colors.join(', ')}, transparent)`
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          </div>
        );

      case 'crown-sparkle':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, -10, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <Crown className="w-12 h-12 text-yellow-400" />
            </motion.div>
          </div>
        );

      case 'vortex-spin':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear'
              }}
            >
              <Wand2 className="w-12 h-12 text-purple-400" />
            </motion.div>
          </div>
        );

      case 'scroll-unfurl':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scaleX: [1, 1.2, 1] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <Sparkles className="w-12 h-12 text-green-400" />
            </motion.div>
          </div>
        );

      // COSMIC EVENTS
      case 'meteor-shower':
        return (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-12 h-0.5 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)',
                  left: Math.random() * 80 + '%',
                  top: Math.random() * 50 + '%'
                }}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{
                  x: [0, -80],
                  y: [0, 80],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: 'easeOut'
                }}
              />
            ))}
          </div>
        );

      case 'satellite-pass':
        return (
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute"
              style={{ top: '30%' }}
              animate={{ left: ['-5%', '105%'] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            >
              <div className="relative w-6 h-4 bg-slate-400 shadow-lg">
                <div className="absolute -left-8 top-1 w-8 h-2 bg-gradient-to-r from-blue-800 to-blue-400" />
                <div className="absolute -right-8 top-1 w-8 h-2 bg-gradient-to-r from-blue-400 to-blue-800" />
                <motion.div
                  className="absolute w-1 h-1 rounded-full bg-red-500 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>
            </motion.div>
          </div>
        );

      case 'commercial-plane':
        return (
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute"
              style={{ top: '30%' }}
              initial={{ x: '-20%' }}
              animate={{ x: '120%' }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            >
              {/* Container - Significantly Smaller (0.3) */}
              <div className="relative" style={{ transform: 'scale(0.3) rotate(-2deg)' }}>
                
                {/* --- CONTRAILS --- */}
                {/* Adjusted to match new engine positions */}
                <motion.div
                  className="absolute top-6 -left-60 w-[600px] h-6 bg-gradient-to-l from-white/60 via-white/20 to-transparent blur-lg rounded-full origin-right"
                  animate={{ scaleX: [0.95, 1.05, 0.95], opacity: [0.4, 0.6, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                 <motion.div
                  className="absolute top-36 -left-60 w-[600px] h-6 bg-gradient-to-l from-white/60 via-white/20 to-transparent blur-lg rounded-full origin-right"
                  animate={{ scaleX: [0.95, 1.05, 0.95], opacity: [0.4, 0.6, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />

                {/* --- FAR WING (Port/Left) --- */}
                {/* Moved forward to center-body. Swept BACK (Left). */}
                <div className="absolute -top-12 left-32 z-0">
                  <div className="w-64 h-24 bg-gradient-to-br from-slate-400 to-slate-500 origin-bottom-left transform skew-x-[40deg] rounded-sm shadow-md" 
                       style={{ clipPath: 'polygon(20% 0, 100% 20%, 80% 100%, 0% 100%)' }} />
                   {/* Far Engine Peeking Out */}
                   <div className="absolute bottom-4 left-24 w-20 h-10 bg-slate-600 rounded-full skew-x-[-20deg]" />
                </div>
                
                {/* --- TAIL SECTION --- */}
                <div className="absolute -top-28 left-4 z-10">
                   {/* Vertical Stabilizer */}
                   <div className="w-32 h-44 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-t-xl shadow-lg origin-bottom-left transform skew-x-[25deg]" 
                        style={{ clipPath: 'polygon(35% 0, 100% 0, 75% 100%, 0% 100%)' }}>
                        <div className="absolute top-10 right-8 w-12 h-12 rounded-full border-[4px] border-white/20 flex items-center justify-center">
                           <span className="text-white/40 text-xs font-bold">ERAS</span>
                        </div>
                   </div>
                   {/* Horizontal Stabilizer */}
                   <div className="absolute bottom-6 -left-4 w-28 h-8 bg-slate-400 skew-x-[35deg] -rotate-3 rounded-sm shadow-md" />
                </div>

                {/* --- FUSELAGE --- */}
                <div className="relative z-20">
                    <div className="w-[420px] h-32 bg-gradient-to-b from-white via-slate-50 to-slate-300 rounded-[30px_160px_160px_40px] shadow-2xl overflow-hidden border-b border-slate-400/50 flex items-center relative">
                        {/* Nose Cone Shading */}
                        <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-slate-200/40 to-transparent pointer-events-none" />

                        {/* Distinct Cockpit */}
                        <div className="absolute top-8 right-16 w-20 h-8 z-30 flex">
                            <div className="w-8 h-full bg-slate-800 rounded-l-sm border-r border-slate-600 skew-x-[-15deg]" />
                            <div className="w-12 h-full bg-slate-800 rounded-r-[10px] skew-x-[-15deg]" />
                            <div className="absolute top-1 left-2 w-12 h-2 bg-white/40 rounded-full skew-x-[-15deg] blur-[1px]" />
                        </div>

                        {/* Passenger Windows */}
                        <div className="absolute top-16 left-48 right-56 h-4 flex justify-between px-1 opacity-80">
                            {[...Array(16)].map((_, i) => (
                                <div key={i} className="w-3 h-4 bg-slate-800 rounded-[2px]" />
                            ))}
                        </div>

                        {/* Livery */}
                        <div className="absolute top-[60%] left-0 w-full h-5 bg-gradient-to-r from-blue-800 via-indigo-600 to-transparent opacity-90" />
                        <div className="absolute top-[60%] left-0 w-full h-[2px] bg-yellow-400 mt-5" />
                        
                        {/* Specular Highlight */}
                        <div className="absolute top-4 left-10 right-40 h-10 bg-gradient-to-b from-white to-transparent rounded-full opacity-30 blur-[4px]" />
                        
                        {/* Door Outlines */}
                        <div className="absolute top-10 left-40 w-[2px] h-16 bg-slate-400/40" />
                        <div className="absolute top-10 right-60 w-[2px] h-16 bg-slate-400/40" />
                    </div>
                    {/* Tail Cone */}
                    <div className="absolute top-4 -left-12 w-24 h-24 bg-gradient-to-b from-slate-100 to-slate-300 transform skew-x-[15deg] rounded-l-[60px] -z-10 scale-y-75" />
                </div>

                {/* --- NEAR WING (Starboard/Right) --- */}
                {/* MOVED FORWARD and SWEPT BACK CORRECTLY */}
                {/* Wing root at ~160px from tail (Left). */}
                <div className="absolute top-20 left-44 z-30">
                   {/* Main Wing Surface - Swept BACK (Negative Skew) */}
                   <div className="w-72 h-28 bg-gradient-to-tr from-slate-200 via-slate-300 to-slate-400 shadow-[0_15px_30px_rgba(0,0,0,0.3)] origin-top-left transform -skew-x-[30deg] rotate-6 rounded-bl-[80px] border-l border-white/40"
                        style={{ clipPath: 'polygon(0 0, 100% 10%, 85% 100%, 10% 100%)' }}>
                        {/* Flap Dividers */}
                        <div className="absolute bottom-0 left-20 w-1 h-8 bg-slate-400/30" />
                        <div className="absolute bottom-0 left-40 w-1 h-8 bg-slate-400/30" />
                   </div>
                   
                   {/* Winglet */}
                   <div className="absolute -bottom-4 -left-6 w-6 h-20 bg-blue-800 transform skew-x-[30deg] -translate-y-4 rounded-t-[8px] shadow-md" />
                </div>

                {/* --- NEAR ENGINE (Starboard) --- */}
                {/* Located under the wing, forward of the main wing body */}
                <div className="absolute top-32 left-64 z-40 transform rotate-2">
                   {/* Pylon */}
                   <div className="absolute -top-6 left-10 w-10 h-10 bg-slate-400 -skew-x-[20deg]" />
                   
                   {/* Nacelle - Large High-Bypass */}
                   <div className="w-28 h-16 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-500 rounded-[12px_24px_24px_12px] shadow-xl border border-slate-400/50 relative overflow-hidden">
                      {/* Intake Ring */}
                      <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-b from-slate-300 via-slate-100 to-slate-400 border-l border-slate-400" />
                      {/* Fan Blades (Hint) */}
                      <div className="absolute right-1.5 top-1.5 bottom-1.5 w-4 bg-slate-800 blur-[1px] rounded-l-md" />
                      {/* Spinner Spiral */}
                      <div className="absolute top-1/2 right-3 w-2 h-2 bg-white/50 rounded-full blur-[0.5px] -translate-y-1/2" />
                   </div>
                   {/* Exhaust Cone */}
                   <div className="absolute top-1/2 -left-4 w-8 h-10 bg-slate-700 -translate-y-1/2 rounded-l-full -z-10" />
                </div>

                {/* --- LIGHTS --- */}
                {/* Wingtip Green */}
                <motion.div 
                    className="absolute bottom-0 left-44 z-50 w-3 h-3 bg-green-500 rounded-full shadow-[0_0_15px_#22c55e]"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
                {/* Beacon Red (Top) */}
                <motion.div 
                    className="absolute -top-2 left-52 z-30 w-3 h-3 bg-red-600 rounded-full shadow-[0_0_15px_#dc2626]"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1, repeat: Infinity }}
                />
                {/* Strobe Tail */}
                <motion.div 
                    className="absolute -top-24 left-10 z-30 w-2 h-2 bg-white rounded-full shadow-[0_0_20px_white]"
                    animate={{ opacity: [0, 0, 1, 0, 0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.8, 0.85, 0.9, 0.95, 0.98, 1] }}
                />
              </div>
            </motion.div>
          </div>
        );

      case 'spacex-starship':
        return (
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute"
              initial={{ left: '-10%', top: '80%', rotate: 45 }}
              animate={{ left: '110%', top: '-5%' }}
              transition={{ duration: 5, repeat: Infinity, ease: [0.2, 0, 0.3, 1] }}
            >
              <div className="relative" style={{ transform: 'scale(1.5)' }}>
                {/* Shock diamonds / atmospheric compression */}
                <motion.div
                  className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full"
                  style={{ 
                    background: 'radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, rgba(249, 115, 22, 0.15) 30%, transparent 60%)',
                    filter: 'blur(8px)'
                  }}
                  animate={{ scale: [1.2, 1.6, 1.2], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />

                {/* Nosecone - more prominent */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                  <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[16px] border-l-transparent border-r-transparent border-b-slate-200"
                       style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                  {/* Nosecone tip highlight */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-2 bg-gradient-to-b from-white to-transparent opacity-60" />
                </div>
                
                {/* Main body - LARGER with heat shield tiles */}
                <div className="relative w-16 h-32 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 shadow-2xl overflow-hidden" 
                     style={{ 
                       borderRadius: '3px 3px 12px 12px',
                       boxShadow: '0 8px 24px rgba(0,0,0,0.4), inset -2px 0 8px rgba(0,0,0,0.2)'
                     }}>
                  {/* Heat shield tile pattern - more detailed */}
                  <div className="absolute inset-0 opacity-40">
                    {[...Array(12)].map((_, row) => (
                      <div key={row} className="flex gap-px" style={{ marginBottom: '0.5px' }}>
                        {[...Array(5)].map((_, col) => (
                          <div key={col} className="flex-1 h-2.5 border border-slate-500/30 bg-gradient-to-br from-slate-300/10 to-transparent" />
                        ))}
                      </div>
                    ))}
                  </div>
                  
                  {/* Forward flaps */}
                  <div className="absolute top-16 -left-2 w-6 h-4 bg-gradient-to-l from-slate-400 to-slate-300 origin-right"
                       style={{ 
                         transform: 'skewY(-15deg)',
                         boxShadow: '-2px 2px 4px rgba(0,0,0,0.3)'
                       }} />
                  <div className="absolute top-16 -right-2 w-6 h-4 bg-gradient-to-r from-slate-400 to-slate-300 origin-left"
                       style={{ 
                         transform: 'skewY(15deg)',
                         boxShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                       }} />
                  
                  {/* Viewports/Windows - glowing */}
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col gap-2">
                    {[...Array(4)].map((_, i) => (
                      <motion.div 
                        key={i} 
                        className="w-10 h-2 bg-gradient-to-b from-cyan-300 via-blue-400 to-blue-600 rounded-sm shadow-lg"
                        style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.6), inset 0 1px 0 rgba(255,255,255,0.3)' }}
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                      />
                    ))}
                  </div>
                  
                  {/* SpaceX logo */}
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-12 h-6 flex items-center justify-center">
                    <div className="text-[10px] font-bold text-slate-600/50 tracking-wider">SpaceX</div>
                  </div>

                  {/* Body highlight/reflection */}
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                </div>

                {/* Aft flaps / Grid fins */}
                <div className="absolute bottom-8 -left-4 w-6 h-8 bg-slate-400/90 grid grid-cols-2 grid-rows-4 gap-px border-2 border-slate-600/60 shadow-xl"
                     style={{ boxShadow: '-3px 3px 6px rgba(0,0,0,0.4)' }} />
                <div className="absolute bottom-8 -right-4 w-6 h-8 bg-slate-400/90 grid grid-cols-2 grid-rows-4 gap-px border-2 border-slate-600/60 shadow-xl"
                     style={{ boxShadow: '3px 3px 6px rgba(0,0,0,0.4)' }} />

                {/* Raptor engine nozzles - 33 engines! (showing 9 visible) */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 grid grid-cols-3 gap-1">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="relative">
                      {/* Engine bell */}
                      <div className="w-4 h-4 rounded-full bg-gradient-to-b from-slate-600 via-slate-700 to-slate-900 border-2 border-slate-800"
                           style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)' }} />
                      {/* Individual engine plume */}
                      <motion.div
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-5 h-8 rounded-b-full"
                        style={{ 
                          background: 'radial-gradient(ellipse at top, #fbbf24 0%, #fb923c 25%, #f97316 40%, #3b82f6 65%, transparent 95%)',
                          filter: 'blur(1.5px)',
                          mixBlendMode: 'screen'
                        }}
                        animate={{ 
                          scale: [0.9, 1.4, 0.9], 
                          opacity: [0.7, 1, 0.7],
                          scaleY: [1, 1.8, 1]
                        }}
                        transition={{ duration: 0.15, repeat: Infinity, delay: i * 0.02 }}
                      />
                    </div>
                  ))}
                </div>

                {/* MASSIVE main engine plume */}
                <motion.div
                  className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full"
                  style={{ 
                    background: 'radial-gradient(ellipse at top, #fef08a 0%, #fbbf24 15%, #fb923c 25%, #f97316 35%, #3b82f6 50%, #6366f1 65%, transparent 85%)',
                    filter: 'blur(6px)',
                    mixBlendMode: 'screen'
                  }}
                  animate={{ 
                    scale: [1.1, 1.6, 1.1], 
                    opacity: [0.8, 1, 0.8],
                    scaleY: [1, 2, 1]
                  }}
                  transition={{ duration: 0.4, repeat: Infinity }}
                />

                {/* Supersonic shock wave */}
                <motion.div
                  className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-48 h-2 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  style={{ filter: 'blur(2px)' }}
                  animate={{ scaleX: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                />

                {/* Exhaust trail with turbulence */}
                <motion.div
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3 h-64 bg-gradient-to-t from-transparent via-orange-500/40 to-transparent"
                  style={{ filter: 'blur(4px)', rotate: '35deg', transformOrigin: 'top' }}
                  animate={{ opacity: [0.4, 0.7, 0.4], scaleY: [0.9, 1.3, 0.9], scaleX: [1, 1.2, 1] }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                />
                
                {/* Secondary exhaust particles */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-orange-400/60"
                    style={{ filter: 'blur(2px)', left: `${50 + (i - 2) * 10}%` }}
                    animate={{ 
                      y: [0, -40, -80],
                      x: [(i - 2) * 5, (i - 2) * 10, (i - 2) * 15],
                      opacity: [0.8, 0.4, 0],
                      scale: [1, 0.7, 0.3]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2, ease: 'easeOut' }}
                  />
                ))}

                {/* Heat shimmer effect */}
                <motion.div
                  className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-24 h-16 rounded-full bg-gradient-to-t from-orange-300/20 to-transparent"
                  style={{ filter: 'blur(6px)' }}
                  animate={{ scaleX: [1, 1.3, 1], scaleY: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 0.25, repeat: Infinity }}
                />
              </div>
            </motion.div>
          </div>
        );

      case 'space-station':
        return (
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute"
              style={{ top: '20%' }}
              initial={{ x: '-20%', rotate: 0 }}
              animate={{ x: '120%' }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            >
              <div className="relative" style={{ transform: 'scale(0.35) rotate(15deg)' }}>
                {/* --- INTEGRATED TRUSS STRUCTURE (Main Backbone) --- */}
                <div className="relative w-[500px] h-4 bg-gradient-to-b from-slate-500 via-slate-400 to-slate-600 shadow-xl z-20 rounded-sm">
                   {/* Truss detail lines */}
                   <div className="absolute inset-0 border-y border-slate-700/50 flex justify-between px-2">
                      {[...Array(10)].map((_, i) => <div key={i} className="w-px h-full bg-slate-700/30" />)}
                   </div>
                </div>

                {/* --- SOLAR ARRAYS (8 Giant Wings) --- */}
                {/* Left Side (Port) */}
                <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col gap-12 z-10">
                   {/* Upper Wings */}
                   <div className="flex flex-col gap-2 -mt-32">
                      {[0, 1].map(i => (
                        <div key={i} className="w-16 h-32 bg-gradient-to-b from-amber-700 via-amber-500 to-amber-800 border border-amber-900/60 shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:10px_10px]" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 to-transparent mix-blend-overlay" />
                        </div>
                      ))}
                   </div>
                   {/* Lower Wings */}
                   <div className="flex flex-col gap-2 mt-8">
                      {[0, 1].map(i => (
                        <div key={i} className="w-16 h-32 bg-gradient-to-b from-amber-700 via-amber-500 to-amber-800 border border-amber-900/60 shadow-2xl relative overflow-hidden">
                             <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:10px_10px]" />
                             <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 to-transparent mix-blend-overlay" />
                        </div>
                      ))}
                   </div>
                </div>

                {/* Right Side (Starboard) */}
                <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col gap-12 z-10">
                   {/* Upper Wings */}
                   <div className="flex flex-col gap-2 -mt-32">
                      {[0, 1].map(i => (
                        <div key={i} className="w-16 h-32 bg-gradient-to-b from-amber-700 via-amber-500 to-amber-800 border border-amber-900/60 shadow-2xl relative overflow-hidden">
                             <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:10px_10px]" />
                             <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 to-transparent mix-blend-overlay" />
                        </div>
                      ))}
                   </div>
                   {/* Lower Wings */}
                   <div className="flex flex-col gap-2 mt-8">
                      {[0, 1].map(i => (
                        <div key={i} className="w-16 h-32 bg-gradient-to-b from-amber-700 via-amber-500 to-amber-800 border border-amber-900/60 shadow-2xl relative overflow-hidden">
                             <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:10px_10px]" />
                             <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 to-transparent mix-blend-overlay" />
                        </div>
                      ))}
                   </div>
                </div>

                {/* --- RADIATORS (Heat dissipation) --- */}
                <div className="absolute top-1/2 left-32 -translate-y-1/2 -z-10 transform -skew-x-12 opacity-90">
                    <div className="w-24 h-12 bg-slate-200 border border-slate-300 shadow-lg mb-16" />
                </div>
                 <div className="absolute top-1/2 right-32 -translate-y-1/2 -z-10 transform skew-x-12 opacity-90">
                    <div className="w-24 h-12 bg-slate-200 border border-slate-300 shadow-lg mb-16" />
                </div>

                {/* --- PRESSURIZED MODULES (Center Cluster) --- */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 flex flex-col items-center z-30">
                    {/* Harmony Node (Top) */}
                    <div className="w-12 h-12 bg-gradient-to-r from-slate-100 to-slate-300 rounded-sm shadow-md border border-slate-400 relative">
                        {/* Kibo (Left) */}
                        <div className="absolute top-1 -left-8 w-8 h-8 bg-white rounded-l border border-slate-300 flex items-center justify-center">
                            <div className="w-1 h-1 bg-blue-400 rounded-full" />
                        </div>
                        {/* Columbus (Right) */}
                        <div className="absolute top-2 -right-6 w-6 h-6 bg-white rounded-r border border-slate-300" />
                    </div>
                    
                    {/* Destiny Lab (Middle) */}
                    <div className="w-10 h-16 bg-gradient-to-b from-slate-200 to-slate-300 border-x border-slate-400" />
                    
                    {/* Unity Node */}
                    <div className="w-10 h-10 bg-slate-200 border border-slate-400" />
                    
                    {/* Zarya (FGB) - Russian Segment Start */}
                    <div className="w-10 h-16 bg-gradient-to-b from-stone-200 to-stone-400 border border-stone-500 flex flex-col justify-evenly">
                         <div className="w-full h-px bg-stone-500" />
                         <div className="w-full h-px bg-stone-500" />
                    </div>
                    
                    {/* Zvezda Service Module */}
                    <div className="relative w-12 h-16 bg-gradient-to-b from-stone-300 to-stone-400 rounded-b-xl border border-stone-500 shadow-lg">
                        {/* Zvezda Solar Panels */}
                        <div className="absolute top-2 -left-8 w-8 h-16 bg-stone-200 skew-y-12 border border-stone-400 opacity-80" />
                        <div className="absolute top-2 -right-8 w-8 h-16 bg-stone-200 -skew-y-12 border border-stone-400 opacity-80" />
                        
                        {/* Docked Soyuz */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full flex flex-col items-center">
                            <div className="w-5 h-5 bg-stone-400 rounded-full shadow-md z-10" />
                            <div className="w-6 h-6 bg-stone-500 rounded-b-xl -mt-1 shadow-lg" />
                            {/* Soyuz panels */}
                            <div className="absolute top-3 w-16 h-1 bg-stone-600" />
                        </div>
                    </div>
                </div>

                {/* --- BEACONS --- */}
                <motion.div 
                    className="absolute -top-4 left-4 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_red]"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div 
                    className="absolute -bottom-4 right-4 w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_green]"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}
                />
              </div>
            </motion.div>
          </div>
        );

      case 'star-birth':
        return (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <motion.div
              className="absolute w-8 h-8 rounded-full"
              style={{
                background: 'radial-gradient(circle, #fef08a, #fbbf24, transparent)',
                boxShadow: '0 0 40px #fbbf24'
              }}
              animate={{
                scale: [0, 1.5, 1],
                opacity: [0, 1, 0.8]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeOut'
              }}
            />
          </div>
        );

      case 'cosmic-vortex':
        return (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-20 origin-bottom"
                style={{
                  background: `linear-gradient(to top, ${effect.colors[i % effect.colors.length]}, transparent)`,
                  left: '50%',
                  top: '50%'
                }}
                animate={{
                  rotate: [i * 30, i * 30 + 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            ))}
          </div>
        );

      case 'space-lightning':
        return (
          <div className="absolute inset-0 overflow-hidden">
            {/* Dramatic diagonal lightning bolt */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <motion.path
                d="M 10,10 L 25,35 L 20,35 L 40,60 L 35,60 L 55,85 L 50,85 L 75,95"
                stroke="#8b5cf6"
                strokeWidth="2"
                fill="none"
                filter="url(#lightning-preview-glow)"
                animate={{
                  pathLength: [0, 1, 1, 0],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 2,
                  times: [0, 0.2, 0.7, 1]
                }}
              />
              <motion.path
                d="M 10,10 L 25,35 L 20,35 L 40,60 L 35,60 L 55,85 L 50,85 L 75,95"
                stroke="#ffffff"
                strokeWidth="1"
                fill="none"
                animate={{
                  pathLength: [0, 1, 1, 0],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 2,
                  times: [0, 0.2, 0.7, 1]
                }}
              />
              <defs>
                <filter id="lightning-preview-glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
            </svg>
            {/* Flash effect */}
            <motion.div
              className="absolute inset-0 bg-purple-500/20"
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{
                duration: 0.2,
                repeat: Infinity,
                repeatDelay: 2.3
              }}
            />
          </div>
        );

      case 'wormhole':
        return (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border-2"
                style={{
                  width: 20 + i * 20 + 'px',
                  height: 20 + i * 20 + 'px',
                  borderColor: effect.colors[i % effect.colors.length]
                }}
                animate={{
                  scale: [1, 1.5],
                  opacity: [0.8, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: 'easeOut'
                }}
              />
            ))}
          </div>
        );

      case 'crystal-formation':
        return (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-12 origin-bottom"
                style={{
                  background: `linear-gradient(to top, ${effect.colors[i % effect.colors.length]}, transparent)`,
                  rotate: i * 45 + 'deg',
                  filter: 'blur(1px)'
                }}
                animate={{
                  scaleY: [0, 1],
                  opacity: [0, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        );

      case 'stardust-explosion':
        return (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {[...Array(30)].map((_, i) => {
              const angle = (i / 30) * Math.PI * 2;
              return (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-yellow-300"
                  style={{
                    left: '50%',
                    top: '50%'
                  }}
                  animate={{
                    x: [0, Math.cos(angle) * 80],
                    y: [0, Math.sin(angle) * 80],
                    opacity: [1, 0],
                    scale: [1, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                    ease: 'easeOut'
                  }}
                />
              );
            })}
          </div>
        );

      case 'planet-transit':
        return (
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute w-16 h-16 rounded-full"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${effect.colors[0]}, ${effect.colors[2]})`,
                boxShadow: `0 0 20px ${effect.colors[1]}`
              }}
              animate={{
                x: [-80, 280]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          </div>
        );

      case 'ufo-streak':
        return (
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute"
              animate={{
                x: [0, 100, 50, 200, -50, 100],
                y: [20, 80, 40, 100, 10, 60]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <div className="relative">
                {/* Classic flying saucer dome */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-8 h-3 rounded-t-full bg-gradient-to-b from-emerald-300 via-emerald-400 to-emerald-500"
                     style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.6)' }} />
                
                {/* Main saucer disc */}
                <div className="relative w-12 h-2 rounded-full bg-gradient-to-b from-emerald-400 via-green-500 to-emerald-600 shadow-xl"
                     style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.8), inset 0 1px 2px rgba(255,255,255,0.3)' }}>
                  
                  {/* Dome windows */}
                  <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <motion.div 
                        key={i} 
                        className="w-1 h-1 rounded-full bg-cyan-300"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                  
                  {/* Edge lights around the disc */}
                  <div className="absolute inset-0 flex items-center justify-around">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-0.5 h-0.5 rounded-full bg-lime-300"
                        style={{
                          position: 'absolute',
                          left: `${12.5 + i * 12.5}%`,
                          top: '50%'
                        }}
                        animate={{ 
                          opacity: [0.3, 1, 0.3],
                          scale: [0.8, 1.2, 0.8]
                        }}
                        transition={{ 
                          duration: 0.6, 
                          repeat: Infinity, 
                          delay: i * 0.075 
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Tractor beam / propulsion glow */}
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 top-1 w-6 h-8 rounded-b-full"
                  style={{
                    background: 'radial-gradient(ellipse at top, rgba(16, 185, 129, 0.6) 0%, rgba(34, 197, 94, 0.3) 40%, transparent 70%)',
                    filter: 'blur(2px)'
                  }}
                  animate={{
                    opacity: [0.4, 0.8, 0.4],
                    scaleY: [0.8, 1.2, 0.8]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity
                  }}
                />
                
                {/* Mysterious energy trail */}
                <motion.div
                  className="absolute right-full top-0 h-1 w-16 bg-gradient-to-r from-transparent via-green-400 to-transparent rounded-full"
                  style={{ filter: 'blur(1px)' }}
                  animate={{ 
                    opacity: [0.2, 0.6, 0.2],
                    scaleX: [0.8, 1.2, 0.8]
                  }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              </div>
            </motion.div>
          </div>
        );

      case 'cosmic-ray-burst':
        return (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-0.5 h-20 origin-center"
                style={{
                  background: `linear-gradient(to top, ${effect.colors[i % effect.colors.length]}, transparent)`,
                  rotate: i * 22.5 + 'deg'
                }}
                animate={{
                  scaleY: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  repeatDelay: 1.5,
                  delay: i * 0.05
                }}
              />
            ))}
          </div>
        );

      default:
        return (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500">
            {effect.icon}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Cosmic Effects Library
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {cosmicEffects.length} effects across {categories.length - 1} categories
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={filterCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory(cat)}
            className={filterCategory === cat ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Button>
        ))}
      </div>

      {/* Effects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEffects.map(effect => (
          <Card
            key={effect.id}
            className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer overflow-hidden group"
            onClick={() => setSelectedEffect(effect)}
          >
            {/* Preview Area */}
            <div 
              className="relative h-32 overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${effect.colors[0]}15, ${effect.colors[effect.colors.length - 1]}15)`
              }}
            >
              {renderEffectPreview(effect)}
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-8 h-8 text-white" />
              </div>
            </div>

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  {effect.icon}
                  {effect.name}
                </CardTitle>
                {effect.rarity && (
                  <Badge className={`bg-gradient-to-r ${getRarityColor(effect.rarity)} text-white border-0 text-xs`}>
                    {effect.rarity}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-slate-400 text-sm">
                {effect.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center gap-1">
                {effect.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Modal */}
      <Dialog open={selectedEffect !== null} onOpenChange={() => setSelectedEffect(null)}>
        {selectedEffect && (
          <DialogContent className="max-w-3xl bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white text-xl flex items-center gap-2">
                {selectedEffect.icon}
                {selectedEffect.name}
                {selectedEffect.rarity && (
                  <Badge className={`bg-gradient-to-r ${getRarityColor(selectedEffect.rarity)} text-white border-0`}>
                    {selectedEffect.rarity}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {selectedEffect.description}
              </DialogDescription>
            </DialogHeader>

            {/* Large Preview */}
            <div 
              className="relative h-64 rounded-lg overflow-hidden border border-slate-700"
              style={{
                background: `linear-gradient(135deg, ${selectedEffect.colors[0]}20, ${selectedEffect.colors[selectedEffect.colors.length - 1]}20)`
              }}
            >
              {renderEffectPreview(selectedEffect)}
            </div>

            {/* Effect Info */}
            <div className="space-y-4">
              <div>
                <h4 className="text-white text-sm mb-2">Category</h4>
                <Badge variant="outline" className="text-slate-300">
                  {selectedEffect.category}
                </Badge>
              </div>

              <div>
                <h4 className="text-white text-sm mb-2">Color Palette</h4>
                <div className="flex items-center gap-2">
                  {selectedEffect.colors.map((color, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border border-white/20"
                        style={{ backgroundColor: color }}
                      />
                      <code className="text-xs text-slate-400">{color}</code>
                    </div>
                  ))}
                </div>
              </div>

              {selectedEffect.id === 'supernova' && (
                <div className="pt-4">
                  <Button
                    onClick={() => {
                      setIsPlaying(false);
                      setTimeout(() => setIsPlaying(true), 50);
                    }}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Trigger Explosion
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
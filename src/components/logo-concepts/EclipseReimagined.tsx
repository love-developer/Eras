import React, { useState } from 'react';
import { motion } from 'motion/react';

interface EclipseReimaginedProps {
  size?: number;
  isOpen?: boolean;
  onToggle?: () => void;
  colorScheme?: 'celestial' | 'monochrome' | 'cosmic' | 'bronze';
  autoAnimate?: boolean;
}

const colorSchemes = {
  celestial: {
    leftBody: '#D97706', // Warm bronze (past)
    rightBody: '#E2E8F0', // Cool silver (future)
    portal: '#0C4A6E', // Deep space blue
    trail: '#FFFFFF',
  },
  monochrome: {
    leftBody: '#71717A', // Medium gray
    rightBody: '#F4F4F5', // Light gray
    portal: '#18181B', // Near black
    trail: '#A1A1AA',
  },
  cosmic: {
    leftBody: '#7C3AED', // Purple
    rightBody: '#06B6D4', // Cyan
    portal: '#1E1B4B', // Deep indigo
    trail: '#C4B5FD',
  },
  bronze: {
    leftBody: '#B45309', // Deep bronze
    rightBody: '#FDE68A', // Light gold
    portal: '#064E3B', // Deep emerald
    trail: '#FEF3C7',
  },
};

export function EclipseReimagined({ 
  size = 200, 
  isOpen: controlledIsOpen,
  onToggle,
  colorScheme = 'celestial',
  autoAnimate = false
}: EclipseReimaginedProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  
  const colors = colorSchemes[colorScheme];
  
  React.useEffect(() => {
    if (autoAnimate) {
      const interval = setInterval(() => {
        setInternalIsOpen(prev => !prev);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [autoAnimate]);
  
  const handleClick = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!isOpen);
    }
  };

  const bodyRadius = size * 0.22;
  const centerX = size / 2;
  const centerY = size / 2;

  return (
    <div 
      className="relative cursor-pointer"
      style={{ width: size, height: size }}
      onClick={handleClick}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {/* Portal/Gravitational lens effect in center */}
        <defs>
          <radialGradient id={`portal-gradient-${colorScheme}`}>
            <stop offset="0%" stopColor={colors.portal} stopOpacity="0.8" />
            <stop offset="50%" stopColor={colors.portal} stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          
          {/* Texture pattern for left body (past - has history) */}
          <pattern id={`texture-${colorScheme}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1.5" fill="#000000" opacity="0.15" />
            <circle cx="5" cy="15" r="1" fill="#000000" opacity="0.1" />
            <circle cx="15" cy="5" r="1.2" fill="#000000" opacity="0.12" />
          </pattern>
        </defs>

        {/* Portal glow - pulses when opening */}
        <motion.circle
          cx={centerX}
          cy={centerY}
          r={bodyRadius * 1.2}
          fill={`url(#portal-gradient-${colorScheme})`}
          initial={false}
          animate={{
            scale: isOpen ? 2.5 : 0.5,
            opacity: isOpen ? 0.6 : 0,
          }}
          transition={{ 
            duration: 1.5,
            ease: [0.4, 0.0, 0.2, 1],
          }}
        />

        {/* Event horizon ring (bright rim) */}
        <motion.circle
          cx={centerX}
          cy={centerY}
          r={bodyRadius * 0.9}
          fill="none"
          stroke={colors.trail}
          strokeWidth={2}
          initial={false}
          animate={{
            opacity: isOpen ? 1 : 0,
            scale: isOpen ? 1 : 0.5,
          }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />

        {/* LEFT CELESTIAL BODY (Past) with orbital trail */}
        <motion.g
          initial={false}
          animate={{
            translateX: isOpen ? -size * 0.35 : 0,
            translateY: isOpen ? -size * 0.05 : 0,
            rotate: isOpen ? -30 : 0,
          }}
          transition={{
            duration: 1.5,
            ease: [0.4, 0.0, 0.2, 1], // Astronomical ease
          }}
          style={{
            originX: `${centerX}px`,
            originY: `${centerY}px`,
          }}
        >
          {/* Orbital trail */}
          {isOpen && (
            <motion.path
              d={`M ${centerX} ${centerY} Q ${centerX - size * 0.15} ${centerY - size * 0.08} ${centerX - size * 0.35} ${centerY - size * 0.05}`}
              fill="none"
              stroke={colors.trail}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          )}
          
          {/* Past body - textured */}
          <circle
            cx={centerX}
            cy={centerY}
            r={bodyRadius}
            fill={colors.leftBody}
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={bodyRadius}
            fill={`url(#texture-${colorScheme})`}
          />
          {/* Highlight on past body */}
          <circle
            cx={centerX - bodyRadius * 0.3}
            cy={centerY - bodyRadius * 0.3}
            r={bodyRadius * 0.35}
            fill="#FFFFFF"
            opacity={0.2}
          />
        </motion.g>

        {/* RIGHT CELESTIAL BODY (Future) with orbital trail */}
        <motion.g
          initial={false}
          animate={{
            translateX: isOpen ? size * 0.35 : 0,
            translateY: isOpen ? size * 0.05 : 0,
            rotate: isOpen ? 30 : 0,
          }}
          transition={{
            duration: 1.5,
            ease: [0.4, 0.0, 0.2, 1],
          }}
          style={{
            originX: `${centerX}px`,
            originY: `${centerY}px`,
          }}
        >
          {/* Orbital trail */}
          {isOpen && (
            <motion.path
              d={`M ${centerX} ${centerY} Q ${centerX + size * 0.15} ${centerY + size * 0.08} ${centerX + size * 0.35} ${centerY + size * 0.05}`}
              fill="none"
              stroke={colors.trail}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          )}
          
          {/* Future body - smooth gradient (mobile: solid with opacity layers) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={bodyRadius}
            fill={colors.rightBody}
          />
          {/* Layered circles for pseudo-gradient effect (mobile-safe) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={bodyRadius * 0.8}
            fill={colors.rightBody}
            opacity={0.8}
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={bodyRadius * 0.6}
            fill={colors.rightBody}
            opacity={0.6}
          />
          {/* Bright highlight on future body */}
          <circle
            cx={centerX + bodyRadius * 0.25}
            cy={centerY - bodyRadius * 0.25}
            r={bodyRadius * 0.4}
            fill="#FFFFFF"
            opacity={0.4}
          />
        </motion.g>

        {/* Ripple effect in portal when open */}
        {isOpen && (
          <>
            <motion.circle
              cx={centerX}
              cy={centerY}
              r={bodyRadius * 0.6}
              fill="none"
              stroke={colors.trail}
              strokeWidth={1}
              initial={{ scale: 0.5, opacity: 0.6 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeOut" 
              }}
            />
            <motion.circle
              cx={centerX}
              cy={centerY}
              r={bodyRadius * 0.6}
              fill="none"
              stroke={colors.trail}
              strokeWidth={1}
              initial={{ scale: 0.5, opacity: 0.6 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.5
              }}
            />
          </>
        )}
      </svg>
    </div>
  );
}

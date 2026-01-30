import React, { useState } from 'react';
import { motion } from 'motion/react';

interface ChrysalisProps {
  size?: number;
  isOpen?: boolean;
  onToggle?: () => void;
  colorScheme?: 'forest' | 'plum' | 'sage' | 'midnight';
  autoAnimate?: boolean;
}

const colorSchemes = {
  forest: {
    primary: '#14532D',
    accent: '#D1FAE5',
    glow: '#6EE7B7',
  },
  plum: {
    primary: '#581C87',
    accent: '#E9D5FF',
    glow: '#C084FC',
  },
  sage: {
    primary: '#365314',
    accent: '#D9F99D',
    glow: '#A3E635',
  },
  midnight: {
    primary: '#1E1B4B',
    accent: '#DDD6FE',
    glow: '#A78BFA',
  },
};

export function Chrysalis({ 
  size = 200, 
  isOpen: controlledIsOpen,
  onToggle,
  colorScheme = 'forest',
  autoAnimate = false
}: ChrysalisProps) {
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

  const segments = 8; // Number of chrysalis segments
  const centerX = size / 2;
  const centerY = size / 2;
  const width = size * 0.45;
  const height = size * 0.85;

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
        {/* Center glow - intensifies when opening */}
        <motion.ellipse
          cx={centerX}
          cy={centerY}
          rx={width * 0.3}
          ry={height * 0.15}
          fill={colors.glow}
          initial={false}
          animate={{
            opacity: isOpen ? 0.4 : 0,
            scale: isOpen ? 1.5 : 0.5,
          }}
          transition={{ duration: 1.3, ease: [0.4, 0.0, 0.2, 1] }}
        />

        {/* Breathing pulse when closed */}
        {!isOpen && (
          <motion.ellipse
            cx={centerX}
            cy={centerY}
            rx={width}
            ry={height}
            fill="none"
            stroke={colors.accent}
            strokeWidth={1}
            opacity={0.3}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Left side segments */}
        {Array.from({ length: segments }).map((_, i) => {
          const segmentHeight = height / segments;
          const yPos = centerY - height / 2 + i * segmentHeight;
          
          // Create organic curve for each segment
          const curvature = Math.sin((i / segments) * Math.PI) * width * 0.5;
          const topCurve = Math.sin((i / segments) * Math.PI) * width * 0.5;
          const bottomCurve = Math.sin(((i + 1) / segments) * Math.PI) * width * 0.5;
          
          const path = `
            M ${centerX} ${yPos}
            Q ${centerX - curvature * 0.7} ${yPos + segmentHeight * 0.5} ${centerX} ${yPos + segmentHeight}
          `;
          
          // Movement when opening - segments curl back like petals
          const rotateAngle = isOpen ? -60 - (i * 5) : 0;
          const translateX = isOpen ? -width * 0.8 : 0;
          const translateY = isOpen ? (i - segments / 2) * 5 : 0;

          return (
            <motion.g
              key={`left-${i}`}
              initial={false}
              animate={{
                translateX,
                translateY,
                rotate: rotateAngle,
              }}
              transition={{
                duration: 1.3,
                ease: [0.4, 0.0, 0.2, 1], // Organic ease
                delay: i * 0.04,
              }}
              style={{
                originX: `${centerX}px`,
                originY: `${yPos + segmentHeight / 2}px`,
              }}
            >
              <path
                d={path}
                fill="none"
                stroke={colors.primary}
                strokeWidth={8}
                strokeLinecap="round"
              />
              {/* Accent highlight on each segment */}
              <path
                d={path}
                fill="none"
                stroke={colors.accent}
                strokeWidth={2}
                strokeLinecap="round"
                opacity={0.6}
              />
            </motion.g>
          );
        })}

        {/* Right side segments (mirror of left) */}
        {Array.from({ length: segments }).map((_, i) => {
          const segmentHeight = height / segments;
          const yPos = centerY - height / 2 + i * segmentHeight;
          
          const curvature = Math.sin((i / segments) * Math.PI) * width * 0.5;
          
          const path = `
            M ${centerX} ${yPos}
            Q ${centerX + curvature * 0.7} ${yPos + segmentHeight * 0.5} ${centerX} ${yPos + segmentHeight}
          `;
          
          const rotateAngle = isOpen ? 60 + (i * 5) : 0;
          const translateX = isOpen ? width * 0.8 : 0;
          const translateY = isOpen ? (i - segments / 2) * 5 : 0;

          return (
            <motion.g
              key={`right-${i}`}
              initial={false}
              animate={{
                translateX,
                translateY,
                rotate: rotateAngle,
              }}
              transition={{
                duration: 1.3,
                ease: [0.4, 0.0, 0.2, 1],
                delay: i * 0.04,
              }}
              style={{
                originX: `${centerX}px`,
                originY: `${yPos + segmentHeight / 2}px`,
              }}
            >
              <path
                d={path}
                fill="none"
                stroke={colors.primary}
                strokeWidth={8}
                strokeLinecap="round"
              />
              <path
                d={path}
                fill="none"
                stroke={colors.accent}
                strokeWidth={2}
                strokeLinecap="round"
                opacity={0.6}
              />
            </motion.g>
          );
        })}

        {/* Top cap */}
        <motion.circle
          cx={centerX}
          cy={centerY - height / 2}
          r={8}
          fill={colors.primary}
          stroke={colors.accent}
          strokeWidth={2}
          initial={false}
          animate={{
            scale: isOpen ? 0.5 : 1,
            opacity: isOpen ? 0 : 1,
          }}
          transition={{ duration: 0.6 }}
        />

        {/* Bottom cap */}
        <motion.circle
          cx={centerX}
          cy={centerY + height / 2}
          r={8}
          fill={colors.primary}
          stroke={colors.accent}
          strokeWidth={2}
          initial={false}
          animate={{
            scale: isOpen ? 0.5 : 1,
            opacity: isOpen ? 0 : 1,
          }}
          transition={{ duration: 0.6 }}
        />
      </svg>
    </div>
  );
}

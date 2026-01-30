import React, { useState } from 'react';
import { motion } from 'motion/react';

interface MemoryVaultProps {
  size?: number;
  isOpen?: boolean;
  onToggle?: () => void;
  colorScheme?: 'charcoal' | 'navy' | 'platinum' | 'rose';
  autoAnimate?: boolean;
}

const colorSchemes = {
  charcoal: {
    primary: '#18181B',
    accent: '#F9A8D4',
    glow: '#FFFFFF',
  },
  navy: {
    primary: '#0C4A6E',
    accent: '#F8FAFC',
    glow: '#FFFFFF',
  },
  platinum: {
    primary: '#475569',
    accent: '#FCD34D',
    glow: '#FEF3C7',
  },
  rose: {
    primary: '#27272A',
    accent: '#FB7185',
    glow: '#FECDD3',
  },
};

export function MemoryVault({ 
  size = 200, 
  isOpen: controlledIsOpen,
  onToggle,
  colorScheme = 'charcoal',
  autoAnimate = false
}: MemoryVaultProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  
  const colors = colorSchemes[colorScheme];
  
  React.useEffect(() => {
    if (autoAnimate) {
      const interval = setInterval(() => {
        setInternalIsOpen(prev => !prev);
      }, 3000);
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

  const segments = 8;
  const segmentAngle = 360 / segments;
  const radius = size / 2;
  const innerRadius = radius * 0.3;
  const outerRadius = radius * 0.95;

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
        {/* Glow effect when opening */}
        {isOpen && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={innerRadius}
            fill={colors.glow}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.2, scale: 1 }}
            transition={{ duration: 0.4 }}
          />
        )}

        {/* 8 vault segments */}
        {Array.from({ length: segments }).map((_, i) => {
          const startAngle = (i * segmentAngle - 90) * (Math.PI / 180);
          const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180);
          
          const x1 = size / 2 + Math.cos(startAngle) * innerRadius;
          const y1 = size / 2 + Math.sin(startAngle) * innerRadius;
          const x2 = size / 2 + Math.cos(endAngle) * innerRadius;
          const y2 = size / 2 + Math.sin(endAngle) * innerRadius;
          const x3 = size / 2 + Math.cos(endAngle) * outerRadius;
          const y3 = size / 2 + Math.sin(endAngle) * outerRadius;
          const x4 = size / 2 + Math.cos(startAngle) * outerRadius;
          const y4 = size / 2 + Math.sin(startAngle) * outerRadius;

          const path = `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} Z`;
          
          // Calculate outward movement for open state
          const segmentCenterAngle = ((i + 0.5) * segmentAngle - 90) * (Math.PI / 180);
          const moveDistance = isOpen ? radius * 0.4 : 0;
          const translateX = Math.cos(segmentCenterAngle) * moveDistance;
          const translateY = Math.sin(segmentCenterAngle) * moveDistance;
          const rotateAngle = isOpen ? 15 : 0;

          return (
            <motion.g
              key={i}
              initial={false}
              animate={{
                translateX,
                translateY,
                rotate: rotateAngle,
              }}
              transition={{
                duration: 1.0,
                ease: [0.34, 1.56, 0.64, 1], // Spring ease
                delay: i * 0.03, // Cascade effect
              }}
              style={{
                originX: `${size / 2}px`,
                originY: `${size / 2}px`,
              }}
            >
              <path
                d={path}
                fill={colors.primary}
                stroke={colors.accent}
                strokeWidth={2}
              />
              {/* Segment detail lines */}
              <line
                x1={(x1 + x2) / 2}
                y1={(y1 + y2) / 2}
                x2={(x3 + x4) / 2}
                y2={(y3 + y4) / 2}
                stroke={colors.accent}
                strokeWidth={1}
                opacity={0.3}
              />
            </motion.g>
          );
        })}

        {/* Center "E" keyhole - fades out when opening */}
        <motion.g
          initial={false}
          animate={{
            opacity: isOpen ? 0 : 1,
            scale: isOpen ? 0.5 : 1,
          }}
          transition={{ duration: 0.5 }}
          style={{
            originX: `${size / 2}px`,
            originY: `${size / 2}px`,
          }}
        >
          {/* "E" shape as keyhole */}
          <path
            d={`
              M ${size / 2 - innerRadius * 0.5} ${size / 2 - innerRadius * 0.6}
              L ${size / 2 + innerRadius * 0.3} ${size / 2 - innerRadius * 0.6}
              L ${size / 2 + innerRadius * 0.3} ${size / 2 - innerRadius * 0.3}
              L ${size / 2 - innerRadius * 0.3} ${size / 2 - innerRadius * 0.3}
              L ${size / 2 - innerRadius * 0.3} ${size / 2 - innerRadius * 0.05}
              L ${size / 2 + innerRadius * 0.2} ${size / 2 - innerRadius * 0.05}
              L ${size / 2 + innerRadius * 0.2} ${size / 2 + innerRadius * 0.15}
              L ${size / 2 - innerRadius * 0.3} ${size / 2 + innerRadius * 0.15}
              L ${size / 2 - innerRadius * 0.3} ${size / 2 + innerRadius * 0.4}
              L ${size / 2 + innerRadius * 0.3} ${size / 2 + innerRadius * 0.4}
              L ${size / 2 + innerRadius * 0.3} ${size / 2 + innerRadius * 0.6}
              L ${size / 2 - innerRadius * 0.5} ${size / 2 + innerRadius * 0.6}
              Z
            `}
            fill={colors.accent}
          />
        </motion.g>

        {/* Outer ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius + 2}
          fill="none"
          stroke={colors.primary}
          strokeWidth={3}
        />
      </svg>
    </div>
  );
}

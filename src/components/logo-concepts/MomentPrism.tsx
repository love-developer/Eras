import React, { useState } from 'react';
import { motion } from 'motion/react';

interface MomentPrismProps {
  size?: number;
  isOpen?: boolean;
  onToggle?: () => void;
  colorScheme?: 'slate' | 'ocean' | 'twilight' | 'aurora';
  autoAnimate?: boolean;
}

const colorSchemes = {
  slate: {
    primary: '#334155',
    facets: ['#0F766E', '#0891B2', '#7C3AED'],
    core: '#FFFFFF',
  },
  ocean: {
    primary: '#164E63',
    facets: ['#0E7490', '#06B6D4', '#22D3EE'],
    core: '#FCD34D',
  },
  twilight: {
    primary: '#312E81',
    facets: ['#6366F1', '#8B5CF6', '#A855F7'],
    core: '#FBBF24',
  },
  aurora: {
    primary: '#1E293B',
    facets: ['#10B981', '#3B82F6', '#EC4899'],
    core: '#F8FAFC',
  },
};

export function MomentPrism({ 
  size = 200, 
  isOpen: controlledIsOpen,
  onToggle,
  colorScheme = 'slate',
  autoAnimate = false
}: MomentPrismProps) {
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

  const facets = 6; // Hexagonal prism
  const radius = size / 2;
  const centerRadius = radius * 0.25;

  // Generate hexagon points
  const hexPoints = Array.from({ length: facets }).map((_, i) => {
    const angle = (i * 60 - 90) * (Math.PI / 180);
    return {
      x: size / 2 + Math.cos(angle) * (radius * 0.85),
      y: size / 2 + Math.sin(angle) * (radius * 0.85),
      angle: i * 60,
    };
  });

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
        {/* Central core light */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={centerRadius}
          fill={colors.core}
          initial={false}
          animate={{
            opacity: isOpen ? 1 : 0.3,
            scale: isOpen ? 1.5 : 1,
          }}
          transition={{ duration: 1.0 }}
        />

        {/* 6 prism facets */}
        {hexPoints.map((point, i) => {
          const nextPoint = hexPoints[(i + 1) % facets];
          
          // Create triangular facet from center to two edge points
          const path = `M ${size / 2} ${size / 2} L ${point.x} ${point.y} L ${nextPoint.x} ${nextPoint.y} Z`;
          
          // Calculate rotation origin (center of each facet)
          const facetCenterX = (size / 2 + point.x + nextPoint.x) / 3;
          const facetCenterY = (size / 2 + point.y + nextPoint.y) / 3;
          
          // Movement for open state - rotate outward like flower petals
          const moveAngle = ((i + 0.5) * 60 - 90) * (Math.PI / 180);
          const moveDistance = isOpen ? radius * 0.35 : 0;
          const translateX = Math.cos(moveAngle) * moveDistance;
          const translateY = Math.sin(moveAngle) * moveDistance;
          const rotateAngle = isOpen ? 25 : 0;

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
                ease: [0.36, 0, 0.66, -0.56], // Anticipation ease
                delay: i * 0.05,
              }}
              style={{
                originX: `${facetCenterX}px`,
                originY: `${facetCenterY}px`,
              }}
            >
              {/* Facet with color variation */}
              <path
                d={path}
                fill={colors.facets[i % colors.facets.length]}
                stroke={colors.primary}
                strokeWidth={2}
                opacity={isOpen ? 0.9 : 0.7}
              />
              
              {/* Light refraction line on each facet */}
              <motion.line
                x1={size / 2}
                y1={size / 2}
                x2={(point.x + nextPoint.x) / 2}
                y2={(point.y + nextPoint.y) / 2}
                stroke={colors.core}
                strokeWidth={2}
                initial={false}
                animate={{
                  opacity: isOpen ? 0.6 : 0.2,
                }}
                transition={{ duration: 0.8, delay: i * 0.05 }}
              />
            </motion.g>
          );
        })}

        {/* Outer hexagon frame */}
        <polygon
          points={hexPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={colors.primary}
          strokeWidth={3}
          opacity={0.5}
        />
      </svg>
    </div>
  );
}

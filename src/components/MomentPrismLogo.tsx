import React from 'react';

interface MomentPrismLogoProps {
  size?: number;
  className?: string;
  showSubtitle?: boolean;
  forceAuthLayout?: boolean;
  onClick?: () => void;
  colorScheme?: 'scheduled' | 'delivered' | 'received' | 'draft' | 'all' | 'eclipse' | 'aurora';
}

// 6 Color Schemes matching capsule statuses
const colorSchemes = {
  // Scheduled Flow (Blue spectrum - 6 distinct blues)
  scheduled: {
    facets: ['#3b82f6', '#60a5fa', '#2563eb', '#1d4ed8', '#1e40af', '#93c5fd'],
    core: '#dbeafe',
    glow: '#3b82f6',
  },
  // Delivered Bloom (Emerald spectrum - 6 distinct greens)
  delivered: {
    facets: ['#10b981', '#34d399', '#059669', '#047857', '#065f46', '#6ee7b7'],
    core: '#d1fae5',
    glow: '#10b981',
  },
  // Received Radiance (Gold spectrum - 6 distinct yellows)
  received: {
    facets: ['#facc15', '#fde047', '#eab308', '#ca8a04', '#a16207', '#fef08a'],
    core: '#fef9c3',
    glow: '#facc15',
  },
  // Draft Dream (Purple spectrum - 6 distinct purples)
  draft: {
    facets: ['#a855f7', '#c084fc', '#9333ea', '#7e22ce', '#6b21a8', '#d8b4fe'],
    core: '#f3e8ff',
    glow: '#a855f7',
  },
  // All Capsules Spectrum (Rainbow - 6 distinct colors)
  all: {
    facets: ['#f43f5e', '#e879f9', '#fb7185', '#ec4899', '#db2777', '#fda4af'],
    core: '#fce7f3',
    glow: '#ec4899',
  },
  // Aurora (DEFAULT - HOME Classic exact colors in order)
  aurora: {
    facets: [
      '#9333ea',  // Purple (Draft) - Position 0 / #1 (moved from #6)
      '#ec4899',  // Pink (All Capsules) - Position 1 / #2 (moved from #5)
      '#3b82f6',  // Blue (Scheduled) - Position 2 / #3 (moved from #1)
      'rgba(255, 255, 255, 0.15)',  // Translucent - Position 3 / #4 (STAYS)
      '#10b981',  // Emerald/Teal (Delivered) - Position 4 / #5 (moved from #2)
      '#f59e0b',  // Amber/Gold (Received) - Position 5 / #6 (moved from #3)
    ],
    core: '#f8fafc',
    glow: '#3b82f6',
  },
  // Lunar Eclipse (ONE COLOR PER CAPSULE STATE)
  eclipse: {
    facets: [
      '#3b82f6',  // Blue - Scheduled
      '#10b981',  // Green - Delivered
      '#facc15',  // Yellow - Received
      '#a855f7',  // Purple - Draft
      '#ec4899',  // Pink - All Capsules
      '#cbd5e1',  // Silver - 6th color (replaces orange to avoid rainbow look)
    ],
    core: '#fef3c7',
    glow: '#d97706',
  },
};

export function MomentPrismLogo({ 
  size = 40, 
  className = "", 
  showSubtitle = true, 
  forceAuthLayout = false, 
  onClick,
  colorScheme = 'aurora' 
}: MomentPrismLogoProps) {
  // Breathing animation state
  const [isBreathing, setIsBreathing] = React.useState(false);
  
  // Manual rotation state for Safari compatibility
  const [rotation, setRotation] = React.useState(0);
  
  // Rotate using setInterval instead of requestAnimationFrame
  React.useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 0.5) % 360);
    }, 16); // ~60fps
    
    return () => clearInterval(interval);
  }, []);
  
  // Set up breathing animation interval (every 30 seconds)
  React.useEffect(() => {
    if (!onClick) return; // Only breathe if clickable
    
    // First breath after 3 seconds (so user can see it immediately)
    const firstBreath = setTimeout(() => {
      setIsBreathing(true);
      setTimeout(() => setIsBreathing(false), 2000);
    }, 3000);
    
    const breatheInterval = setInterval(() => {
      setIsBreathing(true);
      setTimeout(() => setIsBreathing(false), 2000); // 2 second breathe duration
    }, 30000); // Every 30 seconds
    
    return () => {
      clearTimeout(firstBreath);
      clearInterval(breatheInterval);
    };
  }, [onClick]);
  
  const scaleFactor = size / 40;
  const logoMainSize = Math.max(12 * scaleFactor, 8);
  const logoSubSize = Math.max(6 * scaleFactor, 4);
  
  // Detect mobile for ERAS text size reduction
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  
  const colors = colorSchemes[colorScheme];
  
  // Prism geometry
  const facets = 6; // Hexagonal prism
  const centerRadius = size * 0.2; // Core size
  
  // Generate hexagon points (static "open" state) - ROTATED by rotation angle
  const hexPoints = Array.from({ length: facets }).map((_, i) => {
    const angle = (i * 60 - 90 + rotation) * (Math.PI / 180); // Add rotation here
    return {
      x: size / 2 + Math.cos(angle) * (size * 0.42),
      y: size / 2 + Math.sin(angle) * (size * 0.42),
      color: colors.facets[i % colors.facets.length],
    };
  });
  
  const content = (
    <div 
      className={`
        flex items-center gap-1 sm:gap-3 
        ${className} 
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-300 ease-out
        ${onClick ? 'hover:scale-[1.05]' : ''}
        ${onClick ? 'active:scale-[0.98]' : ''} ${isBreathing ? 'animate-breathe' : ''}
        relative
      `}
      style={onClick ? {
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      } : {}}
    >
      {/* Hover glow effect - only when clickable */}
      {onClick && (
        <div 
          className="
            absolute -inset-4 rounded-3xl
            opacity-0 group-hover:opacity-100
            transition-opacity duration-300
            pointer-events-none
            z-0
          "
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(236, 72, 153, 0.3) 40%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
      )}
      
      {/* Moment Prism (Static Open State) */}
      <div 
        className="relative flex-shrink-0"
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="drop-shadow-2xl filter overflow-visible"
          style={{ 
            display: 'block',
            pointerEvents: 'none',
          }}
        >
          <defs>
            {/* Core glow gradient */}
            <radialGradient id={`coreGlow-${colorScheme}`} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="50%" stopColor={colors.core} stopOpacity="0.9" />
              <stop offset="100%" stopColor={colors.glow} stopOpacity="0.6" />
            </radialGradient>
            
            {/* Facet gradients */}
            {colors.facets.map((color, i) => (
              <linearGradient key={i} id={`facet-${colorScheme}-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={color} stopOpacity="0.6" />
              </linearGradient>
            ))}
          </defs>
          
          {/* Outer glow ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size * 0.47}
            fill="none"
            stroke={colors.glow}
            strokeWidth={size * 0.03}
            opacity="0.4"
          />
          
          {/* Facet triangles (spread out) */}
          {hexPoints.map((point, i) => {
            const nextPoint = hexPoints[(i + 1) % facets];
            return (
              <path
                key={i}
                d={`M ${size / 2} ${size / 2} L ${point.x} ${point.y} L ${nextPoint.x} ${nextPoint.y} Z`}
                fill={`url(#facet-${colorScheme}-${i})`}
                stroke={colors.glow}
                strokeWidth={size * 0.01}
                opacity="0.8"
              />
            );
          })}
          
          {/* Central core light */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={centerRadius}
            fill={`url(#coreGlow-${colorScheme})`}
            opacity="1"
          />
          
          {/* Inner glow ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={centerRadius * 1.2}
            fill="none"
            stroke="#ffffff"
            strokeWidth={size * 0.015}
            opacity="0.6"
          />
        </svg>
      </div>
      
      {/* Enhanced Title Section - EXACT COPY from EclipseLogo */}
      {showSubtitle && (
        <div className="flex flex-col space-y-1">
          <div className="relative">
            <h1 
              className="logo-gradient-text logo-title-enhanced font-black tracking-tight leading-none -ml-1 sm:ml-0"
              style={{ 
                fontSize: `${isMobile ? logoMainSize * 0.8 : logoMainSize}px`,
                fontFamily: '"SF Pro Display", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                letterSpacing: '-0.02em'
              }}
            >
              ERAS
            </h1>
          </div>
          
          <div className="relative">
            <p 
              className="logo-subtitle-enhanced text-slate-600 dark:text-slate-400 font-medium tracking-wide leading-tight animate-fade-in-glow"
              style={{ 
                fontSize: `${logoSubSize}px`,
                fontFamily: '"SF Pro Text", "Inter", system-ui, sans-serif',
                letterSpacing: '0.05em',
                animation: 'fadeInWithGlow 0.8s ease-out 0.5s both',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.4), 0 0 8px rgba(255, 255, 255, 0.3)'
              }}
            >
              {forceAuthLayout ? (
                // AUTH PAGE ONLY: Always 2 rows
                <>
                  Capture Today,<br />Unlock Tomorrow
                </>
              ) : (
                // ALL PAGES: Always 2 rows for consistent branding
                <>
                  Capture Today,<br />Unlock Tomorrow
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
  
  // If onClick is provided, make the entire logo clickable (EXACT COPY from EclipseLogo)
  if (onClick) {
    return (
      <div className="group">
        <button
          onClick={onClick}
          className="
            focus:outline-none 
            focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 
            rounded-lg p-1 -m-1
            transition-all duration-300
            hover:drop-shadow-[0_0_30px_rgba(168,85,247,0.7)]
            hover:brightness-110
          "
          aria-label="Open Horizon Gallery"
        >
          {content}
        </button>
      </div>
    );
  }
  
  return content;
}
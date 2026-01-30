import React from 'react';

interface EclipseLogoProps {
  size?: number;
  className?: string;
  showSubtitle?: boolean;
  forceAuthLayout?: boolean; // Force 2-row layout for auth pages
  onClick?: () => void; // Optional click handler to open title selector
}

export function EclipseLogo({ size = 40, className = "", showSubtitle = true, forceAuthLayout = false, onClick }: EclipseLogoProps) {
  const scaleFactor = size / 40;
  const logoMainSize = Math.max(12 * scaleFactor, 8);
  const logoSubSize = Math.max(6 * scaleFactor, 4); // Increased from 5 to 6 for bigger mobile text
  
  // Detect mobile for ERAS text size reduction
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  
  const content = (
    <div className={`flex items-center gap-1 sm:gap-3 ${className} ${onClick ? 'cursor-pointer transition-opacity hover:opacity-80 active:opacity-60' : ''}`}>
      {/* Enhanced Eclipse Logo */}
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-2xl filter"
        >
          {/* Enhanced gradient definitions */}
          <defs>
            <radialGradient id="sunGradient" cx="0.3" cy="0.3" r="1.2">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#fef3c7" />
              <stop offset="80%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
            
            <radialGradient id="moonShadow" cx="0.3" cy="0.3" r="0.8">
              <stop offset="0%" stopColor="#4a5568" />
              <stop offset="50%" stopColor="#2d3748" />
              <stop offset="100%" stopColor="#1a202c" />
            </radialGradient>
            
            <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>

          {/* Outer glow ring */}
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="url(#glowGradient)"
            strokeWidth="1.5"
            opacity="0.6"
            className="animate-pulse"
          />
          
          {/* Background - Enhanced Sun */}
          <circle
            cx="24"
            cy="20"
            r="14"
            fill="url(#sunGradient)"
            stroke="#d97706"
            strokeWidth="0.8"
            opacity="0.95"
            style={{
              filter: 'drop-shadow(0 0 3px rgba(217, 119, 6, 0.2))'
            }}
          />
          
          {/* Moon with enhanced gradient shadow */}
          <circle
            cx="16"
            cy="20"
            r="13"
            fill="url(#moonShadow)"
            stroke="#4a5568"
            strokeWidth="0.5"
          />
          
          {/* Enhanced Sun Glimmer */}
          <g className="animate-eclipse-glimmer" style={{ transformOrigin: '32px 14px' }}>
            {/* Sparkling points */}
            <circle cx="32" cy="8" r="0.2" fill="#ffffff" opacity="0.5" />
            <circle cx="36" cy="12" r="0.15" fill="#ffffff" opacity="0.4" />
            <circle cx="35" cy="17" r="0.1" fill="#ffffff" opacity="0.3" />
          </g>

        </svg>
      </div>
      
      {/* Enhanced Title Section */}
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
  
  // If onClick is provided, make the entire logo clickable
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg p-1 -m-1"
        aria-label="Open title selector"
      >
        {content}
      </button>
    );
  }
  
  return content;
}
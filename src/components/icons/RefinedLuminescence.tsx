/**
 * REFINED LUMINESCENCE ICONS
 * 
 * Emoji icons with luminescence effects matching Home and Vault icons
 */

interface RefinedLuminescenceProps {
  className?: string;
  size?: number;
}

/**
 * CREATE TAB ICON - Sparkle Emoji ✨ with Luminescence
 */
export function RefinedSparkles({ className = "", size = 58 }: RefinedLuminescenceProps) {
  return (
    <span 
      className={`transition-all duration-300 ${className}`}
      style={{
        fontSize: `${size}px`,
        lineHeight: 1,
        filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))',
        textShadow: '0 0 8px rgba(255, 255, 255, 0.9), 0 0 12px rgba(255, 255, 255, 0.7), 0 0 16px rgba(255, 255, 255, 0.5)'
      }}
    >
      ✨
    </span>
  );
}

/**
 * RECORD TAB ICON - Video Camera Emoji 🎥 with Luminescence
 */
export function RefinedVideoCamera({ className = "", size = 58 }: RefinedLuminescenceProps) {
  return (
    <span 
      className={`transition-all duration-300 ${className}`}
      style={{
        fontSize: `${size}px`,
        lineHeight: 1,
        filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))',
        textShadow: '0 0 8px rgba(255, 255, 255, 0.9), 0 0 12px rgba(255, 255, 255, 0.7), 0 0 16px rgba(255, 255, 255, 0.5)'
      }}
    >
      🎥
    </span>
  );
}

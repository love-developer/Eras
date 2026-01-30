import React from 'react';
import * as LucideIcons from 'lucide-react';

interface TitleDisplayProps {
  title: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  className?: string;
  showQuotes?: boolean;
  animate?: boolean;
  singleRow?: boolean; // Force single row (no wrapping on mobile)
}

const rarityStyles = {
  common: {
    color: 'text-gray-400',
    glow: 'text-shadow: 0 0 8px rgba(156, 163, 175, 0.3)',
    gradient: 'from-gray-400 to-gray-500'
  },
  uncommon: {
    color: 'text-blue-400',
    glow: 'text-shadow: 0 0 12px rgba(96, 165, 250, 0.4)',
    gradient: 'from-blue-400 to-blue-600'
  },
  rare: {
    color: 'text-purple-400',
    glow: 'text-shadow: 0 0 16px rgba(192, 132, 252, 0.5)',
    gradient: 'from-purple-400 via-violet-500 to-purple-600'
  },
  epic: {
    color: 'text-yellow-400',
    glow: 'text-shadow: 0 0 20px rgba(251, 191, 36, 0.6)',
    gradient: 'from-yellow-400 via-amber-500 to-yellow-600'
  },
  legendary: {
    color: 'text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 via-blue-400 to-cyan-400',
    glow: 'text-shadow: 0 0 24px rgba(236, 72, 153, 0.7)',
    gradient: 'from-pink-400 via-purple-400 via-blue-400 to-cyan-400'
  }
};

export function TitleDisplay({ 
  title, 
  rarity, 
  className = '', 
  showQuotes = false,
  animate = true,
  singleRow = false 
}: TitleDisplayProps) {
  const styles = rarityStyles[rarity];
  
  // Badge styling based on rarity with vibrant backgrounds
  const badgeStyles = {
    common: {
      bg: 'bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700',
      border: 'border-gray-500',
      glow: 'shadow-lg shadow-gray-500/50',
      shine: 'from-white/20 to-transparent',
      icon: '⚡'
    },
    uncommon: {
      bg: 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700',
      border: 'border-blue-400',
      glow: 'shadow-xl shadow-blue-500/60',
      shine: 'from-blue-300/30 to-transparent',
      icon: '◆'
    },
    rare: {
      bg: 'bg-gradient-to-r from-purple-700 via-purple-600 to-purple-700',
      border: 'border-purple-400',
      glow: 'shadow-xl shadow-purple-500/70',
      shine: 'from-purple-300/40 to-transparent',
      icon: '✦'
    },
    epic: {
      bg: 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600',
      border: 'border-yellow-300',
      glow: 'shadow-2xl shadow-amber-500/80',
      shine: 'from-yellow-200/50 to-transparent',
      icon: '★'
    },
    legendary: {
      bg: 'bg-gradient-to-r from-pink-600 via-purple-600 via-blue-600 to-cyan-600',
      border: 'border-pink-400',
      glow: 'shadow-2xl shadow-pink-500/90',
      shine: 'from-white/60 to-transparent',
      icon: '✧'
    }
  };
  
  let badge = badgeStyles[rarity];
  
  // 🎨 CUSTOM STYLING FOR EACH UNCOMMON HORIZON
  // Override default uncommon styling with title-specific colors matching achievement gradients
  if (rarity === 'uncommon') {
    const uncommonCustomStyles: Record<string, typeof badge> = {
      'Golden Hour Guardian': {
        bg: 'bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700',
        border: 'border-amber-400',
        glow: 'shadow-xl shadow-amber-500/60',
        shine: 'from-amber-300/30 to-transparent',
        icon: '🌅'
      },
      'Neon Dreamer': {
        bg: 'bg-gradient-to-r from-cyan-700 via-cyan-600 to-cyan-700',
        border: 'border-cyan-400',
        glow: 'shadow-xl shadow-cyan-500/60',
        shine: 'from-cyan-300/30 to-transparent',
        icon: '💡'
      },
      'Surrealist': {
        bg: 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-700',
        border: 'border-indigo-400',
        glow: 'shadow-xl shadow-indigo-500/60',
        shine: 'from-indigo-300/30 to-transparent',
        icon: '🎨'
      },
      'Time Sculptor': {
        bg: 'bg-gradient-to-r from-teal-700 via-teal-600 to-teal-700',
        border: 'border-teal-400',
        glow: 'shadow-xl shadow-teal-500/60',
        shine: 'from-teal-300/30 to-transparent',
        icon: '🗿'
      },
      'Memory Broadcaster': {
        bg: 'bg-gradient-to-r from-rose-700 via-rose-600 to-rose-700',
        border: 'border-rose-400',
        glow: 'shadow-xl shadow-rose-500/60',
        shine: 'from-rose-300/30 to-transparent',
        icon: '📡'
      },
      'Ritual Keeper': {
        bg: 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700',
        border: 'border-emerald-400',
        glow: 'shadow-xl shadow-emerald-500/60',
        shine: 'from-emerald-300/30 to-transparent',
        icon: '🕯️'
      },
      'Vault Starter': {
        bg: 'bg-gradient-to-r from-sky-700 via-sky-600 to-sky-700',
        border: 'border-sky-400',
        glow: 'shadow-xl shadow-sky-500/60',
        shine: 'from-sky-300/30 to-transparent',
        icon: '📦'
      },
      'Multimedia Virtuoso': {
        bg: 'bg-gradient-to-r from-cyan-700 via-cyan-600 to-teal-700',
        border: 'border-cyan-400',
        glow: 'shadow-xl shadow-cyan-500/60',
        shine: 'from-cyan-300/30 to-transparent',
        icon: '🎭'
      },
      'Word Painter': {
        bg: 'bg-gradient-to-r from-violet-700 via-indigo-600 to-violet-700',
        border: 'border-violet-400',
        glow: 'shadow-xl shadow-violet-500/60',
        shine: 'from-violet-300/30 to-transparent',
        icon: '🖌️'
      },
      'Frequency Keeper': {
        bg: 'bg-gradient-to-r from-pink-700 via-pink-600 to-pink-700',
        border: 'border-pink-400',
        glow: 'shadow-xl shadow-pink-500/60',
        shine: 'from-pink-300/30 to-transparent',
        icon: '📻'
      },
      'Quantum Scheduler': {
        bg: 'bg-gradient-to-r from-purple-700 via-violet-600 to-purple-700',
        border: 'border-purple-400',
        glow: 'shadow-xl shadow-purple-500/60',
        shine: 'from-purple-300/30 to-transparent',
        icon: '⚛️'
      },
      'Community Weaver': {
        bg: 'bg-gradient-to-r from-rose-700 via-pink-600 to-rose-700',
        border: 'border-rose-400',
        glow: 'shadow-xl shadow-rose-500/60',
        shine: 'from-rose-300/30 to-transparent',
        icon: '🤝'
      },
      'Echo Artisan': {
        bg: 'bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700',
        border: 'border-emerald-400',
        glow: 'shadow-xl shadow-emerald-500/60',
        shine: 'from-emerald-300/30 to-transparent',
        icon: '🌊'
      }
    };
    
    if (uncommonCustomStyles[title]) {
      badge = uncommonCustomStyles[title];
    }
  }
  
  // Split title into words for potential wrapping
  const words = title.split(' ');
  
  return (
    <span 
      className={`
        relative inline-flex flex-row items-center gap-0.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full
        border-2 ${badge.border} ${badge.bg} ${badge.glow}
        overflow-hidden ${singleRow ? 'whitespace-nowrap' : ''}
        ${animate ? 'transition-all duration-300 hover:scale-110 hover:brightness-110' : ''}
        ${className}
      `}
      style={{
        backgroundSize: rarity === 'legendary' ? '200% auto' : '100%',
        animation: rarity === 'legendary' && animate ? 'shimmer 3s linear infinite, title-float 3s ease-in-out infinite' : 
                   animate ? 'title-float 3s ease-in-out infinite' : 'none'
      }}
    >
      {/* Shine overlay effect */}
      <span className={`
        absolute inset-0 bg-gradient-to-br ${badge.shine}
        ${animate ? 'animate-pulse' : ''}
      `} style={{ opacity: 0.5 }} />
      
      {/* Rotating shine beam for epic and legendary */}
      {(rarity === 'epic' || rarity === 'legendary') && (
        <span 
          className={`
            absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
            ${animate ? 'animate-title-shine' : ''}
          `}
          style={{ transform: 'translateX(-100%)' }}
        />
      )}
      
      {/* SINGLE ROW ONLY: Always display title in one line */}
      <>
        {/* Left icon */}
        <span className={`
          relative z-10 text-[7px] sm:text-[11px] flex-shrink-0
          ${rarity === 'legendary' 
            ? 'bg-gradient-to-r from-yellow-200 via-white to-yellow-200 bg-clip-text text-transparent' 
            : 'text-white drop-shadow-lg'
          }
          ${animate ? 'animate-title-bounce-slow' : ''}
        `}>
          {badge.icon}
        </span>
        
        {/* Title text */}
        <span className={`relative z-10 inline-flex flex-row items-center leading-none gap-0 ${singleRow ? 'whitespace-nowrap' : 'text-center'}`}>
          <span className={`
            font-bold tracking-wide uppercase text-[6.5px] sm:text-[11px]
            ${rarity === 'legendary' 
              ? 'bg-gradient-to-r from-yellow-100 via-white to-yellow-100 bg-clip-text text-transparent' 
              : 'text-white'
            }
            drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]
            ${singleRow ? 'whitespace-nowrap' : ''}
          `}>
            {showQuotes && '\"'}
            {title}
            {showQuotes && '\"'}
          </span>
        </span>
        
        {/* Right icon */}
        <span className={`
          relative z-10 text-[7px] sm:text-[11px] flex-shrink-0
          ${rarity === 'legendary' 
            ? 'bg-gradient-to-r from-yellow-200 via-white to-yellow-200 bg-clip-text text-transparent' 
            : 'text-white drop-shadow-lg'
          }
          ${animate ? 'animate-title-bounce-slow' : ''}
        `}>
          {badge.icon}
        </span>
      </>
      
      {/* Sparkle effects for legendary */}
      {rarity === 'legendary' && (
        <>
          <span className="absolute top-0 right-4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0s' }} />
          <span className="absolute bottom-0 left-4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
          <span className="absolute top-1/2 right-2 w-1 h-1 bg-yellow-200 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        </>
      )}
    </span>
  );
}

interface TitleBadgeProps {
  title: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon?: string;
  onClick?: () => void;
  isEquipped?: boolean;
  className?: string;
}

export function TitleBadge({ 
  title, 
  rarity, 
  icon,
  onClick, 
  isEquipped = false,
  className = ''
}: TitleBadgeProps) {
  const styles = rarityStyles[rarity];
  
  const rarityLabels = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary'
  };

  const rarityIcons = {
    common: '○',
    uncommon: '◇',
    rare: '✦',
    epic: '★',
    legendary: '✧'
  };
  
  // Get the Lucide icon component from the icon name string
  const IconComponent = icon && (LucideIcons as any)[icon];
  
  // Icon styling based on rarity - vibrant solid colors with effects
  const iconStyles = {
    common: {
      bg: 'bg-gray-700',
      iconColor: 'text-gray-200',
      ring: 'ring-2 ring-gray-500/50',
      shadow: 'shadow-lg shadow-gray-500/30'
    },
    uncommon: {
      bg: 'bg-blue-600',
      iconColor: 'text-blue-100',
      ring: 'ring-2 ring-blue-400/50',
      shadow: 'shadow-lg shadow-blue-500/40'
    },
    rare: {
      bg: 'bg-purple-600',
      iconColor: 'text-purple-100',
      ring: 'ring-2 ring-purple-400/50',
      shadow: 'shadow-lg shadow-purple-500/50'
    },
    epic: {
      bg: 'bg-amber-500',
      iconColor: 'text-amber-50',
      ring: 'ring-2 ring-amber-300/50',
      shadow: 'shadow-lg shadow-amber-400/60'
    },
    legendary: {
      bg: 'bg-pink-600',
      iconColor: 'text-pink-50',
      ring: 'ring-2 ring-pink-400/60',
      shadow: 'shadow-xl shadow-pink-500/70'
    }
  };
  
  const iconStyle = iconStyles[rarity];
  
  // Get equipped border/bg styles based on rarity
  const getEquippedStyles = () => {
    if (!isEquipped) return 'border-gray-700 hover:border-gray-600 bg-gray-800/50';
    
    const equippedStyles = {
      common: 'border-gray-500 bg-gray-500/10',
      uncommon: 'border-blue-500 bg-blue-500/10',
      rare: 'border-purple-500 bg-purple-500/10',
      epic: 'border-yellow-500 bg-yellow-500/10',
      legendary: 'border-purple-500 bg-purple-500/10'
    };
    
    return equippedStyles[rarity];
  };
  
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        relative group px-4 py-3 rounded-lg border-2 
        transition-all duration-300
        ${onClick ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'cursor-default'}
        ${getEquippedStyles()}
        ${className}
      `}
    >
      <div className="flex items-center gap-4">
        {IconComponent ? (
          <div className={`
            p-3 rounded-xl ${iconStyle.bg} ${iconStyle.ring} ${iconStyle.shadow}
            group-hover:scale-110 transition-transform duration-300
          `}>
            <IconComponent className={`w-7 h-7 ${iconStyle.iconColor}`} strokeWidth={2.5} />
          </div>
        ) : (
          <div className={`
            w-13 h-13 flex items-center justify-center rounded-xl 
            ${iconStyle.bg} ${iconStyle.ring} ${iconStyle.shadow}
          `}>
            <span className="text-3xl">{rarityIcons[rarity]}</span>
          </div>
        )}
        
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <TitleDisplay 
              title={title} 
              rarity={rarity} 
              showQuotes={false}
              animate={isEquipped}
            />
            {isEquipped && (
              <span className="text-xs text-green-400 font-medium">Equipped</span>
            )}
          </div>
          <div className={`text-xs ${styles.color} opacity-70`}>
            {rarityLabels[rarity]}
          </div>
        </div>
      </div>
      
      {rarity === 'legendary' && isEquipped && (
        <div className="absolute inset-0 rounded-lg pointer-events-none">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-pink-500/20 via-purple-500/20 via-blue-500/20 to-cyan-500/20 animate-pulse" />
        </div>
      )}
    </button>
  );
}

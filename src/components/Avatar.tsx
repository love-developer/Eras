import React from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  email?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * 👤 AVATAR COMPONENT
 * 
 * Displays user profile picture with fallback to colorful initial circles
 * - Shows image if src is provided
 * - Falls back to initials from name or email
 * - Generates consistent colors based on name/email hash
 */
export function Avatar({ src, alt, name, email, size = 'md', className = '' }: AvatarProps) {
  
  // Size mappings
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-20 h-20 text-2xl'
  };

  // Get initials from name or email
  const getInitials = () => {
    if (name) {
      // Extract first letters of first two words
      const parts = name.trim().split(' ').filter(p => p.length > 0);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      if (parts.length === 1 && parts[0].length >= 2) {
        return parts[0].substring(0, 2).toUpperCase();
      }
      if (parts.length === 1) {
        return parts[0][0].toUpperCase();
      }
    }
    
    if (email) {
      // Use first two letters of email
      const emailPart = email.split('@')[0];
      if (emailPart.length >= 2) {
        return emailPart.substring(0, 2).toUpperCase();
      }
      return emailPart[0].toUpperCase();
    }
    
    return '?';
  };

  // Generate consistent color based on name or email
  const getColorGradient = () => {
    const str = name || email || 'default';
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Color palettes (gradient pairs)
    const colorPalettes = [
      ['from-blue-500', 'to-purple-600'],
      ['from-green-500', 'to-teal-600'],
      ['from-orange-500', 'to-red-600'],
      ['from-pink-500', 'to-rose-600'],
      ['from-indigo-500', 'to-blue-600'],
      ['from-violet-500', 'to-purple-600'],
      ['from-cyan-500', 'to-blue-600'],
      ['from-emerald-500', 'to-green-600'],
      ['from-amber-500', 'to-orange-600'],
      ['from-fuchsia-500', 'to-pink-600']
    ];
    
    const index = Math.abs(hash) % colorPalettes.length;
    return colorPalettes[index].join(' ');
  };

  const initials = getInitials();
  const gradientClasses = getColorGradient();
  const sizeClass = sizeClasses[size];

  // If image is available, show it
  if (src) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 ${className}`}>
        <img 
          src={src} 
          alt={alt || name || 'Profile picture'} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Hide image on error and show fallback
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Fallback to initials
  return (
    <div 
      className={`${sizeClass} rounded-full bg-gradient-to-br ${gradientClasses} flex items-center justify-center text-white font-semibold ${className}`}
      title={alt || name || email || 'User avatar'}
    >
      {initials}
    </div>
  );
}

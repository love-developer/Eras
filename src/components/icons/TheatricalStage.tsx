interface TheatricalStageProps {
  className?: string;
  size?: number;
}

export function TheatricalStage({ className = "", size = 58 }: TheatricalStageProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Rich velvet red gradient */}
        <linearGradient id="velvetRed" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6B0000" />
          <stop offset="30%" stopColor="#A00000" />
          <stop offset="50%" stopColor="#C41E3A" />
          <stop offset="70%" stopColor="#A00000" />
          <stop offset="100%" stopColor="#6B0000" />
        </linearGradient>
        
        {/* Gold trim gradient */}
        <linearGradient id="goldTrim" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#DAA520" />
        </linearGradient>
        
        {/* Shadow gradient for depth */}
        <radialGradient id="curtainShadow">
          <stop offset="0%" stopColor="#8B0000" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3B0000" stopOpacity="0.9" />
        </radialGradient>
      </defs>
      
      {/* Background stage darkness */}
      <rect width="100" height="100" fill="#0a0000" />
      
      {/* Subtle stage glow */}
      <ellipse cx="50" cy="70" rx="35" ry="20" fill="#FFD700" opacity="0.08" />
      
      {/* LEFT CURTAIN - Multiple draping folds */}
      
      {/* Back folds - deeper in shadow */}
      <path
        d="M 0 15 Q 2 16 4 20 L 6 88 Q 5 92 3 95 L 0 95 Z"
        fill="#4B0000"
      />
      <path
        d="M 4 18 Q 5 20 6 25 L 8 90 Q 7 93 5 96 L 3 95 Q 5 92 6 88 L 4 20 Z"
        fill="#5B0000"
      />
      
      {/* Middle folds - rich velvet texture */}
      <path
        d="M 7 16 Q 9 18 10 22 L 12 88 Q 11 92 9 95 L 5 96 Q 7 93 8 90 L 6 25 Q 7 19 7 16 Z"
        fill="url(#velvetRed)"
      />
      <path
        d="M 10 20 Q 11 22 11.5 26 L 12.5 87 L 10 90 L 9.5 28 Q 10 22 10 20 Z"
        fill="#8B0000"
        opacity="0.6"
      />
      
      <path
        d="M 13 16 Q 15 18 16 23 L 18 88 Q 17 92 15 95 L 9 95 Q 11 92 12 88 L 10 22 Q 12 18 13 16 Z"
        fill="url(#velvetRed)"
      />
      <path
        d="M 15.5 22 Q 16 24 16.5 28 L 17.5 86 L 15.5 89 L 15 30 Q 15.3 24 15.5 22 Z"
        fill="#A00000"
        opacity="0.5"
      />
      
      {/* Front folds - lighter highlights */}
      <path
        d="M 19 16 Q 21 18 22 24 L 24 88 Q 23 92 21 95 L 15 95 Q 17 92 18 88 L 16 23 Q 18 18 19 16 Z"
        fill="url(#velvetRed)"
      />
      <path
        d="M 21 23 Q 22 26 22.5 30 L 23.5 85 L 21.5 88 L 21 32 Q 21 26 21 23 Z"
        fill="#C41E3A"
        opacity="0.4"
      />
      
      <path
        d="M 25 16 Q 27 18 28 25 L 30 88 Q 29 92 27 95 L 21 95 Q 23 92 24 88 L 22 24 Q 24 18 25 16 Z"
        fill="url(#velvetRed)"
      />
      <path
        d="M 27 24 Q 28 28 28.5 33 L 29.5 84 L 27.5 87 L 27 35 Q 27 28 27 24 Z"
        fill="#DC143C"
        opacity="0.35"
      />
      
      {/* Foremost fold with brightest highlights */}
      <path
        d="M 31 16 Q 33 19 34 26 L 36 88 Q 35 92 33 95 L 27 95 Q 29 92 30 88 L 28 25 Q 30 19 31 16 Z"
        fill="url(#velvetRed)"
      />
      <path
        d="M 33 25 Q 34 30 34.5 36 L 35.5 83 L 33.5 86 L 33 38 Q 33 30 33 25 Z"
        fill="#FF6B6B"
        opacity="0.3"
      />
      
      {/* RIGHT CURTAIN - Mirrored draping folds */}
      
      {/* Back folds */}
      <path
        d="M 100 15 Q 98 16 96 20 L 94 88 Q 95 92 97 95 L 100 95 Z"
        fill="#4B0000"
      />
      <path
        d="M 96 18 Q 95 20 94 25 L 92 90 Q 93 93 95 96 L 97 95 Q 95 92 94 88 L 96 20 Z"
        fill="#5B0000"
      />
      
      {/* Middle folds */}
      <path
        d="M 93 16 Q 91 18 90 22 L 88 88 Q 89 92 91 95 L 95 96 Q 93 93 92 90 L 94 25 Q 93 19 93 16 Z"
        fill="url(#velvetRed)"
      />
      <path
        d="M 90 20 Q 89 22 88.5 26 L 87.5 87 L 90 90 L 90.5 28 Q 90 22 90 20 Z"
        fill="#8B0000"
        opacity="0.6"
      />
      
      <path
        d="M 87 16 Q 85 18 84 23 L 82 88 Q 83 92 85 95 L 91 95 Q 89 92 88 88 L 90 22 Q 88 18 87 16 Z"
        fill="url(#velvetRed)"
      />
      <path
        d="M 84.5 22 Q 84 24 83.5 28 L 82.5 86 L 84.5 89 L 85 30 Q 84.7 24 84.5 22 Z"
        fill="#A00000"
        opacity="0.5"
      />
      
      {/* Front folds */}
      <path
        d="M 81 16 Q 79 18 78 24 L 76 88 Q 77 92 79 95 L 85 95 Q 83 92 82 88 L 84 23 Q 82 18 81 16 Z"
        fill="url(#velvetRed)"
      />
      <path
        d="M 79 23 Q 78 26 77.5 30 L 76.5 85 L 78.5 88 L 79 32 Q 79 26 79 23 Z"
        fill="#C41E3A"
        opacity="0.4"
      />
      
      <path
        d="M 75 16 Q 73 18 72 25 L 70 88 Q 71 92 73 95 L 79 95 Q 77 92 76 88 L 78 24 Q 76 18 75 16 Z"
        fill="url(#velvetRed)"
      />
      <path
        d="M 73 24 Q 72 28 71.5 33 L 70.5 84 L 72.5 87 L 73 35 Q 73 28 73 24 Z"
        fill="#DC143C"
        opacity="0.35"
      />
      
      {/* Foremost fold */}
      <path
        d="M 69 16 Q 67 19 66 26 L 64 88 Q 65 92 67 95 L 73 95 Q 71 92 70 88 L 72 25 Q 70 19 69 16 Z"
        fill="url(#velvetRed)"
      />
      <path
        d="M 67 25 Q 66 30 65.5 36 L 64.5 83 L 66.5 86 L 67 38 Q 67 30 67 25 Z"
        fill="#FF6B6B"
        opacity="0.3"
      />
      
      {/* ORNATE GOLD VALANCE - Swag draping at top */}
      
      {/* Main valance structure */}
      <path
        d="M 0 0 L 0 15 Q 8 12 16 11 Q 25 10 34 11 Q 42 12 50 14 Q 58 12 66 11 Q 75 10 84 11 Q 92 12 100 15 L 100 0 Z"
        fill="url(#goldTrim)"
      />
      
      {/* Swag drapes */}
      <ellipse cx="17" cy="15" rx="8" ry="4" fill="#DAA520" />
      <path d="M 9 15 Q 12 17 17 18 Q 22 17 25 15" fill="#B8860B" opacity="0.6" />
      
      <ellipse cx="50" cy="17" rx="10" ry="5" fill="#DAA520" />
      <path d="M 40 17 Q 44 20 50 21 Q 56 20 60 17" fill="#B8860B" opacity="0.6" />
      
      <ellipse cx="83" cy="15" rx="8" ry="4" fill="#DAA520" />
      <path d="M 75 15 Q 78 17 83 18 Q 88 17 91 15" fill="#B8860B" opacity="0.6" />
      
      {/* Ornamental border pattern */}
      <rect x="0" y="14" width="100" height="2" fill="#FFD700" opacity="0.8" />
      
      {/* Decorative studs/jewels */}
      <circle cx="10" cy="15" r="1.2" fill="#FFD700" />
      <circle cx="25" cy="15" r="1.2" fill="#FFD700" />
      <circle cx="40" cy="17" r="1.2" fill="#FFD700" />
      <circle cx="50" cy="18" r="1.5" fill="#FFED4E" />
      <circle cx="60" cy="17" r="1.2" fill="#FFD700" />
      <circle cx="75" cy="15" r="1.2" fill="#FFD700" />
      <circle cx="90" cy="15" r="1.2" fill="#FFD700" />
      
      {/* Gold tassel left */}
      <line x1="36" y1="16" x2="36" y2="35" stroke="#DAA520" strokeWidth="1.5" />
      <circle cx="36" cy="16" r="2" fill="#FFD700" />
      <path d="M 33 35 L 36 40 L 39 35 Z" fill="#B8860B" />
      <line x1="34" y1="36" x2="34" y2="39" stroke="#DAA520" strokeWidth="0.5" />
      <line x1="36" y1="36" x2="36" y2="39" stroke="#DAA520" strokeWidth="0.5" />
      <line x1="38" y1="36" x2="38" y2="39" stroke="#DAA520" strokeWidth="0.5" />
      
      {/* Gold tassel right */}
      <line x1="64" y1="16" x2="64" y2="35" stroke="#DAA520" strokeWidth="1.5" />
      <circle cx="64" cy="16" r="2" fill="#FFD700" />
      <path d="M 61 35 L 64 40 L 67 35 Z" fill="#B8860B" />
      <line x1="62" y1="36" x2="62" y2="39" stroke="#DAA520" strokeWidth="0.5" />
      <line x1="64" y1="36" x2="64" y2="39" stroke="#DAA520" strokeWidth="0.5" />
      <line x1="66" y1="36" x2="66" y2="39" stroke="#DAA520" strokeWidth="0.5" />
      
      {/* Gold rope trim on curtain edges */}
      <path
        d="M 36 16 L 36 95"
        stroke="#DAA520"
        strokeWidth="1.2"
        opacity="0.9"
      />
      <path
        d="M 64 16 L 64 95"
        stroke="#DAA520"
        strokeWidth="1.2"
        opacity="0.9"
      />
      
      {/* Decorative rope pattern */}
      <circle cx="36" cy="30" r="1" fill="#FFD700" opacity="0.7" />
      <circle cx="36" cy="45" r="1" fill="#FFD700" opacity="0.7" />
      <circle cx="36" cy="60" r="1" fill="#FFD700" opacity="0.7" />
      <circle cx="36" cy="75" r="1" fill="#FFD700" opacity="0.7" />
      
      <circle cx="64" cy="30" r="1" fill="#FFD700" opacity="0.7" />
      <circle cx="64" cy="45" r="1" fill="#FFD700" opacity="0.7" />
      <circle cx="64" cy="60" r="1" fill="#FFD700" opacity="0.7" />
      <circle cx="64" cy="75" r="1" fill="#FFD700" opacity="0.7" />
      
    </svg>
  );
}

import React from 'react';
import { Card, CardContent } from './ui/card';

interface CapsuleGridSkeletonProps {
  count?: number;
}

export const CapsuleGridSkeleton: React.FC<CapsuleGridSkeletonProps> = ({ count = 8 }) => {
  return (
    <div className="grid gap-2 grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card 
          key={i}
          className="relative overflow-hidden bg-slate-800/70 backdrop-blur-xl border-slate-700/50 animate-pulse"
        >
          {/* Gradient shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-slate-700/20 to-transparent" />
          
          <CardContent className="p-2.5 md:p-5">
            {/* Desktop Skeleton - Hidden on mobile */}
            <div className="hidden md:flex md:flex-col md:gap-3">
              {/* Status Icon Circle Skeleton */}
              <div className="w-12 h-12 rounded-full bg-slate-700/50 mx-auto" />
              
              {/* Title Skeleton */}
              <div className="space-y-2">
                <div className="h-5 bg-slate-700/50 rounded mx-auto w-3/4" />
                <div className="h-5 bg-slate-700/50 rounded mx-auto w-2/3" />
              </div>
              
              {/* Metadata Skeleton */}
              <div className="space-y-1.5 mt-2">
                <div className="h-4 bg-slate-700/50 rounded mx-auto w-1/2" />
                <div className="h-4 bg-slate-700/50 rounded mx-auto w-2/5" />
              </div>
              
              {/* Message Preview Skeleton */}
              <div className="space-y-1.5 mt-2">
                <div className="h-3 bg-slate-700/50 rounded w-full" />
                <div className="h-3 bg-slate-700/50 rounded w-5/6 mx-auto" />
              </div>
              
              {/* Media Badge Skeleton (optional) */}
              {i % 3 === 0 && (
                <div className="h-6 bg-slate-700/50 rounded-full w-24 mx-auto mt-2" />
              )}
            </div>

            {/* Mobile Skeleton - Shown only on mobile - CENTERED */}
            <div className="flex flex-col gap-2 md:hidden items-center">
              {/* Status Icon - Centered */}
              <div className="w-10 h-10 rounded-full bg-slate-700/50 mx-auto" />
              
              {/* Badge - Centered */}
              <div className="h-5 w-16 bg-slate-700/50 rounded-full mx-auto" />
              
              {/* Title - Centered */}
              <div className="space-y-1 w-full">
                <div className="h-4 bg-slate-700/50 rounded mx-auto w-3/4" />
                <div className="h-4 bg-slate-700/50 rounded mx-auto w-2/3" />
              </div>
              
              {/* Metadata - Centered with tight spacing */}
              <div className="space-y-0.5 w-full">
                <div className="h-3 bg-slate-700/50 rounded mx-auto w-2/3" />
                <div className="h-3 bg-slate-700/50 rounded mx-auto w-1/2" />
              </div>
              
              {/* Media Thumbnails - Centered */}
              {i % 3 === 0 && (
                <div className="flex gap-1 justify-center w-full">
                  <div className="w-12 h-12 bg-slate-700/50 rounded-md" />
                  <div className="w-12 h-12 bg-slate-700/50 rounded-md" />
                  <div className="w-12 h-12 bg-slate-700/50 rounded-md" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Shimmer animation
const style = document.createElement('style');
style.textContent = `
  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`;
document.head.appendChild(style);

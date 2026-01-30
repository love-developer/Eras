/**
 * PHASE 1 PERFORMANCE OPTIMIZATION - LazyImage Component
 * Provides advanced lazy loading with Intersection Observer
 * Features:
 * - Only loads images when they're about to enter viewport
 * - Skeleton loader while loading
 * - Smooth fade-in animation
 * - Error handling with fallback
 * - Supports both native and custom lazy loading
 */

import React, { useEffect, useRef, useState } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
  errorFallback?: React.ReactNode;
  fadeIn?: boolean;
  rootMargin?: string; // How far before entering viewport to start loading
  useNativeLazy?: boolean; // Use browser's native lazy loading instead
}

export function LazyImage({
  src,
  alt,
  className = '',
  skeletonClassName = '',
  errorFallback,
  fadeIn = true,
  rootMargin = '50px', // Start loading 50px before visible
  useNativeLazy = false,
  ...imgProps
}: LazyImageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // If using native lazy loading, skip Intersection Observer
  if (useNativeLazy) {
    return (
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        className={className}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        {...imgProps}
      />
    );
  }

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold: 0.01
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    console.warn('LazyImage: Failed to load', src);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Skeleton loader */}
      {!isLoaded && !hasError && (
        <div 
          className={`
            absolute inset-0 animate-pulse bg-gradient-to-r from-slate-700/50 via-slate-600/50 to-slate-700/50
            ${skeletonClassName}
          `}
        />
      )}

      {/* Error fallback */}
      {hasError && errorFallback ? (
        <div className="absolute inset-0 flex items-center justify-center">
          {errorFallback}
        </div>
      ) : null}

      {/* Actual image - only render when visible */}
      {isVisible && !hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`
            ${className}
            ${fadeIn ? 'transition-opacity duration-300' : ''}
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          onLoad={handleLoad}
          onError={handleError}
          {...imgProps}
        />
      )}
    </div>
  );
}

/**
 * Lightweight version using just native lazy loading
 */
export function SimpleLazyImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img loading="lazy" {...props} />;
}

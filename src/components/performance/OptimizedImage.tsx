import { useState, useRef, useCallback, useEffect } from 'react';
import { usePerformance, useOptimizedImages } from './PerformanceProvider';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Generate low-quality placeholder
function generatePlaceholder(src: string, width = 20, height = 20): string {
  // In a real implementation, you'd generate this server-side or use a service
  // For now, we'll use a data URL with SVG
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <circle cx="50%" cy="50%" r="8" fill="#d1d5db"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const { isSlowConnection, shouldOptimizeImages } = usePerformance();
  const { format, quality, sizes: adaptiveSizes } = useOptimizedImages();

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: isSlowConnection ? '50px' : '200px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isSlowConnection]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Generate optimized src URL
  const getOptimizedSrc = useCallback((originalSrc: string, width?: number, quality?: number) => {
    // In a real implementation, you'd use a service like Cloudinary, ImageKit, or Vercel's Image Optimization
    // For now, we'll return the original src with query parameters that could be processed by a middleware
    const url = new URL(originalSrc, window.location.origin);

    if (width) url.searchParams.set('w', width.toString());
    if (quality) url.searchParams.set('q', quality.toString());
    if (format !== 'auto') url.searchParams.set('f', format);
    if (shouldOptimizeImages) url.searchParams.set('optimize', 'true');

    return url.toString();
  }, [format, shouldOptimizeImages]);

  // Progressive loading for large images
  const [currentSrc, setCurrentSrc] = useState(() => {
    if (!isInView) return '';
    if (shouldOptimizeImages && width && width > 400) {
      // Load low-res first, then high-res
      return getOptimizedSrc(src, Math.floor(width / 2), 50);
    }
    return getOptimizedSrc(src, width, quality);
  });

  useEffect(() => {
    if (!isInView) return;

    if (shouldOptimizeImages && width && width > 400 && isLoaded && currentSrc.includes('q=50')) {
      // Load high-res version after low-res is loaded
      setTimeout(() => {
        setCurrentSrc(getOptimizedSrc(src, width, quality));
        setIsLoaded(false); // Trigger loading state for high-res
      }, 100);
    } else if (!currentSrc) {
      setCurrentSrc(getOptimizedSrc(src, width, quality));
    }
  }, [isInView, shouldOptimizeImages, width, quality, isLoaded, currentSrc, src, getOptimizedSrc]);

  // Generate srcSet for responsive images
  const srcSet = width ? [
    `${getOptimizedSrc(src, Math.floor(width * 0.5), quality)} ${Math.floor(width * 0.5)}w`,
    `${getOptimizedSrc(src, width, quality)} ${width}w`,
    `${getOptimizedSrc(src, Math.floor(width * 1.5), quality)} ${Math.floor(width * 1.5)}w`,
    `${getOptimizedSrc(src, Math.floor(width * 2), quality)} ${Math.floor(width * 2)}w`
  ].join(', ') : undefined;

  const placeholderSrc = blurDataURL || generatePlaceholder(src, width, height);

  if (hasError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
        role="img"
        aria-label={`Failed to load ${alt}`}
      >
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className="text-gray-400">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Placeholder */}
      {placeholder === 'blur' && !isLoaded && (
        <img
          src={placeholderSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm scale-105 transition-opacity duration-300"
          style={{ opacity: isInView ? 0.6 : 1 }}
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={currentSrc || undefined}
        srcSet={currentSrc ? srcSet : undefined}
        sizes={sizes || adaptiveSizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`
          w-full h-full object-cover transition-opacity duration-300
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
          ${isInView ? '' : 'invisible'}
        `}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          // Prevent layout shift
          aspectRatio: width && height ? `${width} / ${height}` : undefined
        }}
      />

      {/* Loading indicator */}
      {isInView && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// Hook for preloading critical images
export function useImagePreloader(src: string, priority = false) {
  useEffect(() => {
    if (!priority || typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;

    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [src, priority]);
}
import { useEffect, useState, useCallback } from 'react';

// Device detection and viewport utilities
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
  width: number;
  height: number;
  pixelRatio: number;
  hasTouch: boolean;
  platform: string;
  isSafari: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  viewportWidth: number;
  viewportHeight: number;
}

export interface ViewportConfig {
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  columns: number;
  maxWidth: number;
  padding: number;
  fontSize: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    type: 'desktop',
    orientation: 'landscape',
    width: 1920,
    height: 1080,
    pixelRatio: 1,
    hasTouch: false,
    platform: 'unknown',
    isSafari: false,
    isIOS: false,
    isAndroid: false,
    viewportWidth: 1920,
    viewportHeight: 1080
  });

  const updateDeviceInfo = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.screen.width;
    const height = window.screen.height;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Detect device type based on screen size and touch capability
    let type: DeviceInfo['type'] = 'desktop';
    if (width <= 768 || (hasTouch && width <= 1024)) {
      type = 'mobile';
    } else if (width <= 1024 && hasTouch) {
      type = 'tablet';
    }

    // Detect orientation
    const orientation: DeviceInfo['orientation'] = width > height ? 'landscape' : 'portrait';

    // Detect platform and browser
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);

    setDeviceInfo({
      type,
      orientation,
      width,
      height,
      pixelRatio,
      hasTouch,
      platform,
      isSafari,
      isIOS,
      isAndroid,
      viewportWidth,
      viewportHeight
    });
  }, []);

  useEffect(() => {
    updateDeviceInfo();

    // Listen for orientation and resize changes
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, [updateDeviceInfo]);

  return deviceInfo;
}

export function useViewportConfig(): ViewportConfig {
  const { viewportWidth } = useDeviceDetection();

  if (viewportWidth < 480) {
    return {
      breakpoint: 'xs',
      columns: 1,
      maxWidth: 320,
      padding: 16,
      fontSize: 'sm'
    };
  } else if (viewportWidth < 640) {
    return {
      breakpoint: 'sm',
      columns: 2,
      maxWidth: 480,
      padding: 20,
      fontSize: 'sm'
    };
  } else if (viewportWidth < 768) {
    return {
      breakpoint: 'md',
      columns: 2,
      maxWidth: 640,
      padding: 24,
      fontSize: 'base'
    };
  } else if (viewportWidth < 1024) {
    return {
      breakpoint: 'lg',
      columns: 3,
      maxWidth: 768,
      padding: 32,
      fontSize: 'base'
    };
  } else if (viewportWidth < 1280) {
    return {
      breakpoint: 'xl',
      columns: 4,
      maxWidth: 1024,
      padding: 40,
      fontSize: 'lg'
    };
  } else {
    return {
      breakpoint: '2xl',
      columns: 5,
      maxWidth: 1280,
      padding: 48,
      fontSize: 'xl'
    };
  }
}

// Touch interaction optimization
export function useTouchOptimization() {
  const { hasTouch, isIOS, isAndroid } = useDeviceDetection();

  const optimizeTouch = useCallback((element: HTMLElement) => {
    if (!hasTouch) return;

    // Optimize touch target size (minimum 44px)
    const computedStyle = window.getComputedStyle(element);
    const width = parseFloat(computedStyle.width);
    const height = parseFloat(computedStyle.height);

    if (width < 44 || height < 44) {
      element.style.minWidth = '44px';
      element.style.minHeight = '44px';
      element.style.display = 'flex';
      element.style.alignItems = 'center';
      element.style.justifyContent = 'center';
    }

    // Add touch-specific styles
    element.style.WebkitTapHighlightColor = 'transparent';
    element.style.touchAction = 'manipulation';

    // iOS-specific optimizations
    if (isIOS) {
      element.style.WebkitUserSelect = 'none';
      element.style.WebkitTouchCallout = 'none';
    }

    // Android-specific optimizations
    if (isAndroid) {
      element.style.userSelect = 'none';
    }
  }, [hasTouch, isIOS, isAndroid]);

  return { optimizeTouch, hasTouch, isIOS, isAndroid };
}

// Mobile-specific performance hooks
export function useMobilePerformance() {
  const { type, hasTouch, pixelRatio } = useDeviceDetection();
  const [isSlowDevice, setIsSlowDevice] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect slow devices based on various indicators
    const checkDeviceSpeed = () => {
      const hardwareConcurrency = navigator.hardwareConcurrency || 1;
      const deviceMemory = (navigator as any).deviceMemory || 1;
      const connectionSpeed = (navigator as any).connection?.effectiveType;

      const isSlow =
        hardwareConcurrency <= 2 ||
        deviceMemory <= 2 ||
        connectionSpeed === 'slow-2g' ||
        connectionSpeed === '2g' ||
        (type === 'mobile' && pixelRatio <= 1);

      setIsSlowDevice(isSlow);
    };

    checkDeviceSpeed();

    // Listen for network changes
    if ('connection' in navigator) {
      (navigator as any).connection?.addEventListener('change', checkDeviceSpeed);
    }

    return () => {
      if ('connection' in navigator) {
        (navigator as any).connection?.removeEventListener('change', checkDeviceSpeed);
      }
    };
  }, [type, pixelRatio]);

  return {
    isMobile: type === 'mobile',
    isTablet: type === 'tablet',
    hasTouch,
    isSlowDevice,
    shouldReduceAnimations: isSlowDevice || type === 'mobile',
    shouldOptimizeImages: isSlowDevice || type === 'mobile',
    recommendedImageQuality: isSlowDevice ? 60 : type === 'mobile' ? 75 : 90
  };
}

// Viewport testing component for development
interface ViewportTesterProps {
  show?: boolean;
  onDeviceChange?: (device: DeviceInfo) => void;
}

export function ViewportTester({ show = false, onDeviceChange }: ViewportTesterProps) {
  const deviceInfo = useDeviceDetection();
  const viewportConfig = useViewportConfig();
  const { isSlowDevice } = useMobilePerformance();

  useEffect(() => {
    onDeviceChange?.(deviceInfo);
  }, [deviceInfo, onDeviceChange]);

  if (!show || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 bg-black/90 text-white p-3 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="font-bold mb-2">Device Info</div>

      <div className="space-y-1">
        <div>Type: <span className="text-green-400">{deviceInfo.type}</span></div>
        <div>Orientation: <span className="text-green-400">{deviceInfo.orientation}</span></div>
        <div>Screen: <span className="text-green-400">{deviceInfo.width}×{deviceInfo.height}</span></div>
        <div>Viewport: <span className="text-green-400">{deviceInfo.viewportWidth}×{deviceInfo.viewportHeight}</span></div>
        <div>Pixel Ratio: <span className="text-green-400">{deviceInfo.pixelRatio}x</span></div>
        <div>Touch: <span className="text-green-400">{deviceInfo.hasTouch ? 'Yes' : 'No'}</span></div>
        <div>Platform: <span className="text-green-400">{deviceInfo.platform}</span></div>

        {deviceInfo.isIOS && <div className="text-blue-400">iOS Device</div>}
        {deviceInfo.isAndroid && <div className="text-green-400">Android Device</div>}
        {deviceInfo.isSafari && <div className="text-blue-400">Safari Browser</div>}
        {isSlowDevice && <div className="text-red-400">Slow Device Detected</div>}
      </div>

      <div className="border-t border-gray-600 mt-2 pt-2">
        <div className="font-bold mb-1">Layout Config</div>
        <div>Breakpoint: <span className="text-yellow-400">{viewportConfig.breakpoint}</span></div>
        <div>Columns: <span className="text-yellow-400">{viewportConfig.columns}</span></div>
        <div>Max Width: <span className="text-yellow-400">{viewportConfig.maxWidth}px</span></div>
        <div>Padding: <span className="text-yellow-400">{viewportConfig.padding}px</span></div>
      </div>
    </div>
  );
}

// Safe area handling for mobile devices
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);

      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0')
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);

    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeArea;
}

// Mobile-optimized gesture handlers
export function useGestureOptimization() {
  const { hasTouch } = useDeviceDetection();

  const addSwipeGesture = useCallback((
    element: HTMLElement,
    onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void,
    threshold = 50
  ) => {
    if (!hasTouch || !element) return;

    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;

      const deltaX = endX - startX;
      const deltaY = endY - startY;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > threshold) {
          onSwipe(deltaX > 0 ? 'right' : 'left');
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > threshold) {
          onSwipe(deltaY > 0 ? 'down' : 'up');
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [hasTouch]);

  const addPinchGesture = useCallback((
    element: HTMLElement,
    onPinch: (scale: number) => void
  ) => {
    if (!hasTouch || !element) return;

    let initialDistance = 0;

    const getDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance = getDistance(e.touches);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistance > 0) {
        const currentDistance = getDistance(e.touches);
        const scale = currentDistance / initialDistance;
        onPinch(scale);
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, [hasTouch]);

  return { addSwipeGesture, addPinchGesture };
}

// Default export
export default function MobileOptimizer() {
  return null; // This is a utility component
}
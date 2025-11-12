import { useEffect, useRef, RefObject } from 'react';

export interface SwipeGestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance for swipe (default: 50px)
  velocityThreshold?: number; // Minimum velocity (default: 0.3)
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export function useSwipeGesture<T extends HTMLElement>(
  config: SwipeGestureConfig
): RefObject<T | null> {
  const elementRef = useRef<T | null>(null);
  const touchStart = useRef<TouchPoint | null>(null);
  const threshold = config.threshold ?? 50;
  const velocityThreshold = config.velocityThreshold ?? 0.3;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = touch.clientY - touchStart.current.y;
      const deltaTime = Date.now() - touchStart.current.time;

      // Calculate velocity (pixels per millisecond)
      const velocityX = Math.abs(deltaX) / deltaTime;
      const velocityY = Math.abs(deltaY) / deltaTime;

      // Determine if horizontal or vertical swipe
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

      if (isHorizontal) {
        // Horizontal swipe
        if (Math.abs(deltaX) > threshold && velocityX > velocityThreshold) {
          if (deltaX > 0) {
            config.onSwipeRight?.();
          } else {
            config.onSwipeLeft?.();
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > threshold && velocityY > velocityThreshold) {
          if (deltaY > 0) {
            config.onSwipeDown?.();
          } else {
            config.onSwipeUp?.();
          }
        }
      }

      touchStart.current = null;
    };

    const handleTouchCancel = () => {
      touchStart.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [config, threshold, velocityThreshold]);

  return elementRef;
}

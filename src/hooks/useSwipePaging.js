import { useRef } from 'react';

const SWIPE_THRESHOLD = 48;

export default function useSwipePaging({ onPrevious, onNext, canPrevious = true, canNext = true }) {
  const start = useRef(null);

  return {
    onTouchStart: event => {
      const touch = event.touches[0];
      start.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
    },
    onTouchEnd: event => {
      const origin = start.current;
      const touch = event.changedTouches[0];
      start.current = null;
      if (!origin || !touch) return;
      const deltaX = touch.clientX - origin.x;
      const deltaY = touch.clientY - origin.y;
      if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) return;
      if (deltaX > 0 && canPrevious) onPrevious?.();
      if (deltaX < 0 && canNext) onNext?.();
    },
  };
}

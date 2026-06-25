import { useEffect, useRef } from 'react';

/**
 * Pull-to-refresh hook.
 * @param {() => Promise<void>} onRefresh  called when the user pulls down far enough
 * @param {{ threshold?: number, scrollRef?: React.RefObject }} options
 */
export default function usePullToRefresh(onRefresh, { threshold = 70, scrollRef } = {}) {
  const startY = useRef(null);
  const pulling = useRef(false);
  const indicator = useRef(null);

  useEffect(() => {
    const el = scrollRef?.current ?? document.querySelector('main') ?? window;

    const getScrollTop = () =>
      el === window ? window.scrollY : el.scrollTop;

    const onTouchStart = (e) => {
      if (getScrollTop() <= 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };

    const onTouchMove = (e) => {
      if (!pulling.current || startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && indicator.current) {
        indicator.current.style.opacity = Math.min(dy / threshold, 1);
        indicator.current.style.transform = `translateY(${Math.min(dy / 2, 40)}px)`;
      }
    };

    const onTouchEnd = async (e) => {
      if (!pulling.current || startY.current === null) return;
      const dy = (e.changedTouches[0]?.clientY ?? 0) - startY.current;
      startY.current = null;
      pulling.current = false;
      if (indicator.current) {
        indicator.current.style.opacity = 0;
        indicator.current.style.transform = 'translateY(0)';
      }
      if (dy > threshold) {
        await onRefresh();
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh, threshold, scrollRef]);

  return { indicatorRef: indicator };
}
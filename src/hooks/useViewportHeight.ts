import { useEffect, useRef, useState } from 'react';

export interface ViewportHeightState {
  vvh: number;
  vvTop: number;
  isKeyboardOpen: boolean;
}

function isEditableElementFocused(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true;
  if (el.tagName === 'INPUT') {
    const type = (el as HTMLInputElement).type?.toLowerCase() || 'text';
    return !['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'range', 'color'].includes(type);
  }
  return false;
}

export function useViewportHeight(): ViewportHeightState {
  const [state, setState] = useState<ViewportHeightState>(() => {
    const h = typeof window !== 'undefined' ? (window.visualViewport?.height ?? window.innerHeight) : 800;
    const top = typeof window !== 'undefined' ? (window.visualViewport?.offsetTop ?? 0) : 0;
    return {
      vvh: Math.round(h),
      vvTop: Math.round(top),
      isKeyboardOpen: false,
    };
  });

  const maxLayoutHeightRef = useRef<number>(
    typeof window !== 'undefined' ? Math.max(window.innerHeight, window.visualViewport?.height ?? 0) : 800
  );
  const lastWidthRef = useRef<number>(
    typeof window !== 'undefined' ? (window.visualViewport?.width ?? window.innerWidth) : 390
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateViewport = () => {
      const vv = window.visualViewport;
      const vvWidth = vv ? vv.width : window.innerWidth;
      const vvHeight = vv ? vv.height : window.innerHeight;
      const vvTop = vv ? vv.offsetTop : 0;

      // Reset baseline layout height on orientation change / major width change
      if (Math.abs(vvWidth - lastWidthRef.current) > 40) {
        lastWidthRef.current = vvWidth;
        maxLayoutHeightRef.current = Math.max(window.innerHeight, vvHeight);
      }

      const inputFocused = isEditableElementFocused();
      if (!inputFocused || window.innerHeight > maxLayoutHeightRef.current) {
        maxLayoutHeightRef.current = Math.max(maxLayoutHeightRef.current, window.innerHeight, vvHeight);
      }
      // If viewport grew back close to max, keep baseline fresh
      if (vvHeight >= maxLayoutHeightRef.current - 40) {
        maxLayoutHeightRef.current = Math.max(window.innerHeight, vvHeight);
      }

      const visualDiff = window.innerHeight - vvHeight;
      const layoutDiff = maxLayoutHeightRef.current - vvHeight;
      const keyboardOpen =
        visualDiff > 120 ||
        (inputFocused && layoutDiff > 120);

      const roundedVvh = Math.max(200, Math.round(vvHeight));
      const roundedVvTop = Math.max(0, Math.round(vvTop));

      const root = document.documentElement;
      root.style.setProperty('--vvh', `${roundedVvh}px`);
      root.style.setProperty('--vv-top', `${roundedVvTop}px`);
      root.classList.toggle('keyboard-open', keyboardOpen);

      setState((prev) => {
        if (
          prev.vvh === roundedVvh &&
          prev.vvTop === roundedVvTop &&
          prev.isKeyboardOpen === keyboardOpen
        ) {
          return prev;
        }
        return {
          vvh: roundedVvh,
          vvTop: roundedVvTop,
          isKeyboardOpen: keyboardOpen,
        };
      });
    };

    const handleFocusChange = () => {
      updateViewport();
      setTimeout(updateViewport, 120);
      setTimeout(updateViewport, 320);
    };

    updateViewport();

    window.visualViewport?.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('scroll', updateViewport);
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    window.addEventListener('focusin', handleFocusChange);
    window.addEventListener('focusout', handleFocusChange);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      window.removeEventListener('focusin', handleFocusChange);
      window.removeEventListener('focusout', handleFocusChange);
    };
  }, []);

  return state;
}

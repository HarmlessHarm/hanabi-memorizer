import { useEffect, useRef, useState } from 'react';
import type { Box } from '../lib/layout';

/**
 * Observes the play area and reports its content-box size, so cards can be sized
 * against the real available space on both axes (REQ-1.5). Returns a ref to
 * attach to the stage element and the current box.
 */
export function useStageSize(): [React.RefObject<HTMLDivElement>, Box] {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box>({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) =>
      setBox({ w: entry.contentRect.width, h: entry.contentRect.height }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, box];
}

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Card } from '../lib/types';
import type { Metrics } from '../lib/layout';
import { DRAG_THRESHOLD, LIFT, TOUCH_DRAG_THRESHOLD } from '../lib/layout';

interface DragRef {
  pointerId: number;
  /** px of travel this pointer is allowed before the gesture stops being a tap */
  slop: number;
  i: number;
  to: number;
  x0: number;
  y0: number;
  moved: boolean;
  out: boolean;
}

interface DragState {
  i: number;
  to: number;
  dx: number;
  dy: number;
  out: boolean;
}

interface Params {
  cards: Card[];
  metrics: Metrics;
  enabled: boolean;
  onTap: (id: number) => void;
  onReorder: (from: number, to: number) => void;
  onDiscard: (id: number) => void;
}

export interface CardPointerProps {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export interface HandDragApi {
  getCardProps: (i: number) => CardPointerProps;
  transformFor: (i: number) => CSSProperties;
  dragging: boolean;
  /** true once the dragged card has cleared the discard threshold */
  zoneArmed: boolean;
}

/**
 * A single pointer gesture that is dual-purpose (UX state 2): moving sideways
 * reorders live, moving up past the LIFT threshold switches to a discard and
 * stops the reorder shuffle so the two never fight. A tap (movement under
 * DRAG_THRESHOLD) selects the card. Pointer events + capture are used because
 * HTML5 drag-and-drop does not fire on touch (DEC-9).
 */
export function useHandDrag({
  cards,
  metrics,
  enabled,
  onTap,
  onReorder,
  onDiscard,
}: Params): HandDragApi {
  const { cardH, step } = metrics;

  const [drag, setDrag] = useState<DragState | null>(null);
  // On release the array reorder changes flex layout in the same frame the drag
  // translate is still animating to zero, so cards move twice. Kill transitions
  // for that one frame, then re-enable (DEC-10).
  const [settling, setSettling] = useState(false);

  const dragRef = useRef<DragRef | null>(null);
  const cardsRef = useRef(cards);
  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  const onDown = useCallback(
    (e: React.PointerEvent, i: number) => {
      if (!enabled) return;
      // Right/middle mouse buttons and second fingers must not hijack a gesture:
      // only a primary press owns the hand.
      if (e.button !== 0 || !e.isPrimary) return;
      if (dragRef.current) return;
      dragRef.current = {
        pointerId: e.pointerId,
        slop: e.pointerType === 'mouse' ? DRAG_THRESHOLD : TOUCH_DRAG_THRESHOLD,
        i,
        to: i,
        x0: e.clientX,
        y0: e.clientY,
        moved: false,
        out: false,
      };
      try {
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      } catch {
        /* pointer capture is best-effort */
      }
    },
    [enabled],
  );

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      const dx = e.clientX - d.x0;
      const dy = e.clientY - d.y0;
      if (!d.moved && Math.hypot(dx, dy) < d.slop) return;
      d.moved = true;
      d.out = dy < -cardH * LIFT;
      const n = cardsRef.current.length;
      d.to = d.out
        ? d.i
        : Math.max(0, Math.min(n - 1, d.i + Math.round(dx / step)));
      setDrag({ i: d.i, to: d.to, dx, dy, out: d.out });
    },
    [cardH, step],
  );

  const finishReorder = useCallback(
    (from: number, to: number) => {
      setSettling(true);
      onReorder(from, to);
      requestAnimationFrame(() => requestAnimationFrame(() => setSettling(false)));
    },
    [onReorder],
  );

  const onUp = useCallback(
    (e: React.PointerEvent, i: number) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      dragRef.current = null;
      setDrag(null);
      if (!d.moved) {
        onTap(cardsRef.current[i].id);
        return;
      }
      if (d.out) {
        onDiscard(cardsRef.current[d.i].id);
        return;
      }
      if (d.to !== d.i) finishReorder(d.i, d.to);
    },
    [finishReorder, onDiscard, onTap],
  );

  const onCancel = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    dragRef.current = null;
    setDrag(null);
  }, []);

  // A touchscreen replays every tap as a phantom mouse sequence (mousedown,
  // mouseup, click) a few ms after touchend, hit-tested against whatever sits
  // under the finger *by then* — which, for a tap that opens a sheet, is the
  // sheet's own backdrop. Left alone that click closes the sheet the tap just
  // opened, so a tap looks like it did nothing while a slow press (too long to
  // count as a tap, so no phantom click) works. The pointer handlers above have
  // already done the work; cancelling touchend suppresses the replay entirely.
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
  }, []);

  const getCardProps = useCallback(
    (i: number): CardPointerProps => ({
      onPointerDown: (e) => onDown(e, i),
      onPointerMove: onMove,
      onPointerUp: (e) => onUp(e, i),
      onPointerCancel: onCancel,
      onTouchEnd,
    }),
    [onCancel, onDown, onMove, onTouchEnd, onUp],
  );

  const transformFor = useCallback(
    (i: number): CSSProperties => {
      if (settling) return { transform: 'translate3d(0,0,0)', transition: 'none', zIndex: 1 };
      if (!drag) return { transform: 'translate3d(0,0,0)', zIndex: 1 };
      if (i === drag.i) {
        return {
          transform: drag.out
            ? `translate3d(${drag.dx}px,${drag.dy}px,0) scale(1.07)`
            : `translate3d(${drag.dx}px,-14px,0) scale(1.05) rotate(1.5deg)`,
          transition: 'none',
          zIndex: 40,
        };
      }
      // neighbours slide aside to open the gap the dragged card will land in
      let shift = 0;
      if (drag.i < drag.to && i > drag.i && i <= drag.to) shift = -step;
      if (drag.i > drag.to && i >= drag.to && i < drag.i) shift = step;
      return { transform: `translate3d(${shift}px,0,0)`, zIndex: 1 };
    },
    [drag, settling, step],
  );

  return {
    getCardProps,
    transformFor,
    dragging: drag !== null,
    zoneArmed: drag !== null && drag.out,
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, DOMAttributes } from 'react';
import { useDrag } from '@use-gesture/react';
import type { Card } from '../lib/types';
import type { Metrics } from '../lib/layout';
import { LIFT, TAP_SLOP } from '../lib/layout';

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
  onReorder: (from: number, to: number) => void;
  onDiscard: (id: number) => void;
}

export interface HandDragApi {
  /** drag handlers for the card at index i; the tap half lives in Card's usePress */
  bindCard: (i: number) => DOMAttributes<Element>;
  transformFor: (i: number) => CSSProperties;
  /** called when a press begins, to re-arm the tap/drag distinction */
  pressStarted: () => void;
  /** true if the gesture now ending travelled far enough to be a drag, not a tap */
  pressWasDrag: () => boolean;
  dragging: boolean;
  /** true once the dragged card has cleared the discard threshold */
  zoneArmed: boolean;
}

/**
 * A single pointer gesture that is dual-purpose (UX state 2): moving sideways
 * reorders live, moving up past the LIFT threshold switches to a discard and
 * stops the reorder shuffle so the two never fight. Movement under TAP_SLOP is
 * a tap, which Card's `usePress` picks up instead (DEC-14).
 *
 * `useDrag` owns the pointer bookkeeping — capture, the movement threshold, and
 * telling a tap from a drag — which HTML5 drag-and-drop cannot do on touch at
 * all (DEC-9).
 */
export function useHandDrag({
  cards,
  metrics,
  enabled,
  onReorder,
  onDiscard,
}: Params): HandDragApi {
  const { cardH, step } = metrics;

  const [drag, setDrag] = useState<DragState | null>(null);
  // On release the array reorder changes flex layout in the same frame the drag
  // translate is still animating to zero, so cards move twice. Kill transitions
  // for that one frame, then re-enable (DEC-10).
  const [settling, setSettling] = useState(false);

  // A drag ends with the finger still over the card it moved, so the press that
  // wraps it would otherwise also read as a tap and open the sheet on release.
  const draggedRef = useRef(false);
  const cardsRef = useRef(cards);
  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  const finishReorder = useCallback(
    (from: number, to: number) => {
      setSettling(true);
      onReorder(from, to);
      requestAnimationFrame(() => requestAnimationFrame(() => setSettling(false)));
    },
    [onReorder],
  );

  const bindCard = useDrag(
    ({ args, active, movement: [dx, dy], tap }) => {
      // Under the threshold nothing moved, so leave it to usePress.
      if (tap) return;

      const i = args[0] as number;
      const n = cardsRef.current.length;
      const out = dy < -cardH * LIFT;
      const to = out ? i : Math.max(0, Math.min(n - 1, i + Math.round(dx / step)));

      if (active) {
        draggedRef.current = true;
        setDrag({ i, to, dx, dy, out });
        return;
      }

      setDrag(null);
      const card = cardsRef.current[i];
      if (!card) return;
      if (out) onDiscard(card.id);
      else if (to !== i) finishReorder(i, to);
    },
    {
      enabled,
      // Matched on purpose: the drag must not start inside the tap window, or a
      // fingertip rolling a few px would lift the card and then resolve as a tap
      // the drag handler has already discarded.
      threshold: TAP_SLOP,
      filterTaps: true,
      tapsThreshold: TAP_SLOP,
      // The card is a focusable button now; arrow keys must not drag it.
      pointer: { keys: false },
    },
  );

  const pressStarted = useCallback(() => {
    draggedRef.current = false;
  }, []);

  const pressWasDrag = useCallback(() => draggedRef.current, []);

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
    bindCard,
    transformFor,
    pressStarted,
    pressWasDrag,
    dragging: drag !== null,
    zoneArmed: drag !== null && drag.out,
  };
}

import type { HandSize } from './types';

export const GAP = 10;
/** fraction of card height a card must travel up to arm the discard zone (DEC-8) */
export const LIFT = 0.34;
/** movement in px that separates a tap from a drag with a mouse (DEC-9, REQ-5.1) */
export const DRAG_THRESHOLD = 8;
/** the same, for a finger: a fingertip rolls a few px on even a deliberate tap */
export const TOUCH_DRAG_THRESHOLD = 12;

export interface Box {
  w: number;
  h: number;
}

export interface Metrics {
  cardW: number;
  cardH: number;
  zoneH: number;
  step: number;
}

// Cards size against BOTH axes so the full hand stays legible without scrolling
// in portrait and landscape (REQ-1.5). Aspect ratio is a poker-ish 5:7.
export function computeMetrics(box: Box, handSize: HandSize): Metrics {
  const byWidth = ((box.w - GAP * (handSize - 1)) / handSize) * (7 / 5);
  const byHeight = (box.h - 20) / 1.55;
  const cardH = Math.max(84, Math.min(byWidth || Infinity, byHeight || Infinity, 270));
  const cardW = (cardH * 5) / 7;
  return {
    cardW,
    cardH,
    zoneH: Math.round(cardH * 0.5),
    step: cardW + GAP,
  };
}

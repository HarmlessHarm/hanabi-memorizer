import type { Rank, SuitKey } from './types';

export interface Suit {
  key: SuitKey;
  label: string;
  /** base card color */
  hex: string;
  /** highlight, for the top of the card's gradient */
  hi: string;
  /** shadow, for the bottom of the card's gradient */
  lo: string;
  /** numeral ink, chosen per suit for contrast (DEC-7) */
  ink: string;
}

// Palette chosen for legibility at table distance, not brand fidelity (DEC-7):
// white numerals on red/green/blue, dark numerals on yellow/white.
export const SUITS: readonly Suit[] = [
  { key: 'red', label: 'Red', hex: '#d8443f', hi: '#ef6f66', lo: '#8e2723', ink: '#ffffff' },
  { key: 'yellow', label: 'Yellow', hex: '#edc23a', hi: '#f7dd7d', lo: '#a8830f', ink: '#33270a' },
  { key: 'green', label: 'Green', hex: '#23824c', hi: '#47b073', lo: '#12482a', ink: '#ffffff' },
  { key: 'blue', label: 'Blue', hex: '#3273cc', hi: '#5f9be8', lo: '#1c4685', ink: '#ffffff' },
  { key: 'white', label: 'White', hex: '#d8dfe6', hi: '#f2f6f9', lo: '#a9b3bd', ink: '#1b2027' },
];

export const RANKS: readonly Rank[] = [1, 2, 3, 4, 5];

export const suitOf = (key: SuitKey | null): Suit | null =>
  SUITS.find((s) => s.key === key) ?? null;

/** The card-back gradient for a given (possibly absent) color hint. */
export const cardBackground = (suit: Suit | null): string =>
  suit
    ? `linear-gradient(157deg, ${suit.hi} 0%, ${suit.hex} 46%, ${suit.lo} 100%)`
    : 'linear-gradient(157deg, #5a626d 0%, #363d46 42%, #1e2229 100%)';

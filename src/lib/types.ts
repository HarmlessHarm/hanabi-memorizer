export type SuitKey = 'red' | 'yellow' | 'green' | 'blue' | 'white';

export type Rank = 1 | 2 | 3 | 4 | 5;

export type HandSize = 4 | 5;

/**
 * A card in the player's hand. The app never knows what a card *is* — only what
 * the player has been told: at most one positive number and one positive color
 * hint (DEC-2), plus the negatives those hints imply for the cards they skipped
 * (REQ-2.5, DEC-14).
 *
 * The negatives are lists, not single values: a hand collects one per hint it
 * was not part of. They are never entered by hand — `applyHint` derives them.
 */
export interface Card {
  id: number;
  rank: Rank | null;
  suit: SuitKey | null;
  notRanks: Rank[];
  notSuits: SuitKey[];
}

export interface HandState {
  cards: Card[];
  handSize: HandSize;
  /** derive negative hints from every hint given (DEC-14); off by default */
  antiHints: boolean;
}

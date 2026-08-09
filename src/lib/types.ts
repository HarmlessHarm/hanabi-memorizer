export type SuitKey = 'red' | 'yellow' | 'green' | 'blue' | 'white';

export type Rank = 1 | 2 | 3 | 4 | 5;

export type HandSize = 4 | 5;

/**
 * A card in the player's hand. The app never knows what a card *is* — only what
 * the player has been told. Hence exactly one optional positive number hint and
 * one optional positive color hint, per DEC-2.
 *
 * Extension point (not built): negative hints (REQ-2.5) would add e.g.
 * `notRanks: Rank[]` / `notSuits: SuitKey[]` here without touching other modules.
 */
export interface Card {
  id: number;
  rank: Rank | null;
  suit: SuitKey | null;
}

export interface HandState {
  cards: Card[];
  handSize: HandSize;
}

import type { Card, Rank, SuitKey } from './types';

export type HintField = 'rank' | 'suit';

/**
 * Negative hints (REQ-2.5, DEC-14).
 *
 * A hint at the table is given to a whole hand at once — "these two are red" —
 * which is also a statement about every card it skipped. This is the one place
 * that knows it, so the hook, the sheet and the card renderer stay ignorant of
 * how a negative comes to be.
 *
 * `ids` is the set of cards the hint touched (the current selection). Re-picking
 * a value every selected card already carries means the player is correcting a
 * mis-tap, so the hint comes off — and the negatives it put on the other cards
 * come off with it. That can also lift a negative an *earlier* hint had put
 * there; Undo is the honest way back from that, and it costs one tap.
 */
export function applyHint(
  cards: Card[],
  ids: number[],
  field: HintField,
  value: Rank | SuitKey,
  antiHints: boolean,
): Card[] {
  const touched = cards.filter((c) => ids.includes(c.id));
  if (!touched.length) return cards;

  // Every selected card already has it -> this tap takes the hint away.
  const on = !touched.every((c) => c[field] === value);

  return cards.map((c) => {
    if (ids.includes(c.id)) return withHint(c, field, value, on);
    if (!antiHints) return c;
    // A card that has been told it *is* this value can't also be told it isn't.
    if (c[field] === value) return c;
    return withNegative(c, field, value, on);
  });
}

function withHint(c: Card, field: HintField, value: Rank | SuitKey, on: boolean): Card {
  return field === 'rank'
    ? { ...c, rank: on ? (value as Rank) : null, notRanks: without(c.notRanks, value as Rank) }
    : { ...c, suit: on ? (value as SuitKey) : null, notSuits: without(c.notSuits, value as SuitKey) };
}

function withNegative(c: Card, field: HintField, value: Rank | SuitKey, on: boolean): Card {
  return field === 'rank'
    ? { ...c, notRanks: toggle(c.notRanks, value as Rank, on) }
    : { ...c, notSuits: toggle(c.notSuits, value as SuitKey, on) };
}

const without = <T,>(list: T[], value: T): T[] => list.filter((v) => v !== value);

const toggle = <T,>(list: T[], value: T, on: boolean): T[] =>
  on ? (list.includes(value) ? list : [...list, value]) : without(list, value);

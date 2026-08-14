import type { Card, Rank, SuitKey } from './types';

export type HintField = 'rank' | 'suit';

/**
 * Put a hint on the selected cards, or take it off if every one of them already
 * carries it — re-picking a value is how a mis-tap is corrected (REQ-2.4).
 *
 * This touches the selection and nothing else. What the hint says about the rest
 * of the hand is settled separately, by `settleNegatives`.
 */
export function setHint(
  cards: Card[],
  ids: number[],
  field: HintField,
  value: Rank | SuitKey,
): Card[] {
  const touched = cards.filter((c) => ids.includes(c.id));
  if (!touched.length) return cards;

  const on = !allHave(touched, field, value);

  return cards.map((c) => {
    if (!ids.includes(c.id)) return c;
    return field === 'rank'
      ? { ...c, rank: on ? (value as Rank) : null, notRanks: without(c.notRanks, value as Rank) }
      : {
          ...c,
          suit: on ? (value as SuitKey) : null,
          notSuits: without(c.notSuits, value as SuitKey),
        };
  });
}

/** Whether every one of these cards carries a hint — the sheet's own "is-on" test. */
export const allHave = (cards: Card[], field: HintField, value: Rank | SuitKey): boolean =>
  cards.length > 0 && cards.every((c) => c[field] === value);

/**
 * Negative hints (REQ-2.5, DEC-14).
 *
 * A hint at the table is given to a whole hand at once — "these two are red" —
 * which is also a statement about every card it skipped. This is the one place
 * that knows it, so the hook, the sheet and the card renderer stay ignorant of
 * how a negative comes to be.
 *
 * It runs once, when the player is done picking, on the values they touched
 * while the sheet was open — never on each tap. Tapping 2 and then 3 because the
 * first was a mis-tap is one hint, not two, and the rest of the hand must not end
 * up knowing it isn't a 2 (DEC-17). Which way each value lands is read back off
 * the cards at that moment, so a value tapped on and off again settles to
 * nothing, and one taken off a card it was already on lifts the matching
 * negative from the others.
 */
export function settleNegatives(
  cards: Card[],
  ids: number[],
  ranks: Rank[],
  suits: SuitKey[],
): Card[] {
  const touched = cards.filter((c) => ids.includes(c.id));
  if (!touched.length || (!ranks.length && !suits.length)) return cards;

  const rankOn = ranks.map((r) => [r, allHave(touched, 'rank', r)] as const);
  const suitOn = suits.map((s) => [s, allHave(touched, 'suit', s)] as const);

  let changed = false;
  const next = cards.map((c) => {
    if (ids.includes(c.id)) return c;
    let out = c;
    for (const [r, on] of rankOn) {
      // A card that has been told it *is* this value can't also be told it isn't.
      if (out.rank === r) continue;
      const list = toggle(out.notRanks, r, on);
      if (list !== out.notRanks) out = { ...out, notRanks: list };
    }
    for (const [s, on] of suitOn) {
      if (out.suit === s) continue;
      const list = toggle(out.notSuits, s, on);
      if (list !== out.notSuits) out = { ...out, notSuits: list };
    }
    if (out !== c) changed = true;
    return out;
  });

  return changed ? next : cards;
}

const without = <T,>(list: T[], value: T): T[] => list.filter((v) => v !== value);

const toggle = <T,>(list: T[], value: T, on: boolean): T[] => {
  if (on) return list.includes(value) ? list : [...list, value];
  return list.includes(value) ? without(list, value) : list;
};

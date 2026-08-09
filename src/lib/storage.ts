import type { Card, HandSize, HandState, Rank, SuitKey } from './types';

// The single persistence boundary (DEC-11, REQ-4). A shared-session rewrite
// (DEC-13) or multiple-hands-per-device feature would key this differently; the
// rest of the app never touches storage, so that change stays local.
const KEY = 'hanabi:hand';

const VALID_SUITS: SuitKey[] = ['red', 'yellow', 'green', 'blue', 'white'];

let nextId = 1;

/** Monotonic, collision-free card ids across a session and across reloads. */
export const makeCard = (): Card => ({ id: nextId++, rank: null, suit: null });

export const freshHand = (size: HandSize): Card[] =>
  Array.from({ length: size }, makeCard);

const isRank = (v: unknown): v is Rank =>
  v === 1 || v === 2 || v === 3 || v === 4 || v === 5;

const isSuit = (v: unknown): v is SuitKey =>
  typeof v === 'string' && (VALID_SUITS as string[]).includes(v);

// A stored value that is absent, malformed or stale-shaped must fall back to a
// fresh hand rather than a broken screen (REQ-4.3). We validate defensively and
// bail to null on anything unexpected.
function parse(raw: string | null): HandState | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as unknown;
    if (typeof data !== 'object' || data === null) return null;
    const { cards, handSize } = data as { cards?: unknown; handSize?: unknown };
    if (!Array.isArray(cards)) return null;

    const clean: Card[] = [];
    for (const c of cards) {
      if (typeof c !== 'object' || c === null) return null;
      const { id, rank, suit } = c as Record<string, unknown>;
      if (typeof id !== 'number') return null;
      clean.push({
        id,
        rank: isRank(rank) ? rank : null,
        suit: isSuit(suit) ? suit : null,
      });
    }

    const size: HandSize = handSize === 4 ? 4 : 5;
    if (clean.length > size) return null; // stale shape
    return { cards: clean, handSize: size };
  } catch {
    return null;
  }
}

export function loadHand(): HandState {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(KEY);
  } catch {
    // localStorage can throw in private mode / disabled storage; treat as absent.
  }
  const parsed = parse(stored);
  if (parsed) {
    nextId = parsed.cards.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    return parsed;
  }
  return { cards: freshHand(5), handSize: 5 };
}

export function saveHand(state: HandState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Persistence is best-effort; a full or disabled store must not crash play.
  }
}

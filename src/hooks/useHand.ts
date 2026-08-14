import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Card, HandSize, Rank, SuitKey } from '../lib/types';
import type { HintField } from '../lib/hints';
import { setHint, settleNegatives } from '../lib/hints';
import { freshHand, loadHand, makeCard, saveHand } from '../lib/storage';

const UNDO_LIMIT = 30;

export interface HandApi {
  cards: Card[];
  handSize: HandSize;
  antiHints: boolean;
  canUndo: boolean;
  setHandSize: (n: HandSize) => void;
  setAntiHints: (on: boolean) => void;
  /** applies (or, if they all have it, removes) one hint across a selection */
  hint: (ids: number[], field: HintField, value: Rank | SuitKey) => void;
  /** the hint is finished: derive what it says about the cards it skipped */
  settleHints: (ids: number[], ranks: Rank[], suits: SuitKey[]) => void;
  removeCard: (id: number) => void;
  draw: () => void;
  reorder: (from: number, to: number) => void;
  undo: () => void;
  reset: () => void;
}

/**
 * Owns the whole hand: cards, hand size, a bounded undo stack (DEC-12) and silent
 * localStorage persistence (REQ-4). Every hand-changing action snapshots the
 * previous card order so it can be undone.
 */
export function useHand(): HandApi {
  const initial = useMemo(() => loadHand(), []);
  const [cards, setCards] = useState<Card[]>(initial.cards);
  const [handSize, setHandSizeState] = useState<HandSize>(initial.handSize);
  const [antiHints, setAntiHintsState] = useState<boolean>(initial.antiHints);
  const [past, setPast] = useState<Card[][]>([]);

  // Latest cards for use inside event handlers without stale-closure bugs.
  const cardsRef = useRef(cards);
  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  // Silent, debounced persistence (REQ-4.2). No save button, no restore prompt.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(() => saveHand({ cards, handSize, antiHints }), 250);
    return () => clearTimeout(t);
  }, [cards, handSize, antiHints]);

  const commit = useCallback((next: Card[]) => {
    setPast((p) => [...p, cardsRef.current].slice(-UNDO_LIMIT));
    setCards(next);
  }, []);

  const setHandSize = useCallback((n: HandSize) => setHandSizeState(n), []);

  // Turning negatives off leaves the ones already derived on the cards alone: it
  // stops deriving new ones and stops showing them, and turning it back on
  // restores the record rather than a hand that has silently forgotten hints.
  const setAntiHints = useCallback((on: boolean) => setAntiHintsState(on), []);

  const hint = useCallback(
    (ids: number[], field: HintField, value: Rank | SuitKey) => {
      commit(setHint(cardsRef.current, ids, field, value));
    },
    [commit],
  );

  /**
   * Deliberately *not* a commit: the negatives ride along with the hint tap that
   * produced them, so one Undo takes back the hint and everything it implied
   * rather than leaving the hand knowing things about a hint that no longer
   * exists.
   */
  const settleHints = useCallback(
    (ids: number[], ranks: Rank[], suits: SuitKey[]) => {
      if (!antiHints) return;
      const next = settleNegatives(cardsRef.current, ids, ranks, suits);
      if (next !== cardsRef.current) setCards(next);
    },
    [antiHints],
  );

  const removeCard = useCallback(
    (id: number) => commit(cardsRef.current.filter((c) => c.id !== id)),
    [commit],
  );

  // New cards enter at the left end (DEC-5); never exceed the hand size.
  const draw = useCallback(() => {
    if (cardsRef.current.length >= handSize) return;
    commit([makeCard(), ...cardsRef.current]);
  }, [commit, handSize]);

  const reorder = useCallback(
    (from: number, to: number) => {
      if (from === to) return;
      const next = cardsRef.current.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      commit(next);
    },
    [commit],
  );

  const undo = useCallback(() => {
    setPast((p) => {
      if (!p.length) return p;
      setCards(p[p.length - 1]);
      return p.slice(0, -1);
    });
  }, []);

  const reset = useCallback(() => commit(freshHand(handSize)), [commit, handSize]);

  return {
    cards,
    handSize,
    antiHints,
    canUndo: past.length > 0,
    setHandSize,
    setAntiHints,
    hint,
    settleHints,
    removeCard,
    draw,
    reorder,
    undo,
    reset,
  };
}

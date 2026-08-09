import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Card, HandSize, Rank, SuitKey } from '../lib/types';
import { freshHand, loadHand, makeCard, saveHand } from '../lib/storage';

const UNDO_LIMIT = 30;

export interface HandApi {
  cards: Card[];
  handSize: HandSize;
  canUndo: boolean;
  setHandSize: (n: HandSize) => void;
  toggleHint: (id: number, field: 'rank' | 'suit', value: Rank | SuitKey) => void;
  clearHints: (id: number) => void;
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
    const t = setTimeout(() => saveHand({ cards, handSize }), 250);
    return () => clearTimeout(t);
  }, [cards, handSize]);

  const commit = useCallback((next: Card[]) => {
    setPast((p) => [...p, cardsRef.current].slice(-UNDO_LIMIT));
    setCards(next);
  }, []);

  const setHandSize = useCallback((n: HandSize) => setHandSizeState(n), []);

  const toggleHint = useCallback(
    (id: number, field: 'rank' | 'suit', value: Rank | SuitKey) => {
      commit(
        cardsRef.current.map((c) =>
          c.id === id ? { ...c, [field]: c[field] === value ? null : value } : c,
        ),
      );
    },
    [commit],
  );

  const clearHints = useCallback(
    (id: number) => {
      commit(
        cardsRef.current.map((c) => (c.id === id ? { ...c, rank: null, suit: null } : c)),
      );
    },
    [commit],
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
    canUndo: past.length > 0,
    setHandSize,
    toggleHint,
    clearHints,
    removeCard,
    draw,
    reorder,
    undo,
    reset,
  };
}

import { useCallback, useState } from 'react';
import type { Rank, SuitKey } from './lib/types';
import type { HintField } from './lib/hints';
import { hasSeenMultiHintTip, markMultiHintTipSeen } from './lib/storage';
import { useHand } from './hooks/useHand';
import { Header } from './components/Header';
import { Hand } from './components/Hand';
import { HintSheet } from './components/HintSheet';

/** The values picked while one hint sheet was open, in tap order. */
interface Touched {
  ranks: Rank[];
  suits: SuitKey[];
}

const NOTHING_TOUCHED: Touched = { ranks: [], suits: [] };

export default function App() {
  const hand = useHand();

  // Transient UI state — which cards the open sheet is about. A hint at the
  // table names several cards at once, so this is a set and the sheet stays up
  // while it grows. The numeral pop is owned by the card it belongs to.
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [tipSeen, setTipSeen] = useState(hasSeenMultiHintTip);
  const [tip, setTip] = useState(false);

  // Which values this sheet has been shown, so the negatives can be worked out
  // once at the end from where they landed — not on every tap, which would tell
  // the rest of the hand about a 2 the player only touched by accident.
  const [touched, setTouched] = useState<Touched>(NOTHING_TOUCHED);

  // Read back off the hand rather than trusted as stored, so a card discarded
  // while it was selected simply drops out of the selection.
  const selected = hand.cards.filter((c) => selectedIds.includes(c.id));
  const positions = selected.map((c) => hand.cards.indexOf(c));
  const liveIds = selected.map((c) => c.id);

  /** Puts the sheet away without settling — for Undo and Reset. */
  const drop = useCallback(() => {
    setSelectedIds([]);
    setTouched(NOTHING_TOUCHED);
    setTip(false);
  }, []);

  /** The player is done picking: the hint is now given, so let it speak for the
   *  cards it skipped. */
  const closeSheet = useCallback(() => {
    hand.settleHints(liveIds, touched.ranks, touched.suits);
    drop();
  }, [drop, hand, liveIds, touched]);

  const onTapCard = useCallback(
    (id: number) => {
      // A sheet opening on an empty selection starts a fresh hint. (The old one
      // is already settled, unless its last card was discarded out from under it.)
      if (!liveIds.length) setTouched(NOTHING_TOUCHED);

      const next = selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id];
      setSelectedIds(next);

      // Nothing on screen says a second card can join the first, so say it once,
      // at the only moment it is actionable, and never again on this device.
      if (next.length === 1 && !tipSeen) {
        setTipSeen(true);
        markMultiHintTipSeen();
        setTip(true);
      } else if (next.length !== 1) {
        setTip(false);
      }
    },
    [liveIds.length, selectedIds, tipSeen],
  );

  const toggleHint = (field: HintField, value: Rank | SuitKey) => {
    if (!liveIds.length) return;
    setTip(false);
    hand.hint(liveIds, field, value);
    setTouched((t) => {
      if (field === 'rank') {
        const v = value as Rank;
        return t.ranks.includes(v) ? t : { ...t, ranks: [...t.ranks, v] };
      }
      const v = value as SuitKey;
      return t.suits.includes(v) ? t : { ...t, suits: [...t.suits, v] };
    });
  };

  /** A derived negative that turned out to be wrong: take it off, no settling. */
  const clearNegative = (field: HintField, value: Rank | SuitKey) => {
    if (!liveIds.length) return;
    setTip(false);
    hand.clearNegative(liveIds, field, value);
  };

  const undo = () => {
    drop();
    hand.undo();
  };

  const reset = () => {
    drop();
    hand.reset();
  };

  return (
    <div className="app">
      <Header
        handSize={hand.handSize}
        antiHints={hand.antiHints}
        canUndo={hand.canUndo}
        onHandSize={hand.setHandSize}
        onAntiHints={hand.setAntiHints}
        onUndo={undo}
        onReset={reset}
      />

      <Hand
        cards={hand.cards}
        handSize={hand.handSize}
        selectedIds={liveIds}
        showAntiHints={hand.antiHints}
        tip={tip && selected.length > 0}
        onTap={onTapCard}
        onDiscard={hand.removeCard}
        onReorder={hand.reorder}
        onDraw={hand.draw}
      />

      {selected.length > 0 && (
        <HintSheet
          cards={selected}
          positions={positions}
          onToggle={toggleHint}
          onClearNegative={clearNegative}
          showAntiHints={hand.antiHints}
          onClose={closeSheet}
        />
      )}
    </div>
  );
}

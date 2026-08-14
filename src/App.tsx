import { useCallback, useState } from 'react';
import type { Rank, SuitKey } from './lib/types';
import { hasSeenMultiHintTip, markMultiHintTipSeen } from './lib/storage';
import { useHand } from './hooks/useHand';
import { Header } from './components/Header';
import { Hand } from './components/Hand';
import { HintSheet } from './components/HintSheet';

export default function App() {
  const hand = useHand();

  // Transient UI state — which cards the open sheet is about. A hint at the
  // table names several cards at once, so this is a set and the sheet stays up
  // while it grows. The numeral pop is owned by the card it belongs to.
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [tipSeen, setTipSeen] = useState(hasSeenMultiHintTip);
  const [tip, setTip] = useState(false);

  // Read back off the hand rather than trusted as stored, so a card discarded
  // while it was selected simply drops out of the selection.
  const selected = hand.cards.filter((c) => selectedIds.includes(c.id));
  const positions = selected.map((c) => hand.cards.indexOf(c));
  const liveIds = selected.map((c) => c.id);

  const clear = useCallback(() => {
    setSelectedIds([]);
    setTip(false);
  }, []);

  const onTapCard = useCallback(
    (id: number) => {
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
    [selectedIds, tipSeen],
  );

  const toggleHint = (field: 'rank' | 'suit', value: Rank | SuitKey) => {
    if (!selected.length) return;
    setTip(false);
    hand.hint(
      selected.map((c) => c.id),
      field,
      value,
    );
  };

  const undo = () => {
    clear();
    hand.undo();
  };

  const reset = () => {
    clear();
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
          onClose={clear}
        />
      )}
    </div>
  );
}

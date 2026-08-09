import { useState } from 'react';
import type { Rank, SuitKey } from './lib/types';
import { useHand } from './hooks/useHand';
import { Header } from './components/Header';
import { Hand } from './components/Hand';
import { HintSheet } from './components/HintSheet';
import { DiscardConfirm } from './components/DiscardConfirm';

export default function App() {
  const hand = useHand();

  // Transient UI state — which card's sheet is open, which card is pending
  // discard confirmation, and a counter to re-play the numeral pop on each hint.
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [leavingId, setLeavingId] = useState<number | null>(null);
  const [pop, setPop] = useState(0);

  const selected = hand.cards.find((c) => c.id === selectedId) ?? null;
  const selectedIndex = hand.cards.findIndex((c) => c.id === selectedId);

  const toggleHint = (field: 'rank' | 'suit', value: Rank | SuitKey) => {
    if (selectedId === null) return;
    hand.toggleHint(selectedId, field, value);
    setPop((n) => n + 1);
  };

  const undo = () => {
    setSelectedId(null);
    hand.undo();
  };

  const reset = () => {
    setSelectedId(null);
    hand.reset();
  };

  const discard = () => {
    if (leavingId === null) return;
    hand.removeCard(leavingId);
    setLeavingId(null);
  };

  return (
    <div className="app">
      <Header
        handSize={hand.handSize}
        canUndo={hand.canUndo}
        onHandSize={hand.setHandSize}
        onUndo={undo}
        onReset={reset}
      />

      <Hand
        cards={hand.cards}
        handSize={hand.handSize}
        selectedId={selectedId}
        leavingId={leavingId}
        pop={pop}
        onTap={setSelectedId}
        onDiscardIntent={setLeavingId}
        onReorder={hand.reorder}
        onDraw={hand.draw}
      />

      {leavingId !== null && (
        <DiscardConfirm onKeep={() => setLeavingId(null)} onDiscard={discard} />
      )}

      {selected && (
        <HintSheet
          card={selected}
          index={selectedIndex}
          onToggle={toggleHint}
          onClear={() => hand.clearHints(selected.id)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

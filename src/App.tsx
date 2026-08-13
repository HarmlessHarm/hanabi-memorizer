import { useState } from 'react';
import type { Rank, SuitKey } from './lib/types';
import { useHand } from './hooks/useHand';
import { Header } from './components/Header';
import { Hand } from './components/Hand';
import { HintSheet } from './components/HintSheet';

export default function App() {
  const hand = useHand();

  // Transient UI state — which card's sheet is open. The numeral pop is owned by
  // the card it belongs to.
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selected = hand.cards.find((c) => c.id === selectedId) ?? null;
  const selectedIndex = hand.cards.findIndex((c) => c.id === selectedId);

  const toggleHint = (field: 'rank' | 'suit', value: Rank | SuitKey) => {
    if (selectedId === null) return;
    hand.toggleHint(selectedId, field, value);
  };

  const undo = () => {
    setSelectedId(null);
    hand.undo();
  };

  const reset = () => {
    setSelectedId(null);
    hand.reset();
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
        onTap={setSelectedId}
        onDiscard={hand.removeCard}
        onReorder={hand.reorder}
        onDraw={hand.draw}
      />

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

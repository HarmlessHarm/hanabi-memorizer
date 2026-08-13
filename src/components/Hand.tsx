import type { Card as CardModel, HandSize } from '../lib/types';
import { computeMetrics } from '../lib/layout';
import { useStageSize } from '../hooks/useStageSize';
import { useHandDrag } from '../hooks/useHandDrag';
import { Card } from './Card';
import { DiscardZone } from './DiscardZone';
import { PressButton } from './PressButton';

interface Props {
  cards: CardModel[];
  handSize: HandSize;
  selectedId: number | null;
  onTap: (id: number) => void;
  onDiscard: (id: number) => void;
  onReorder: (from: number, to: number) => void;
  onDraw: () => void;
}

// The hand IS the screen (ux-design.md): a discard zone above, then one row of
// cards, with empty positions rendered as draw slots (REQ-1.1).
export function Hand({
  cards,
  handSize,
  selectedId,
  onTap,
  onDiscard,
  onReorder,
  onDraw,
}: Props) {
  const [stageRef, box] = useStageSize();
  const metrics = computeMetrics(box, handSize);

  const drag = useHandDrag({
    cards,
    metrics,
    // Freeze dragging while a sheet is open, so a modal tap can't start a drag.
    enabled: selectedId === null,
    onReorder,
    onDiscard,
  });

  const { cardW, cardH, zoneH } = metrics;
  const empty = Math.max(0, handSize - cards.length);
  const ready = box.w > 0;

  return (
    <main ref={stageRef} className="stage">
      <DiscardZone height={zoneH} active={drag.dragging} armed={drag.zoneArmed} />

      <div className="row" style={{ height: cardH, visibility: ready ? 'visible' : 'hidden' }}>
        {Array.from({ length: empty }).map((_, k) => (
          <PressButton
            key={`slot-${k}`}
            className="slot"
            style={{ width: cardW, height: cardH }}
            onPress={onDraw}
            aria-label="Draw a card"
          >
            <span style={{ fontSize: cardH * 0.2, lineHeight: 1 }}>+</span>
            <span className="slot-label">Draw</span>
          </PressButton>
        ))}

        {cards.map((c, i) => {
          const dimmed = selectedId !== null && c.id !== selectedId;
          const focus = c.id === selectedId;
          return (
            <Card
              key={c.id}
              card={c}
              index={i}
              cardW={cardW}
              cardH={cardH}
              drag={drag}
              transform={drag.transformFor(i)}
              dimmed={dimmed}
              focus={focus}
              tappable={selectedId === null}
              onTap={onTap}
            />
          );
        })}
      </div>
    </main>
  );
}

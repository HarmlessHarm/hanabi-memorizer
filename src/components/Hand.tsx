import type { Card as CardModel, HandSize } from '../lib/types';
import { computeMetrics } from '../lib/layout';
import { useStageSize } from '../hooks/useStageSize';
import { useHandDrag } from '../hooks/useHandDrag';
import { Card } from './Card';
import { DiscardZone } from './DiscardZone';

interface Props {
  cards: CardModel[];
  handSize: HandSize;
  selectedId: number | null;
  leavingId: number | null;
  pop: number;
  onTap: (id: number) => void;
  onDiscardIntent: (id: number) => void;
  onReorder: (from: number, to: number) => void;
  onDraw: () => void;
}

// The hand IS the screen (ux-design.md): a discard zone above, then one row of
// cards, with empty positions rendered as draw slots (REQ-1.1).
export function Hand({
  cards,
  handSize,
  selectedId,
  leavingId,
  pop,
  onTap,
  onDiscardIntent,
  onReorder,
  onDraw,
}: Props) {
  const [stageRef, box] = useStageSize();
  const metrics = computeMetrics(box, handSize);

  const drag = useHandDrag({
    cards,
    metrics,
    // Freeze dragging while a sheet is open, so a modal tap can't start a drag.
    enabled: selectedId === null && leavingId === null,
    onTap,
    onReorder,
    onDiscardIntent,
  });

  const { cardW, cardH, zoneH } = metrics;
  const empty = Math.max(0, handSize - cards.length);
  const ready = box.w > 0;

  return (
    <main ref={stageRef} className="stage">
      <DiscardZone height={zoneH} active={drag.dragging} armed={drag.zoneArmed} />

      <div className="row" style={{ height: cardH, visibility: ready ? 'visible' : 'hidden' }}>
        {Array.from({ length: empty }).map((_, k) => (
          <button
            key={`slot-${k}`}
            className="slot"
            style={{ width: cardW, height: cardH }}
            onClick={onDraw}
            aria-label="Draw a card"
          >
            <span style={{ fontSize: cardH * 0.2, lineHeight: 1 }}>+</span>
            <span className="slot-label">Draw</span>
          </button>
        ))}

        {cards.map((c, i) => {
          const dimmed =
            (selectedId !== null && c.id !== selectedId) ||
            (leavingId !== null && c.id !== leavingId);
          const focus = c.id === selectedId || c.id === leavingId;
          return (
            <Card
              key={c.id}
              card={c}
              cardW={cardW}
              cardH={cardH}
              pointerProps={drag.getCardProps(i)}
              transform={drag.transformFor(i)}
              dimmed={dimmed}
              focus={focus}
              pop={pop}
            />
          );
        })}
      </div>
    </main>
  );
}

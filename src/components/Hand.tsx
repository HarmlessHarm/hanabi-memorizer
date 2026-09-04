import type { CSSProperties } from 'react';
import type { Card as CardModel, HandSize } from '../lib/types';
import { computeMetrics } from '../lib/layout';
import { useStageSize } from '../hooks/useStageSize';
import { useHandDrag } from '../hooks/useHandDrag';
import { Card } from './Card';
import { DiscardZone } from './DiscardZone';

interface Props {
  cards: CardModel[];
  handSize: HandSize;
  selectedIds: number[];
  showAntiHints: boolean;
  /** the one-off "you can pick more than one" nudge, shown above the hand */
  tip: boolean;
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
  selectedIds,
  showAntiHints,
  tip,
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
    onTap,
    onReorder,
    onDiscard,
  });

  const { cardW, cardH, zoneH } = metrics;
  const empty = Math.max(0, handSize - cards.length);
  const ready = box.w > 0;

  // A hint can name several cards, so the hand has to stay reachable while the
  // sheet is up: lift the row over the sheet's backdrop, but leave it under the
  // sheet itself, which on a short screen sits across the bottom of the cards.
  const rowStyle: CSSProperties = {
    height: cardH,
    visibility: ready ? 'visible' : 'hidden',
    ...(selectedIds.length ? { position: 'relative', zIndex: 55 } : null),
  };

  // Landscape has no room for the discard zone, the hand and the sheet at once,
  // so while a hint is being picked the stage drops the zone and packs the cards
  // against its top edge, leaving them standing above the panel (DEC-19). In
  // portrait the class is inert — the sheet clears the hand there already.
  const picking = selectedIds.length > 0;

  return (
    <main ref={stageRef} className={picking ? 'stage is-picking' : 'stage'}>
      <DiscardZone height={zoneH} active={drag.dragging} armed={drag.zoneArmed} />

      <div className="row" style={rowStyle}>
        {tip && (
          <div className="tip" role="status">
            Tap more cards to hint them together
          </div>
        )}

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
          const selected = selectedIds.includes(c.id);
          return (
            <Card
              key={c.id}
              card={c}
              cardW={cardW}
              cardH={cardH}
              pointerProps={drag.getCardProps(i)}
              transform={drag.transformFor(i)}
              dimmed={selectedIds.length > 0 && !selected}
              focus={selected}
              showAntiHints={showAntiHints}
            />
          );
        })}
      </div>
    </main>
  );
}

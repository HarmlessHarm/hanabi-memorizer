import type { CSSProperties } from 'react';
import type { Card as CardModel } from '../lib/types';
import { cardBackground, suitOf } from '../lib/suits';
import type { CardPointerProps } from '../hooks/useHandDrag';
import { Burst } from './Burst';

interface Props {
  card: CardModel;
  cardW: number;
  cardH: number;
  pointerProps: CardPointerProps;
  transform: CSSProperties;
  dimmed: boolean;
  focus: boolean;
  /** bumped on every hint change so the numeral re-plays its pop (ux-design.md) */
  pop: number;
}

// A card back IS the hint (DEC-6): the color hint floods the whole card, the
// number hint is one oversized centred numeral. No hints -> a neutral dark back.
export function Card({ card, cardW, cardH, pointerProps, transform, dimmed, focus, pop }: Props) {
  const suit = suitOf(card.suit);
  const style: CSSProperties = {
    ...transform,
    width: cardW,
    height: cardH,
    borderRadius: Math.round(cardH * 0.09),
    background: cardBackground(suit),
    opacity: dimmed ? 0.3 : 1,
    marginTop: focus ? -12 : 0,
    boxShadow: focus
      ? '0 18px 34px rgba(0,0,0,.6), 0 0 0 2px #e7ecf2'
      : '0 10px 20px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.1)',
  };

  return (
    <div className="card" style={style} {...pointerProps}>
      <Burst tint={suit ? suit.ink : '#c9d2dd'} />
      {card.rank && (
        <span
          key={`${card.rank}-${pop}`}
          className="rank is-pop"
          style={{
            fontSize: cardH * 0.46,
            color: suit ? suit.ink : '#ffffff',
            textShadow: suit && suit.ink === '#ffffff' ? '0 2px 10px rgba(0,0,0,.35)' : 'none',
          }}
        >
          {card.rank}
        </span>
      )}
    </div>
  );
}

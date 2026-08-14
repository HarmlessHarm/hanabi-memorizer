import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Card as CardModel, Rank } from '../lib/types';
import { cardBackground, suitOf } from '../lib/suits';
import type { CardPointerProps } from '../hooks/useHandDrag';
import { AntiHints } from './AntiHints';
import { Burst } from './Burst';

interface Props {
  card: CardModel;
  cardW: number;
  cardH: number;
  pointerProps: CardPointerProps;
  transform: CSSProperties;
  dimmed: boolean;
  focus: boolean;
  /** negatives are recorded whether or not they are shown; this is the setting */
  showAntiHints: boolean;
}

/**
 * A token that changes each time *this* card's number changes and clears again
 * once the pop has played, so the numeral only carries `is-pop` while it is
 * actually animating.
 *
 * Both halves matter. Per-card, because motion confirms the action that just
 * landed (ux-design.md) — a hint placed on one card must not set every numeral
 * on the table animating. Transient, because a finished CSS animation replays
 * whenever the browser re-inserts the node, and re-inserting nodes is exactly
 * how a reorder moves cards around: a numeral that always carries the class
 * pops again every time its card, or a card shuffling past it, changes place.
 */
function usePop(rank: Rank | null): [number | null, () => void] {
  const [pop, setPop] = useState<number | null>(null);
  const seq = useRef(0);
  const prev = useRef(rank);

  useEffect(() => {
    const changed = rank !== prev.current;
    prev.current = rank;
    // Nothing to confirm when the number is cleared, and a number restored from
    // storage on load was not an action taken just now.
    if (!changed || rank === null) return;
    seq.current += 1;
    setPop(seq.current);
  }, [rank]);

  return [pop, useCallback(() => setPop(null), [])];
}

// A card back IS the hint (DEC-6): the color hint floods the whole card, the
// number hint is one oversized centred numeral. No hints -> a neutral dark back.
export function Card({
  card,
  cardW,
  cardH,
  pointerProps,
  transform,
  dimmed,
  focus,
  showAntiHints,
}: Props) {
  const suit = suitOf(card.suit);
  const [pop, popPlayed] = usePop(card.rank);
  const style: CSSProperties = {
    ...transform,
    width: cardW,
    height: cardH,
    borderRadius: Math.round(cardH * 0.09),
    background: cardBackground(suit),
    // Unpicked cards recede but stay readable and tappable: they are the ones
    // you reach for to add a second card to the hint.
    opacity: dimmed ? 0.55 : 1,
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
          // A fresh token remounts the numeral, which restarts the animation
          // even when a second hint lands before the first pop has finished.
          key={pop ?? 'idle'}
          className={pop === null ? 'rank' : 'rank is-pop'}
          onAnimationEnd={popPlayed}
          style={{
            fontSize: cardH * 0.46,
            color: suit ? suit.ink : '#ffffff',
            textShadow: suit && suit.ink === '#ffffff' ? '0 2px 10px rgba(0,0,0,.35)' : 'none',
          }}
        >
          {card.rank}
        </span>
      )}

      {/* Once a card knows its number, "not a 2" is noise — same for its colour. */}
      {showAntiHints && (
        <AntiHints
          ranks={card.rank ? [] : card.notRanks}
          suits={card.suit ? [] : card.notSuits}
          size={Math.min(Math.round(cardW * 0.2), 26)}
        />
      )}
    </div>
  );
}

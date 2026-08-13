import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { usePress } from '@react-aria/interactions';
import { mergeProps } from '@react-aria/utils';
import type { Card as CardModel, Rank } from '../lib/types';
import { cardBackground, suitOf } from '../lib/suits';
import type { HandDragApi } from '../hooks/useHandDrag';
import { Burst } from './Burst';

interface Props {
  card: CardModel;
  /** 0-based position in the hand, for the "Card N from the left" label */
  index: number;
  cardW: number;
  cardH: number;
  drag: HandDragApi;
  transform: CSSProperties;
  dimmed: boolean;
  focus: boolean;
  /** taps are frozen while a sheet is open, so a modal tap can't reach a card */
  tappable: boolean;
  onTap: (id: number) => void;
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

/** What a screen reader reads out for a card that shows its hints visually. */
function describe(card: CardModel, index: number): string {
  const suit = suitOf(card.suit);
  const hints = [suit?.label, card.rank && `number ${card.rank}`].filter(Boolean).join(', ');
  return `Card ${index + 1} from the left, ${hints || 'no hints'}`;
}

// A card back IS the hint (DEC-6): the color hint floods the whole card, the
// number hint is one oversized centred numeral. No hints -> a neutral dark back.
export function Card({
  card,
  index,
  cardW,
  cardH,
  drag,
  transform,
  dimmed,
  focus,
  tappable,
  onTap,
}: Props) {
  const suit = suitOf(card.suit);
  const [pop, popPlayed] = usePop(card.rank);

  // The tap half of the card's one dual-purpose gesture (DEC-14). usePress is
  // what makes the card a button rather than a div that happens to react to a
  // finger: Enter and Space work, a screen reader can activate it, and the
  // browser's emulated-mouse replay after a tap is handled by the hook rather
  // than by cancelling touchend by hand.
  const { pressProps } = usePress({
    isDisabled: !tappable,
    onPressStart: drag.pressStarted,
    onPress: () => {
      // A drag ends over the card it moved; only a gesture that stayed put is a tap.
      if (!drag.pressWasDrag()) onTap(card.id);
    },
  });
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
    <div
      className="card"
      role="button"
      tabIndex={tappable ? 0 : -1}
      aria-label={describe(card, index)}
      style={style}
      {...mergeProps(pressProps, drag.bindCard(index))}
    >
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
    </div>
  );
}

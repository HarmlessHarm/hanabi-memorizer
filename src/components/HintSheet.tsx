import type { Card } from '../lib/types';
import type { Rank, SuitKey } from '../lib/types';
import { RANKS, SUITS, suitOf } from '../lib/suits';
import { PressButton } from './PressButton';
import { Sheet } from './Sheet';

interface Props {
  card: Card;
  /** 0-based position of the card, for the "Card N from the left" eyebrow */
  index: number;
  onToggle: (field: 'rank' | 'suit', value: Rank | SuitKey) => void;
  onClose: () => void;
}

// The bottom sheet that opens on tapping a card (REQ-2). Two-taps-per-card budget:
// tap card, tap the hint. Re-tapping an assigned hint removes it (REQ-2.4).
export function HintSheet({ card, index, onToggle, onClose }: Props) {
  const summary =
    card.suit || card.rank
      ? [suitOf(card.suit)?.label, card.rank].filter(Boolean).join(' ')
      : 'No hints yet';

  return (
    <Sheet onDismiss={onClose}>
      <div className="sheet-head">
        <div>
          <div className="sheet-eyebrow">Card {index + 1} from the left</div>
          <div className="sheet-title">{summary}</div>
        </div>
      </div>

      {/* The sheet closes itself on a tap outside, but a hint tap lands close to
          the sheet edge, so the deliberate way out gets a big centred target
          sitting above the hints — within thumb reach, hard to miss. */}
      <PressButton className="sheet-ok" onPress={onClose}>
        OK
      </PressButton>

      <div className="groups">
        <div className="group">
          <div className="group-label">Number</div>
          <div className="pick-row">
            {RANKS.map((n) => (
              <PressButton
                key={n}
                className={`pick${card.rank === n ? ' is-on' : ''}`}
                aria-pressed={card.rank === n}
                onPress={() => onToggle('rank', n)}
              >
                {n}
              </PressButton>
            ))}
          </div>
        </div>

        <div className="group">
          <div className="group-label">Color</div>
          <div className="pick-row">
            {SUITS.map((s) => (
              <PressButton
                key={s.key}
                className="swatch"
                aria-label={s.label}
                aria-pressed={card.suit === s.key}
                onPress={() => onToggle('suit', s.key)}
                style={{
                  background: s.hex,
                  color: s.ink,
                  boxShadow:
                    card.suit === s.key
                      ? `0 0 0 3px #12161c, 0 0 0 6px ${s.hi}`
                      : '0 2px 6px rgba(0,0,0,.4)',
                }}
              >
                {card.suit === s.key ? '✓' : ''}
              </PressButton>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

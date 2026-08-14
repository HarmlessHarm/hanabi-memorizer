import type { Card, Rank, SuitKey } from '../lib/types';
import { RANKS, SUITS, suitOf } from '../lib/suits';
import { Sheet } from './Sheet';

interface Props {
  /** the selected cards, in hand order */
  cards: Card[];
  /** their 0-based positions in the hand, same order */
  positions: number[];
  onToggle: (field: 'rank' | 'suit', value: Rank | SuitKey) => void;
  onClose: () => void;
}

/** Whether every, some or none of the selected cards carries a given hint. */
type Held = 'all' | 'some' | 'none';

const held = (flags: boolean[]): Held =>
  flags.every(Boolean) ? 'all' : flags.some(Boolean) ? 'some' : 'none';

const pressed = (h: Held) => (h === 'all' ? true : h === 'some' ? 'mixed' : false);

// The bottom sheet that opens on tapping a card (REQ-2). Two-taps-per-card budget:
// tap card, tap the hint. A real hint names several cards at once, so the sheet
// works on the whole selection: picking a value every selected card already has
// takes it off again (REQ-2.4).
export function HintSheet({ cards, positions, onToggle, onClose }: Props) {
  const one = cards.length === 1;

  const where = `${one ? 'Card' : 'Cards'} ${list(positions.map((p) => p + 1))} from the left`;

  const summary = one
    ? cards[0].suit || cards[0].rank
      ? [suitOf(cards[0].suit)?.label, cards[0].rank].filter(Boolean).join(' ')
      : 'No hints yet'
    : `${cards.length} cards selected`;

  return (
    <Sheet onDismiss={onClose}>
      <div className="sheet-head">
        <div>
          <div className="sheet-eyebrow">{where}</div>
          <div className="sheet-title">{summary}</div>
        </div>
      </div>

      {/* The sheet closes itself on a tap outside, but a hint tap lands close to
          the sheet edge, so the deliberate way out gets a big centred target
          sitting above the hints — within thumb reach, hard to miss. */}
      <button className="sheet-ok" onClick={onClose}>
        OK
      </button>

      <div className="groups">
        <div className="group">
          <div className="group-label">Number</div>
          <div className="pick-row">
            {RANKS.map((n) => {
              const h = held(cards.map((c) => c.rank === n));
              return (
                <button
                  key={n}
                  className={`pick${h === 'all' ? ' is-on' : h === 'some' ? ' is-part' : ''}`}
                  aria-pressed={pressed(h)}
                  onClick={() => onToggle('rank', n)}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        <div className="group">
          <div className="group-label">Color</div>
          <div className="pick-row">
            {SUITS.map((s) => {
              const h = held(cards.map((c) => c.suit === s.key));
              return (
                <button
                  key={s.key}
                  className="swatch"
                  aria-label={s.label}
                  aria-pressed={pressed(h)}
                  onClick={() => onToggle('suit', s.key)}
                  style={{
                    background: s.hex,
                    color: s.ink,
                    boxShadow:
                      h === 'all'
                        ? `0 0 0 3px #12161c, 0 0 0 6px ${s.hi}`
                        : h === 'some'
                          ? `0 0 0 3px #12161c, 0 0 0 6px ${s.lo}`
                          : '0 2px 6px rgba(0,0,0,.4)',
                  }}
                >
                  {h === 'all' ? '✓' : h === 'some' ? '–' : ''}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

/** "1", "1 & 3", "1, 3 & 4" */
function list(ns: number[]): string {
  if (ns.length < 2) return String(ns[0] ?? '');
  return `${ns.slice(0, -1).join(', ')} & ${ns[ns.length - 1]}`;
}

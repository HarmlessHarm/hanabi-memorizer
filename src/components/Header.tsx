import type { HandSize } from '../lib/types';

interface Props {
  handSize: HandSize;
  canUndo: boolean;
  onHandSize: (n: HandSize) => void;
  onUndo: () => void;
  onReset: () => void;
}

// Everything that isn't a card lives here, deliberately recessive (ux-design.md):
// hand-size toggle (REQ-3.4), Undo (REQ-3.6, DEC-12) and Reset (REQ-3.5).
export function Header({ handSize, canUndo, onHandSize, onUndo, onReset }: Props) {
  return (
    <header className="header">
      <div className="brand">
        <span className="wordmark">HANABI</span>
        <span className="subtitle">hints on the back</span>
      </div>
      <div className="controls">
        <div className="segment" role="group" aria-label="Hand size">
          {([4, 5] as HandSize[]).map((n) => (
            <button
              key={n}
              className={`seg-btn${handSize === n ? ' is-on' : ''}`}
              aria-pressed={handSize === n}
              onClick={() => onHandSize(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <button className="chip" onClick={onUndo} disabled={!canUndo}>
          Undo
        </button>
        <button className="chip" onClick={onReset}>
          Reset
        </button>
      </div>
    </header>
  );
}

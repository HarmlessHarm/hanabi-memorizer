import type { HandSize } from '../lib/types';
import { SettingsMenu } from './SettingsMenu';

interface Props {
  handSize: HandSize;
  antiHints: boolean;
  canUndo: boolean;
  onHandSize: (n: HandSize) => void;
  onAntiHints: (on: boolean) => void;
  onUndo: () => void;
  onReset: () => void;
}

// Everything that isn't a card lives here, deliberately recessive (ux-design.md).
// Undo (REQ-3.6, DEC-12) is the only control worth standing space: it is used
// mid-turn, in a hurry, after a misdrag. The rest is set once and hides behind
// the cogwheel.
export function Header({
  handSize,
  antiHints,
  canUndo,
  onHandSize,
  onAntiHints,
  onUndo,
  onReset,
}: Props) {
  return (
    <header className="header">
      <div className="brand">
        <span className="wordmark">HANABI</span>
        <span className="subtitle">hints on the back</span>
      </div>
      <div className="controls">
        <button className="chip" onClick={onUndo} disabled={!canUndo}>
          Undo
        </button>
        <SettingsMenu
          handSize={handSize}
          antiHints={antiHints}
          onHandSize={onHandSize}
          onAntiHints={onAntiHints}
          onReset={onReset}
        />
      </div>
    </header>
  );
}

import { useEffect, useRef, useState } from 'react';
import type { HandSize } from '../lib/types';
import { InstallControl } from './InstallControl';

interface Props {
  handSize: HandSize;
  antiHints: boolean;
  onHandSize: (n: HandSize) => void;
  onAntiHints: (on: boolean) => void;
  onReset: () => void;
}

/**
 * Everything you set once and then forget, behind one cogwheel: hand size
 * (REQ-3.4), anti-hints (DEC-14), Install and Reset (REQ-3.5). Only Undo earns
 * a permanent place in the header — it is the one control you reach for mid-turn.
 *
 * Dismissal listens on the document instead of using a full-screen backdrop, on
 * purpose. A backdrop that appears under the finger during a tap catches the
 * phantom mouse click a touchscreen fires a few ms later and closes the menu the
 * tap just opened — the same bug the hint sheet had. The phantom click lands on
 * the cogwheel, which is inside this wrapper, so containment settles it with no
 * timers.
 */
export function SettingsMenu({
  handSize,
  antiHints,
  onHandSize,
  onAntiHints,
  onReset,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="menu-wrap" ref={wrap}>
      <button
        className={`chip chip-icon${open ? ' is-on' : ''}`}
        aria-label="Settings"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" className="cog" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3.2" />
            <path d="M19.1 14.6a1.6 1.6 0 0 0 .32 1.77l.06.06a1.94 1.94 0 1 1-2.75 2.75l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-.97 1.47v.17a1.94 1.94 0 1 1-3.88 0v-.09a1.6 1.6 0 0 0-1.03-1.46 1.6 1.6 0 0 0-1.77.32l-.06.06a1.94 1.94 0 1 1-2.75-2.75l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-.97H3.1a1.94 1.94 0 1 1 0-3.88h.09a1.6 1.6 0 0 0 1.46-1.03 1.6 1.6 0 0 0-.32-1.77l-.06-.06a1.94 1.94 0 1 1 2.75-2.75l.06.06a1.6 1.6 0 0 0 1.77.32h.08a1.6 1.6 0 0 0 .97-1.47V3.1a1.94 1.94 0 1 1 3.88 0v.09a1.6 1.6 0 0 0 .97 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a1.94 1.94 0 1 1 2.75 2.75l-.06.06a1.6 1.6 0 0 0-.32 1.77v.08a1.6 1.6 0 0 0 1.47.97h.17a1.94 1.94 0 1 1 0 3.88h-.09a1.6 1.6 0 0 0-1.47.97z" />
          </g>
        </svg>
      </button>

      {open && (
        <div className="menu" role="menu">
          <div className="menu-row">
            <span className="menu-label">Hand size</span>
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
          </div>

          <div className="menu-row">
            <span className="menu-label">
              Anti-hints
              <small className="menu-note">Mark what a hint says the other cards aren't</small>
            </span>
            <button
              className={`switch${antiHints ? ' is-on' : ''}`}
              role="switch"
              aria-checked={antiHints}
              aria-label="Anti-hints"
              onClick={() => onAntiHints(!antiHints)}
            >
              <span className="knob" />
            </button>
          </div>

          <div className="menu-sep" />

          <InstallControl />

          <button
            className="menu-item is-danger"
            onClick={() => {
              setOpen(false);
              onReset();
            }}
          >
            Reset hand
          </button>
        </div>
      )}
    </div>
  );
}

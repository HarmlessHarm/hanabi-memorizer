import { useState } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

// A compact header chip that only appears when the app can actually be installed
// and isn't already. Tapping either fires the native prompt (Chromium) or shows
// the iOS Add-to-Home-Screen steps.
export function InstallControl() {
  const { canPrompt, iosHint, installed, promptInstall } = useInstallPrompt();
  const [showIos, setShowIos] = useState(false);

  if (installed || (!canPrompt && !iosHint)) return null;

  const onClick = () => {
    if (canPrompt) void promptInstall();
    else setShowIos(true);
  };

  return (
    <>
      <button className="chip chip-install" onClick={onClick} aria-label="Install app">
        <svg className="install-glyph" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 3v10m0 0 4-4m-4 4-4-4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="install-text">Install</span>
      </button>

      {showIos && (
        <div className="scrim" onClick={() => setShowIos(false)}>
          <div className="sheet chooser" onClick={(e) => e.stopPropagation()}>
            <div className="chooser-title">Add to your Home Screen</div>
            <p className="ios-steps">
              In Safari, tap the <b>Share</b> button, then choose{' '}
              <b>Add to Home Screen</b>. Hanabi opens full-screen and works offline.
            </p>
            <div className="actions">
              <button className="action action-ghost" onClick={() => setShowIos(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

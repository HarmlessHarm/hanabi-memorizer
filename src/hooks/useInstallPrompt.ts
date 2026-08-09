import { useCallback, useEffect, useState } from 'react';

// The event Chromium fires when the app meets the install criteria. Not in the
// DOM lib types, so declared minimally here.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface InstallState {
  /** a native install prompt is available (Android / desktop Chromium) */
  canPrompt: boolean;
  /** iOS Safari: no native prompt, needs the Share -> Add to Home Screen steps */
  iosHint: boolean;
  /** already installed / running standalone — hide the control */
  installed: boolean;
  promptInstall: () => Promise<'accepted' | 'dismissed' | null>;
}

const isStandalone = (): boolean =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  // iOS Safari exposes standalone on navigator, not via display-mode
  (navigator as unknown as { standalone?: boolean }).standalone === true;

/**
 * Surfaces installability so the UI can offer a one-tap install (NFR: the app is
 * meant to live on the home screen at the table). Browsers bury the install
 * option in a menu; iOS Safari offers no prompt at all — hence an explicit
 * affordance rather than relying on the browser chrome.
 */
export function useInstallPrompt(): InstallState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandalone());

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // keep the native mini-infobar from showing; we drive it
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return null;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null); // the prompt can only be used once
    return outcome;
  }, [deferred]);

  const isIOS =
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;

  return {
    canPrompt: deferred !== null && !installed,
    iosHint: isIOS && !installed,
    installed,
    promptInstall,
  };
}

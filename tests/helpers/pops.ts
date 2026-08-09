import type { Page } from '@playwright/test';

export interface Pop {
  /** index of the card the numeral belongs to, left to right */
  card: number;
  rank: string;
}

declare global {
  interface Window {
    __pops: Pop[];
  }
}

/**
 * Records every play of the numeral's `pop` keyframe animation, tagged with the
 * card it fired on. Asserting on animationstart rather than on pixels is what
 * makes "the wrong numeral animated" observable at all — the animation is 220ms
 * and leaves no trace in the DOM once it has finished.
 *
 * Installed as an init script, so it is listening before React mounts and can
 * still see a pop that fires on first render. Call it before navigating; it then
 * re-arms itself on every navigation, including reloads.
 */
export async function recordPops(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__pops = [];
    document.addEventListener(
      'animationstart',
      (e) => {
        const event = e as AnimationEvent;
        if (event.animationName !== 'pop') return;
        const span = event.target as HTMLElement;
        const cards = [...document.querySelectorAll('.card')];
        window.__pops.push({
          card: cards.indexOf(span.closest('.card') as Element),
          rank: span.textContent ?? '',
        });
      },
      true,
    );
  });
}

/** Drains the pops seen since the last call, after letting any in-flight one start. */
export async function drainPops(page: Page): Promise<Pop[]> {
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    const seen = window.__pops;
    window.__pops = [];
    return seen;
  });
}

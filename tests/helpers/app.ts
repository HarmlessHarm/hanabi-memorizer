import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export interface Point {
  x: number;
  y: number;
}

/** A fresh context means empty localStorage, so this is always a clean 5-card hand. */
export async function openApp(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForSelector('.card');
}

export async function centreOf(page: Page, selector: string, nth = 0): Promise<Point> {
  const box = await page.locator(selector).nth(nth).boundingBox();
  if (!box) throw new Error(`${selector} #${nth} is not visible`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/**
 * A touch gesture with an explicit hold time and path, which `page.tap()` cannot
 * express. Hold duration is the whole point of the tap tests: a press held long
 * enough stops counting as a tap, and that difference is what made the original
 * bug look intermittent.
 */
export async function touchGesture(
  page: Page,
  path: Point[],
  { holdMs = 30 }: { holdMs?: number } = {},
): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: path[0].x, y: path[0].y, id: 1 }],
    });
    for (const p of path.slice(1)) {
      await page.waitForTimeout(16);
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: p.x, y: p.y, id: 1 }],
      });
    }
    await page.waitForTimeout(holdMs);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await cdp.detach();
  }
  // Long enough for the phantom mouse click a touchscreen emits after a tap.
  await page.waitForTimeout(250);
}

/** The numbers currently on the cards, left to right; '-' for a card with none. */
export function ranksOnScreen(page: Page): Promise<string[]> {
  return page
    .locator('.card')
    .evaluateAll((els) => els.map((el) => el.querySelector('.rank')?.textContent ?? '-'));
}

/** The negatives on each card, left to right, as their labels ("Not 3", "Not Red"). */
export function antiHintsOnScreen(page: Page): Promise<string[][]> {
  return page
    .locator('.card')
    .evaluateAll((els) =>
      els.map((el) =>
        [...el.querySelectorAll('.anti')].map((a) => a.getAttribute('aria-label') ?? ''),
      ),
    );
}

/** Opens the cogwheel menu, flips the anti-hints switch if needed, closes it. */
export async function setAntiHints(page: Page, on: boolean): Promise<void> {
  const cog = page.getByRole('button', { name: 'Settings' });
  await cog.tap();
  const toggle = page.getByRole('switch', { name: 'Anti-hints' });
  if ((await toggle.getAttribute('aria-checked')) !== String(on)) await toggle.tap();
  await cog.tap();
  await expect(page.locator('.menu')).toHaveCount(0);
}

export async function setRank(page: Page, cardIndex: number, rank: number): Promise<void> {
  await page.locator('.card').nth(cardIndex).tap();
  await page.waitForSelector('.sheet');
  await page.locator('.pick').nth(rank - 1).tap();
  await page.locator('.sheet-ok').tap();
  await page.waitForSelector('.sheet', { state: 'detached' });
}

import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  antiHintsOnScreen,
  centreOf,
  openApp,
  ranksOnScreen,
  setAntiHints,
  touchGesture,
} from '../helpers/app';

/**
 * A 20:9 phone turned sideways: ~412px of height for a header, a discard zone, a
 * row of cards and a bottom sheet. Everything the portrait tests cover is
 * decided by that budget, so the pieces that give way first live here.
 *
 * The panel covers the bottom of the screen at this height, so while it is up the
 * hand moves to the top and the discard zone steps aside: every card keeps a
 * strip standing above the panel, which is what makes a selection visible and
 * the rest of the hand reachable. These tests hold that arrangement in place.
 */
test.describe('turned sideways', () => {
  test.beforeEach(async ({ page }) => openApp(page));

  test('the whole hand fits on screen without scrolling', async ({ page }) => {
    const { w, h } = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));

    const boxes = await page.locator('.card').evaluateAll((els) =>
      els.map((el) => {
        const b = el.getBoundingClientRect();
        return { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
      }),
    );

    expect(boxes).toHaveLength(5);
    for (const b of boxes) {
      expect(b.left).toBeGreaterThanOrEqual(0);
      expect(b.right).toBeLessThanOrEqual(w);
      expect(b.top).toBeGreaterThanOrEqual(0);
      expect(b.bottom).toBeLessThanOrEqual(h);
    }
    expect(await page.evaluate(() => document.body.scrollHeight <= innerHeight)).toBe(true);
  });

  test('the multi-card nudge clears the sheet instead of hiding behind it', async ({ page }) => {
    await touchGesture(page, [await centreOf(page, '.card', 0)]);

    const tip = await page.locator('.tip').boundingBox();
    const sheet = await page.locator('.sheet').boundingBox();

    await expect(page.locator('.tip')).toBeVisible();
    expect(tip!.y + tip!.height).toBeLessThanOrEqual(sheet!.y);
  });

  test('the cards either side of the sheet can still be hinted together', async ({ page }) => {
    await setAntiHints(page, true);

    await touchGesture(page, [await centreOf(page, '.card', 0)]);
    await touchGesture(page, [await centreOf(page, '.card', 4)]);
    await expect(page.locator('.sheet-eyebrow')).toHaveText('Cards 1 & 5 from the left');

    await page.locator('.pick').nth(2).tap();
    // The zone is off screen while the panel is up, so OK is the way out here.
    await page.locator('.sheet-ok').tap();

    expect(await ranksOnScreen(page)).toEqual(['3', '-', '-', '-', '3']);
    expect(await antiHintsOnScreen(page)).toEqual([[], ['Not 3'], ['Not 3'], ['Not 3'], []]);
  });

  test('the hand moves above the panel when a card is picked', async ({ page }) => {
    // The tallest the panel gets: a selection with negatives to offer back.
    await setAntiHints(page, true);
    await touchGesture(page, [await centreOf(page, '.card', 0)]);
    await page.locator('.pick').nth(2).tap();
    await page.getByRole('button', { name: 'Red' }).tap();
    await page.locator('.sheet-ok').tap();

    const before = await cardBoxes(page);
    await expect(page.locator('.zone')).toBeVisible();

    await touchGesture(page, [await centreOf(page, '.card', 2)]);
    const sheet = await page.locator('.sheet').boundingBox();
    const after = await cardBoxes(page);

    // The red drag-up-to-discard strip gives up its space for the duration.
    await expect(page.locator('.zone')).toBeHidden();

    for (const [i, box] of after.entries()) {
      expect(box.top).toBeLessThan(before[i].top);
      expect(box.top).toBeGreaterThanOrEqual(0);
      // Not merely peeking out: enough of every card to read and to tap.
      expect(sheet!.y - box.top).toBeGreaterThan(60);
    }
  });

  test('the picked card is visibly lifted above the others', async ({ page }) => {
    await touchGesture(page, [await centreOf(page, '.card', 2)]);
    const tops = (await cardBoxes(page)).map((b) => b.top);

    expect(tops[2]).toBeLessThan(tops[0]);
    expect(tops[0]).toEqual(tops[1]);
  });

  test('the hand drops back to the middle once the panel is gone', async ({ page }) => {
    const before = await cardBoxes(page);

    await touchGesture(page, [await centreOf(page, '.card', 2)]);
    await page.locator('.sheet-ok').tap();
    await expect(page.locator('.sheet')).toHaveCount(0);

    await expect(page.locator('.zone')).toBeVisible();
    // Polled: the picked card is still easing its lift out as the panel goes.
    await expect.poll(() => cardBoxes(page)).toEqual(before);
  });

  test('the settings menu opens clear of the hand', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).tap();

    const menu = await page.locator('.menu').boundingBox();
    const { w, h } = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));

    await expect(page.locator('.menu')).toBeVisible();
    expect(menu!.x + menu!.width).toBeLessThanOrEqual(w);
    expect(menu!.y + menu!.height).toBeLessThanOrEqual(h);
  });
});

/** Every card's box, left to right. */
async function cardBoxes(page: Page) {
  return page.locator('.card').evaluateAll((els) =>
    els.map((el) => {
      const b = el.getBoundingClientRect();
      return { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
    }),
  );
}

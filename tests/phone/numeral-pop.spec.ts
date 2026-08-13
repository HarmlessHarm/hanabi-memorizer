import { expect, test } from '@playwright/test';
import { centreOf, openApp, setRank, touchGesture } from '../helpers/app';
import { drainPops, recordPops } from '../helpers/pops';

/**
 * Regression cover for the numeral pop firing when no hint was placed.
 *
 * Motion here confirms the action that just landed (ux-design.md), so exactly
 * one numeral — the one that changed — may animate. Two things used to break
 * that: a pop counter shared by the whole hand, and the numeral carrying its
 * animation class permanently, which the browser replays every time it
 * re-inserts the node, as it does for every card a reorder shuffles past.
 */
test.describe('the numeral pop', () => {
  test.beforeEach(async ({ page }) => {
    await recordPops(page);
    await openApp(page);
  });

  test('plays on the card whose number was just set, and only that one', async ({ page }) => {
    await setRank(page, 0, 3);
    expect(await drainPops(page)).toEqual([{ card: 0, rank: '3' }]);

    await setRank(page, 1, 5);
    expect(await drainPops(page)).toEqual([{ card: 1, rank: '5' }]);

    await setRank(page, 2, 1);
    expect(await drainPops(page)).toEqual([{ card: 2, rank: '1' }]);
  });

  test('does not play when only the colour changes', async ({ page }) => {
    await setRank(page, 0, 3);
    await drainPops(page);

    await page.locator('.card').first().tap();
    await page.locator('.swatch').first().tap();
    await page.locator('.sheet-ok').tap();

    expect(await drainPops(page)).toEqual([]);
  });

  test('does not play when a card is dragged to a new position', async ({ page }) => {
    await setRank(page, 0, 3);
    await drainPops(page);

    const from = await centreOf(page, '.card', 0);
    const to = await centreOf(page, '.card', 2);
    await touchGesture(page, [
      from,
      { x: from.x + (to.x - from.x) * 0.3, y: from.y },
      { x: from.x + (to.x - from.x) * 0.7, y: from.y },
      { x: to.x, y: to.y },
    ]);

    expect(await drainPops(page)).toEqual([]);
  });

  test('does not play for numbers restored from storage on load', async ({ page }) => {
    await setRank(page, 0, 3);
    await setRank(page, 1, 5);

    // The recorder re-arms on navigation, so it is watching from before the
    // reloaded app mounts — a pop on first render would be caught here.
    await page.reload();
    await page.waitForSelector('.card');

    expect(await drainPops(page)).toEqual([]);
  });

  test('restarts when a second number lands before the first pop has finished', async ({
    page,
  }) => {
    await page.locator('.card').first().tap();
    await page.locator('.pick').nth(1).tap(); // 2
    await page.waitForTimeout(60); // inside the 220ms pop window
    await page.locator('.pick').nth(3).tap(); // 4
    await page.locator('.sheet-ok').tap();

    expect(await drainPops(page)).toEqual([
      { card: 0, rank: '2' },
      { card: 0, rank: '4' },
    ]);
  });
});

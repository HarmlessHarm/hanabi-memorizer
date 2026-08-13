import { expect, test } from '@playwright/test';
import { centreOf, openApp, ranksOnScreen, setRank, touchGesture } from '../helpers/app';

/**
 * Regression cover for taps on a card being swallowed on a touchscreen.
 *
 * A touchscreen replays every tap as a phantom mouse click ~10ms after touchend,
 * hit-tested against whatever is under the finger by then. Since the tap has
 * already opened the hint sheet, that click landed on the sheet's full-screen
 * backdrop and dismissed it, so the card read as unresponsive. A press held long
 * enough not to count as a tap produces no phantom click, which is why the bug
 * looked intermittent — hence the spread of hold times below.
 */
test.describe('tapping a card', () => {
  test.beforeEach(async ({ page }) => openApp(page));

  for (const holdMs of [20, 40, 90, 300]) {
    test(`opens the hint sheet when held ${holdMs}ms`, async ({ page }) => {
      await touchGesture(page, [await centreOf(page, '.card')], { holdMs });
      await expect(page.locator('.sheet')).toBeVisible();
    });
  }

  test('survives a fingertip rolling a few px during the tap', async ({ page }) => {
    const c = await centreOf(page, '.card');
    await touchGesture(page, [c, { x: c.x + 5, y: c.y + 4 }, { x: c.x + 9, y: c.y + 4 }]);
    await expect(page.locator('.sheet')).toBeVisible();
  });

  test('applies a hint, and the sheet stays open for the second one', async ({ page }) => {
    await touchGesture(page, [await centreOf(page, '.card')]);
    await page.locator('.pick').nth(2).tap();

    await expect(page.locator('.pick.is-on')).toHaveText('3');
    await expect(page.locator('.sheet')).toBeVisible();
  });

  test('tapping the backdrop still closes the sheet', async ({ page }) => {
    await touchGesture(page, [await centreOf(page, '.card')]);
    const sheet = await page.locator('.sheet').boundingBox();

    await touchGesture(page, [{ x: 200, y: sheet!.y - 120 }]);

    await expect(page.locator('.sheet')).toHaveCount(0);
  });
});

test.describe('dragging a card', () => {
  test.beforeEach(async ({ page }) => openApp(page));

  test('sideways reorders the hand without opening a sheet', async ({ page }) => {
    // Give the first card a number so the reorder is observable.
    await page.locator('.card').first().tap();
    await page.locator('.pick').nth(2).tap();
    await page.locator('.sheet-ok').tap();
    expect(await ranksOnScreen(page)).toEqual(['3', '-', '-', '-', '-']);

    const from = await centreOf(page, '.card', 0);
    const to = await centreOf(page, '.card', 2);
    await touchGesture(page, [
      from,
      { x: from.x + (to.x - from.x) * 0.3, y: from.y },
      { x: from.x + (to.x - from.x) * 0.7, y: from.y },
      { x: to.x, y: to.y },
    ]);

    expect(await ranksOnScreen(page)).toEqual(['-', '-', '3', '-', '-']);
    await expect(page.locator('.sheet')).toHaveCount(0);
  });

  test('upwards discards it straight away, and Undo brings it back', async ({ page }) => {
    await setRank(page, 0, 3);
    expect(await ranksOnScreen(page)).toEqual(['3', '-', '-', '-', '-']);

    const c = await centreOf(page, '.card');
    await touchGesture(page, [
      c,
      { x: c.x, y: c.y - 30 },
      { x: c.x, y: c.y - 90 },
      { x: c.x, y: c.y - 140 },
    ]);

    expect(await ranksOnScreen(page)).toEqual(['-', '-', '-', '-']);
    await expect(page.locator('.sheet')).toHaveCount(0);

    await page.getByRole('button', { name: 'Undo' }).tap();
    expect(await ranksOnScreen(page)).toEqual(['3', '-', '-', '-', '-']);
  });
});

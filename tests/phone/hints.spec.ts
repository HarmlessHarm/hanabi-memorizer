import { expect, test } from '@playwright/test';
import {
  antiHintsOnScreen,
  centreOf,
  openApp,
  ranksOnScreen,
  setAntiHints,
  touchGesture,
} from '../helpers/app';

/**
 * A hint names a set of cards, so the hand has to stay live while the sheet is
 * open. That is the interesting part on a touchscreen: the sheet's backdrop
 * covers the screen, and the second tap has to reach the card underneath it
 * rather than being read as "tap outside" and closing the sheet.
 */
test.describe('hinting several cards at once', () => {
  test.beforeEach(async ({ page }) => openApp(page));

  test('a second card joins the selection instead of dismissing the sheet', async ({ page }) => {
    await touchGesture(page, [await centreOf(page, '.card', 0)]);
    await touchGesture(page, [await centreOf(page, '.card', 2)]);

    await expect(page.locator('.sheet')).toBeVisible();
    await expect(page.locator('.sheet-eyebrow')).toHaveText('Cards 1 & 3 from the left');
  });

  test('one tap on a number hints every selected card', async ({ page }) => {
    await touchGesture(page, [await centreOf(page, '.card', 0)]);
    await touchGesture(page, [await centreOf(page, '.card', 2)]);
    await page.locator('.pick').nth(2).tap();

    expect(await ranksOnScreen(page)).toEqual(['3', '-', '3', '-', '-']);
  });

  test('tapping a selected card again drops it', async ({ page }) => {
    await touchGesture(page, [await centreOf(page, '.card', 0)]);
    await touchGesture(page, [await centreOf(page, '.card', 2)]);
    await touchGesture(page, [await centreOf(page, '.card', 0)]);
    await page.locator('.pick').nth(2).tap();

    expect(await ranksOnScreen(page)).toEqual(['-', '-', '3', '-', '-']);
  });

  test('the multi-card nudge shows once, then never again', async ({ page }) => {
    await touchGesture(page, [await centreOf(page, '.card', 0)]);
    await expect(page.locator('.tip')).toBeVisible();

    // It has done its job the moment a second card joins.
    await touchGesture(page, [await centreOf(page, '.card', 2)]);
    await expect(page.locator('.tip')).toHaveCount(0);

    await page.reload();
    await page.waitForSelector('.card');
    await touchGesture(page, [await centreOf(page, '.card', 0)]);
    await expect(page.locator('.sheet')).toBeVisible();
    await expect(page.locator('.tip')).toHaveCount(0);
  });
});

/**
 * Being skipped by a hint is information: the cards the hint did not name are
 * now known not to be that number or colour. The app records it only when the
 * setting is on, and never asks the player to enter one by hand.
 *
 * The timing is the subtle part. Picking is not the same as having picked — a
 * player who taps 2 and then 3 has given one hint, and the rest of the hand must
 * not come away believing it isn't a 2. So the negatives are worked out once,
 * when the sheet closes, from where the hints actually landed.
 */
test.describe('anti-hints', () => {
  test.beforeEach(async ({ page }) => openApp(page));

  test('are off until switched on', async ({ page }) => {
    await touchGesture(page, [await centreOf(page, '.card', 0)]);
    await page.locator('.pick').nth(2).tap();
    await page.locator('.sheet-ok').tap();

    expect(await antiHintsOnScreen(page)).toEqual([[], [], [], [], []]);
  });

  test('a number hint marks the cards it skipped', async ({ page }) => {
    await setAntiHints(page, true);

    await touchGesture(page, [await centreOf(page, '.card', 0)]);
    await touchGesture(page, [await centreOf(page, '.card', 2)]);
    await page.locator('.pick').nth(2).tap();
    await page.locator('.sheet-ok').tap();

    expect(await antiHintsOnScreen(page)).toEqual([[], ['Not 3'], [], ['Not 3'], ['Not 3']]);
  });

  test('a colour hint marks the cards it skipped', async ({ page }) => {
    await setAntiHints(page, true);

    await touchGesture(page, [await centreOf(page, '.card', 1)]);
    await page.getByRole('button', { name: 'Red' }).tap();
    await page.locator('.sheet-ok').tap();

    expect(await antiHintsOnScreen(page)).toEqual([
      ['Not Red'],
      [],
      ['Not Red'],
      ['Not Red'],
      ['Not Red'],
    ]);
  });

  test('a card that learns its own number stops showing what it is not', async ({ page }) => {
    await setAntiHints(page, true);

    await touchGesture(page, [await centreOf(page, '.card', 0)]);
    await page.locator('.pick').nth(2).tap();
    await page.locator('.sheet-ok').tap();
    expect(await antiHintsOnScreen(page)).toEqual([[], ['Not 3'], ['Not 3'], ['Not 3'], ['Not 3']]);

    await touchGesture(page, [await centreOf(page, '.card', 1)]);
    await page.locator('.pick').nth(0).tap();
    await page.locator('.sheet-ok').tap();

    // Card 2 is a 1; "not a 3" is noise on it now. The rest gained "Not 1".
    expect(await antiHintsOnScreen(page)).toEqual([
      [],
      [],
      ['Not 1', 'Not 3'],
      ['Not 1', 'Not 3'],
      ['Not 1', 'Not 3'],
    ]);
  });

  test('land when the sheet closes, not while it is still open', async ({ page }) => {
    await setAntiHints(page, true);

    await touchGesture(page, [await centreOf(page, '.card', 0)]);
    await page.locator('.pick').nth(2).tap();

    // The cards are visible under the open sheet, and carry nothing yet.
    expect(await antiHintsOnScreen(page)).toEqual([[], [], [], [], []]);

    await page.locator('.sheet-ok').tap();
    expect(await antiHintsOnScreen(page)).toEqual([[], ['Not 3'], ['Not 3'], ['Not 3'], ['Not 3']]);
  });

  test('ignore a number the player corrected before closing', async ({ page }) => {
    await setAntiHints(page, true);

    // Meant to tap 3, hit 2 on the way. One hint was given, not two.
    await touchGesture(page, [await centreOf(page, '.card', 0)]);
    await page.locator('.pick').nth(1).tap();
    await page.locator('.pick').nth(2).tap();
    await page.locator('.sheet-ok').tap();

    expect(await ranksOnScreen(page)).toEqual(['3', '-', '-', '-', '-']);
    expect(await antiHintsOnScreen(page)).toEqual([[], ['Not 3'], ['Not 3'], ['Not 3'], ['Not 3']]);
  });

  test('a hint tapped on and off again settles to nothing', async ({ page }) => {
    await setAntiHints(page, true);

    await touchGesture(page, [await centreOf(page, '.card', 0)]);
    await page.locator('.pick').nth(2).tap();
    await page.locator('.pick').nth(2).tap();
    await page.locator('.sheet-ok').tap();

    expect(await ranksOnScreen(page)).toEqual(['-', '-', '-', '-', '-']);
    expect(await antiHintsOnScreen(page)).toEqual([[], [], [], [], []]);
  });

  test('taking a hint back later takes its negatives with it', async ({ page }) => {
    await setAntiHints(page, true);

    await touchGesture(page, [await centreOf(page, '.card', 0)]);
    await page.locator('.pick').nth(2).tap();
    await page.locator('.sheet-ok').tap();
    expect(await antiHintsOnScreen(page)).toEqual([[], ['Not 3'], ['Not 3'], ['Not 3'], ['Not 3']]);

    // Wrong card entirely: reopen it and take the 3 off again.
    await touchGesture(page, [await centreOf(page, '.card', 0)]);
    await page.locator('.pick').nth(2).tap();
    await page.locator('.sheet-ok').tap();

    expect(await ranksOnScreen(page)).toEqual(['-', '-', '-', '-', '-']);
    expect(await antiHintsOnScreen(page)).toEqual([[], [], [], [], []]);
  });

  test('one Undo takes back the hint and everything it implied', async ({ page }) => {
    await setAntiHints(page, true);

    await touchGesture(page, [await centreOf(page, '.card', 0)]);
    await page.locator('.pick').nth(2).tap();
    await page.locator('.sheet-ok').tap();

    await page.getByRole('button', { name: 'Undo' }).tap();

    expect(await ranksOnScreen(page)).toEqual(['-', '-', '-', '-', '-']);
    expect(await antiHintsOnScreen(page)).toEqual([[], [], [], [], []]);
  });

  test('settle when the sheet is closed by tapping away from it', async ({ page }) => {
    await setAntiHints(page, true);

    await touchGesture(page, [await centreOf(page, '.card', 0)]);
    await page.locator('.pick').nth(2).tap();
    await touchGesture(page, [await centreOf(page, '.zone')]);

    await expect(page.locator('.sheet')).toHaveCount(0);
    expect(await antiHintsOnScreen(page)).toEqual([[], ['Not 3'], ['Not 3'], ['Not 3'], ['Not 3']]);
  });
});

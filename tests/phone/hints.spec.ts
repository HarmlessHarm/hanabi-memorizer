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

  test('taking a mis-tapped hint back takes its negatives with it', async ({ page }) => {
    await setAntiHints(page, true);

    await touchGesture(page, [await centreOf(page, '.card', 0)]);
    await page.locator('.pick').nth(2).tap();
    await page.locator('.pick').nth(2).tap();
    await page.locator('.sheet-ok').tap();

    expect(await ranksOnScreen(page)).toEqual(['-', '-', '-', '-', '-']);
    expect(await antiHintsOnScreen(page)).toEqual([[], [], [], [], []]);
  });
});

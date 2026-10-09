import { expect, test } from '@playwright/test';
import { centreOf, openApp } from '../helpers/app';

/**
 * The mouse path was never broken — it is here so that a future fix aimed at
 * touch cannot quietly cost the desktop its click-to-open or click-outside-to-
 * close, both of which the touch fixes deliberately reach into.
 */
test.describe('with a mouse', () => {
  test.beforeEach(async ({ page }) => openApp(page));

  test('clicking a card opens the hint sheet', async ({ page }) => {
    await page.locator('.card').first().click();
    await expect(page.locator('.sheet')).toBeVisible();
  });

  test('clicking the backdrop closes it', async ({ page }) => {
    await page.locator('.card').first().click();

    // Away from the hand — the cards stay live while the sheet is open.
    const zone = await centreOf(page, '.zone');
    await page.mouse.click(zone.x, zone.y);

    await expect(page.locator('.sheet')).toHaveCount(0);
  });

  test('a hint applies and the sheet stays open', async ({ page }) => {
    await page.locator('.card').first().click();
    await page.locator('.pick').nth(2).click();

    await expect(page.locator('.pick.is-on')).toHaveText('3');
    await expect(page.locator('.sheet')).toBeVisible();
  });
});

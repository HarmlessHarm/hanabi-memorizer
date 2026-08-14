import { expect, test } from '@playwright/test';
import { centreOf, openApp, ranksOnScreen } from '../helpers/app';

/**
 * The cogwheel menu dismisses on a pointerdown outside itself rather than behind
 * a full-screen backdrop, because a backdrop that appears under the finger
 * catches the phantom click a touchscreen fires after a tap and closes the menu
 * the tap just opened. These cover the resulting open/close paths.
 */
test.describe('the settings menu', () => {
  test.beforeEach(async ({ page }) => openApp(page));

  const cog = (page: import('@playwright/test').Page) =>
    page.getByRole('button', { name: 'Settings' });

  test('opens and closes on the cogwheel', async ({ page }) => {
    await cog(page).click();
    await expect(page.locator('.menu')).toBeVisible();

    await cog(page).click();
    await expect(page.locator('.menu')).toHaveCount(0);
  });

  test('closes on a click outside, and on Escape', async ({ page }) => {
    await cog(page).click();
    const zone = await centreOf(page, '.zone');
    await page.mouse.click(zone.x, zone.y);
    await expect(page.locator('.menu')).toHaveCount(0);

    await cog(page).click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.menu')).toHaveCount(0);
  });

  test('holds the hand-size toggle', async ({ page }) => {
    await cog(page).click();
    const four = page.getByRole('button', { name: '4', exact: true });
    await four.click();

    await expect(four).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: '5', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('remembers the anti-hints setting across a reload', async ({ page }) => {
    const toggle = page.getByRole('switch', { name: 'Anti-hints' });

    await cog(page).click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');

    await page.waitForTimeout(400); // the save is debounced
    await page.reload();
    await page.waitForSelector('.card');

    await cog(page).click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  test('resets the hand, and the menu closes behind it', async ({ page }) => {
    await page.locator('.card').first().click();
    await page.locator('.pick').nth(2).click();
    await page.locator('.sheet-ok').click();
    expect(await ranksOnScreen(page)).toEqual(['3', '-', '-', '-', '-']);

    await cog(page).click();
    await page.getByRole('button', { name: 'Reset hand' }).click();

    await expect(page.locator('.menu')).toHaveCount(0);
    expect(await ranksOnScreen(page)).toEqual(['-', '-', '-', '-', '-']);
  });
});

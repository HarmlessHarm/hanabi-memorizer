import { expect, test } from '@playwright/test';
import { centreOf, openApp, touchGesture } from '../helpers/app';

/**
 * Cover for the one press model every control now shares (DEC-14).
 *
 * The old split — cards acting on `pointerup`, every button acting on the
 * browser's click — is what made a card and the draw slot beside it feel like
 * different objects. These tests pin the behaviours that were previously either
 * hand-rolled per control or missing entirely.
 */
test.describe('the shared press model', () => {
  test.beforeEach(async ({ page }) => openApp(page));

  // usePress fires a synthetic click ~80ms after release when the browser skips
  // its own — which iOS and Android do after a long press. Before, a press held
  // this long on a button was at the browser's mercy.
  for (const holdMs of [20, 300, 700]) {
    test(`a ${holdMs}ms press on the draw slot draws a card`, async ({ page }) => {
      const c = await centreOf(page, '.card');
      await touchGesture(page, [
        c,
        { x: c.x, y: c.y - 30 },
        { x: c.x, y: c.y - 90 },
        { x: c.x, y: c.y - 150 },
      ]);
      await expect(page.locator('.card')).toHaveCount(4);

      await touchGesture(page, [await centreOf(page, '.slot')], { holdMs });

      await expect(page.locator('.card')).toHaveCount(5);
      await expect(page.locator('.slot')).toHaveCount(0);
    });
  }

  test('a card is reachable and openable from the keyboard', async ({ page }) => {
    await page.locator('.card').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.sheet')).toBeVisible();

    // ...and the hint buttons inside the sheet answer to the keyboard too.
    await page.locator('.pick').nth(2).focus();
    await page.keyboard.press('Space');
    await expect(page.locator('.pick.is-on')).toHaveText('3');
  });

  test('a card announces its position and hints to a screen reader', async ({ page }) => {
    const first = page.locator('.card').first();
    await expect(first).toHaveAttribute('aria-label', 'Card 1 from the left, no hints');

    await first.tap();
    await page.locator('.pick').nth(3).tap();
    await page.locator('.swatch').first().tap();
    await page.locator('.sheet-ok').tap();

    await expect(first).toHaveAttribute('aria-label', 'Card 1 from the left, Red, number 4');
  });

  // @use-gesture drives a drag from the arrow keys by default, accumulating
  // displacement while the key repeats. On a card that is focusable now, holding
  // an arrow would reorder the hand behind the player's back.
  test('holding an arrow key on a focused card does not drag it', async ({ page }) => {
    await page.locator('.card').first().tap();
    await page.locator('.pick').nth(2).tap();
    await page.locator('.sheet-ok').tap();
    await page.locator('.card').first().focus();

    const cdp = await page.context().newCDPSession(page);
    const key = { key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 };
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', ...key });
    for (let i = 0; i < 30; i++) {
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', autoRepeat: true, ...key });
    }
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...key });
    await cdp.detach();
    await page.waitForTimeout(300);

    const ranks = await page
      .locator('.card')
      .evaluateAll((els) => els.map((el) => el.querySelector('.rank')?.textContent ?? '-'));
    expect(ranks).toEqual(['3', '-', '-', '-', '-']);
  });
});

import { expect, test } from '@playwright/test';
import { appUrl } from './appUrl';

test('starts a test play run and returns to the editor', async ({ page }) => {
  await page.goto(appUrl());
  await page.getByRole('button', { name: 'Create Level' }).click();

  await page.getByRole('button', { name: 'Test play level' }).click();
  await expect(page.getByTestId('game-host').locator('canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__SKY_SPROUT_STATE)).toBe('playing');

  await page.keyboard.press('Escape');
  await expect(page.locator('.playtest-layer')).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Sky Forge Editor' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Test play level' })).toBeVisible();
});

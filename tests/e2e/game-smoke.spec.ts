import { expect, test } from '@playwright/test';
import { appUrl } from './appUrl';

test('loads, starts, shows HUD data, and pauses from the touch button', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto(appUrl());

  await expect(page.getByRole('button', { name: 'Play Story' })).toBeVisible();
  await page.getByRole('button', { name: 'Play Story' }).click();

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__SKY_SPROUT_STATE)).toBe('playing');

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Canvas bounding box was not available.');
  }

  await expect.poll(() => page.evaluate(() => window.__SKY_SPROUT_HUD?.health)).toBe(3);

  await page.mouse.click(box.x + box.width - 56, box.y + 44);
  await expect.poll(() => page.evaluate(() => window.__SKY_SPROUT_STATE)).toBe('paused');

  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.5);
  await expect.poll(() => page.evaluate(() => window.__SKY_SPROUT_STATE)).toBe('playing');

  expect(consoleErrors).toEqual([]);
});

import { expect, test } from '@playwright/test';
import { appUrl } from './appUrl';

test('places an object, saves it, and reopens it from My Levels', async ({ page }) => {
  await page.goto(appUrl());
  await page.getByRole('button', { name: 'Create Level' }).click();

  await page.getByRole('button', { name: 'Sky Grass Block' }).click();
  const host = page.getByTestId('editor-canvas-host');
  await expect(host.locator('canvas')).toBeVisible();
  const box = await host.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Editor canvas host was not available.');
  }

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.getByRole('button', { name: 'Save level' }).click();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Back to menu' }).click();
  await page.getByRole('button', { name: 'My Levels' }).click();
  await expect(page.getByText('Untitled Sky Forge Level')).toBeVisible();

  await page.getByRole('button', { name: 'Edit Untitled Sky Forge Level' }).click();
  await expect(page.getByRole('heading', { name: 'Sky Forge Editor' })).toBeVisible();

  const storedTerrainCount = await page.evaluate(() => {
    const index = JSON.parse(localStorage.getItem('sky-sprout-runner:custom-levels:index') ?? '[]');
    const first = JSON.parse(localStorage.getItem(`sky-sprout-runner:custom-levels:${index[0].id}`) ?? '{}');
    return first.terrain.length;
  });
  expect(storedTerrainCount).toBeGreaterThan(0);
});

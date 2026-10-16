import { expect, test } from '@playwright/test';
import { appUrl } from './appUrl';

test('opens Sky Forge Editor and shows core panels', async ({ page }) => {
  await page.goto(appUrl());

  await page.getByRole('button', { name: 'Create Level' }).click();

  await expect(page.getByRole('heading', { name: 'Sky Forge Editor' })).toBeVisible();
  await expect(page.getByRole('toolbar', { name: 'Editor toolbar' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Object palette' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Layer panel' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Difficulty estimator' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Properties panel' })).toBeVisible();
  await expect(page.getByTestId('editor-canvas-host')).toBeVisible();
  await expect(page.getByTestId('editor-canvas-host').locator('canvas')).toBeVisible();

  await page.getByRole('button', { name: 'Validate level' }).click();
  await expect(page.getByRole('region', { name: 'Validation panel' })).toContainText('Info');
});

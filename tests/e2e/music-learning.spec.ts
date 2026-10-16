import { expect, test } from '@playwright/test';

test('corrupt learning storage preserves original bytes and story score while completing silently', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { localStorage.setItem('sky-sprout.music.progress.v1', '{old broken'); localStorage.setItem('sky-sprout-runner.best-score', '731'); });
  await page.getByRole('button', { name: '음악 정원 시작' }).click();
  await expect(page.getByTestId('music-save-status')).toContainText('원본을 덮어쓰지');
  await page.getByRole('button', { name: /도–미–솔, 첫 연습 시작/ }).click();
  await page.getByRole('button', { name: /점프 없이 안전하게 선택/ }).click();
  for (const midi of [60, 64, 67]) await page.getByRole('button', { name: new RegExp(`MIDI ${midi}$`) }).click();
  await expect(page.getByTestId('music-balance')).toHaveText('1');
  const stored = await page.evaluate(() => [localStorage.getItem('sky-sprout.music.progress.v1'), localStorage.getItem('sky-sprout-runner.best-score')]);
  expect(stored).toEqual(['{old broken', '731']);
});

test('listening is unmeasured until hidden-target stimulus finishes and audible output is confirmed', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: '음악 정원 시작' }).click();
  await page.getByRole('button', { name: '연습 설정' }).click();
  await page.getByLabel('도움 정도').selectOption('practice');
  await page.getByRole('button', { name: /높낮이 듣기 1/ }).click();
  await expect(page.locator('.target-sequence')).toHaveCount(0);
  await page.getByRole('button', { name: /점프 없이 안전하게 선택/ }).click();
  await page.getByRole('button', { name: '두 번째가 높음 ↑', exact: true }).click();
  await page.getByRole('button', { name: '조건 확인', exact: true }).click();
  await expect(page.locator('.music-feedback')).toContainText('미측정');
  await expect(page.getByTestId('music-balance')).toHaveText('0');
  await page.getByRole('button', { name: /문제 소리 듣기/ }).click();
  const confirm = page.getByRole('button', { name: '소리가 들렸어요' });
  await expect(confirm).toBeDisabled();
  await expect(confirm).toBeEnabled({ timeout: 6000 });
  await confirm.click();
  await page.getByRole('button', { name: '조건 확인', exact: true }).click();
  await expect(page.getByRole('region', { name: '연습 완료' })).toBeVisible();
  await expect(page.getByTestId('music-balance')).toHaveText('1');
});

test('repeated Enter adds one creative note, a fresh key adds another, and 640px layout fits', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto('/'); await page.getByRole('button', { name: '음악 정원 시작' }).click();
  await page.getByRole('tab', { name: /나만의 음악/ }).click();
  await page.locator('[data-exercise-id="a16-eight-bars"]').click();
  await page.getByRole('button', { name: /점프 없이 안전하게 선택/ }).click();
  const first = page.getByRole('button', { name: /MIDI 60$/ });
  await first.focus();
  await page.keyboard.down('Enter');
  await page.keyboard.down('Enter');
  await page.keyboard.down('Enter');
  await page.keyboard.up('Enter');
  await expect(page.locator('.note-tray li:not(.tray-empty)')).toHaveCount(1);
  // This creative task permits duplicate C4s, so the assertion tests key-repeat
  // suppression rather than ordered-pitch validation rejecting a second C4.
  await page.keyboard.press('Enter');
  await expect(page.locator('.note-tray li:not(.tray-empty)')).toHaveCount(2);
  await page.keyboard.down('Space');
  await page.keyboard.down('Space');
  await page.keyboard.down('Space');
  await page.keyboard.up('Space');
  await expect(page.locator('.note-tray li:not(.tray-empty)')).toHaveCount(3);
  await page.keyboard.press('Space');
  await expect(page.locator('.note-tray li:not(.tray-empty)')).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

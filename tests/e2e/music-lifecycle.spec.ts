import { expect, test } from '@playwright/test';

test('repeated room entry tears down canvases and audio contexts without carrying stale responses', async ({ page }) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const NativeAudio = window.AudioContext;
    const contexts: AudioContext[] = [];
    Object.assign(window, { __AUDIT_CONTEXTS__: contexts });
    window.AudioContext = class extends NativeAudio {
      constructor(options?: AudioContextOptions) { super(options); contexts.push(this); }
    };
  });
  await page.goto('/?music-test=1');
  await page.getByRole('button', { name: '음악 정원 시작' }).click();
  for (let cycle = 0; cycle < 12; cycle++) {
    await page.locator('[data-exercise-id="f02-c"]').click();
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect(page.locator('.note-tray li:not(.tray-empty)')).toHaveCount(0);
    await page.getByRole('button', { name: '▷ 예시 들어보기', exact: true }).click();
    await page.getByRole('button', { name: '← 연습 지도', exact: true }).click();
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => (window as unknown as { __AUDIT_CONTEXTS__: AudioContext[] }).__AUDIT_CONTEXTS__.filter(context => context.state !== 'closed').length)).toBe(0);
    await expect(page.getByTestId('music-balance')).toHaveText('0');
  }
  expect(errors).toEqual([]);
});

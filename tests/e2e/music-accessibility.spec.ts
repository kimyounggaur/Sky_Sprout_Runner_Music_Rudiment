import { expect, test, type Locator, type Page } from '@playwright/test';

test.use({ screenshot: 'only-on-failure' });
test.setTimeout(60_000);

async function tabTo(page: Page, target: Locator) {
  await expect(target).toHaveCount(1);
  for (let step = 0; step < 120; step += 1) {
    if (await target.evaluate(node => node === document.activeElement)) return;
    const backwards = await target.evaluate(node => {
      const active = document.activeElement;
      return active !== document.body && !!(active?.compareDocumentPosition(node) &&
        (active.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING));
    });
    await page.keyboard.press(backwards ? 'Shift+Tab' : 'Tab');
  }
  throw new Error(`Tab navigation could not reach ${await target.getAttribute('aria-label') ?? await target.textContent()}`);
}

async function activateByKeyboard(page: Page, target: Locator) {
  await tabTo(page, target);
  await expect(target).toBeFocused();
  await page.keyboard.press('Enter');
}

test('keyboard alone reaches settings, completes a safe exercise, reads its result and returns to map', async ({ page }) => {
  await page.goto('/?music-test');
  await activateByKeyboard(page, page.getByRole('button', { name: '음악 정원 시작' }));
  await activateByKeyboard(page, page.getByRole('button', { name: '연습 설정' }));
  const safeSetting = page.getByLabel('안전 선택을 펼쳐 시작');
  await tabTo(page, safeSetting); await page.keyboard.press('Space');
  await expect(safeSetting).toBeChecked();
  await activateByKeyboard(page, page.getByRole('button', { name: '닫기', exact: true }));
  await activateByKeyboard(page, page.getByRole('button', { name: /도–미–솔, 첫 연습 시작/ }));
  await activateByKeyboard(page, page.getByRole('button', { name: '도움 보기', exact: true }));
  for (const midi of [60, 64, 67]) {
    await activateByKeyboard(page, page.getByRole('button', { name: new RegExp(`MIDI ${midi}$`) }));
  }
  await expect(page.getByRole('region', { name: '연습 완료' })).toBeVisible();
  await expect(page.getByTestId('music-balance')).toHaveText('1');
  await activateByKeyboard(page, page.getByRole('button', { name: '← 연습 지도', exact: true }));
  await expect(page.getByRole('heading', { level: 1, name: /한 번의 점프/ })).toBeFocused();
  await activateByKeyboard(page, page.getByRole('button', { name: '학습 기록', exact: true }));
  await expect(page.getByRole('region', { name: '학습 기록' })).toContainText('조건 충족');
  await activateByKeyboard(page, page.getByRole('button', { name: '메인 메뉴', exact: true }));
  await expect(page.getByRole('button', { name: '음악 정원 시작' })).toBeVisible();
});

test('grayscale and reduced motion retain labels, selected symbols and the completion path', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?music-test');
  await page.addStyleTag({ content: 'html { filter: grayscale(1); }' });
  await page.getByRole('button', { name: '음악 정원 시작' }).click();
  await expect(page.locator('.music-app')).toHaveClass(/reduce-motion/);
  await page.getByRole('button', { name: /도–미–솔, 첫 연습 시작/ }).click();
  await page.getByRole('button', { name: /점프 없이 안전하게 선택/ }).click();
  const first = page.getByRole('button', { name: /MIDI 60$/ });
  await tabTo(page, first);
  expect(await first.evaluate(node => parseFloat(getComputedStyle(node).outlineWidth))).toBeGreaterThanOrEqual(3);
  await page.keyboard.press('Enter');
  await expect(page.locator('.note-tray')).toContainText('C4');
  await expect(page.getByLabel('선택됨', { exact: true })).toHaveCount(1);
  await expect(page.locator('.next-note')).toContainText('E4');
  await activateByKeyboard(page, page.getByRole('button', { name: /MIDI 67$/ }));
  await expect(page.locator('.music-feedback')).toContainText('G4도 이 화음의 구성음');
  await expect(page.locator('.note-tray li:not(.tray-empty)')).toHaveCount(1);
  for (const midi of [64, 67]) await activateByKeyboard(page, page.getByRole('button', { name: new RegExp(`MIDI ${midi}$`) }));
  await expect(page.getByRole('region', { name: '연습 완료' })).toBeVisible();
  await expect(page.locator('.practice-badge')).toContainText('✓ 조건 충족');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('region', { name: '연습 완료' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'output/verification/grayscale-reduced-motion-mobile.png', fullPage: true });
  await activateByKeyboard(page, page.getByRole('button', { name: /다음 연습으로/ }));
  await expect(page.getByTestId('music-practice')).toHaveAttribute('data-content-id', 'f02-f');
  await expect(page.getByTestId('music-balance')).toHaveText('1');
});

test('dragging out of a submit button cancels submission; pointer cancellation clears held movement', async ({ page }) => {
  await page.goto('/?music-test');
  await page.getByRole('button', { name: '음악 정원 시작' }).click();
  await page.locator('[data-exercise-id="f13-c-major"]').click();
  await expect.poll(() => page.evaluate(() => window.__MUSIC_WORLD__?.getSnapshot().ready)).toBe(true);
  const move = page.getByRole('button', { name: '오른쪽으로 이동', exact: true });
  await move.scrollIntoViewIfNeeded();
  const moveBox = (await move.boundingBox())!;
  await page.mouse.move(moveBox.x + moveBox.width / 2, moveBox.y + moveBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(180);
  await move.dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'mouse', isPrimary: true });
  await page.mouse.up();
  await page.waitForTimeout(200);
  const stopped = await page.evaluate(() => window.__MUSIC_WORLD__!.getSnapshot().player!.x);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__MUSIC_WORLD__!.getSnapshot().player!.x)).toBeCloseTo(stopped, 1);
  await page.getByRole('button', { name: /점프 없이 안전하게 선택/ }).click();
  for (const midi of [60, 64, 67]) await page.getByRole('button', { name: new RegExp(`MIDI ${midi}$`) }).click();
  const submit = page.getByRole('button', { name: '조건 확인', exact: true });
  await submit.scrollIntoViewIfNeeded();
  const submitBox = (await submit.boundingBox())!;
  await page.mouse.move(submitBox.x + submitBox.width / 2, submitBox.y + submitBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(submitBox.x - 20, submitBox.y - 20);
  await page.mouse.up();
  await expect(page.getByRole('region', { name: '연습 완료' })).toHaveCount(0);
  await expect(page.getByTestId('music-balance')).toHaveText('0');
  await expect(page.locator('.note-tray li:not(.tray-empty)')).toHaveCount(3);
  await submit.click();
  await expect(page.getByRole('region', { name: '연습 완료' })).toBeVisible();
  await expect(page.getByTestId('music-balance')).toHaveText('1');
});

import { expect, test, type Page } from '@playwright/test';

test.use({ screenshot: 'only-on-failure' });
test.setTimeout(60_000);

async function garden(page: Page) {
  await page.goto('/?music-test');
  await page.getByRole('button', { name: '음악 정원 시작' }).click();
}

async function open(page: Page, id: string) {
  await page.locator(`[data-exercise-id="${id}"]`).click();
  await expect(page.getByTestId('music-practice')).toHaveAttribute('data-content-id', id);
}

async function safe(page: Page) {
  const toggle = page.getByRole('button', { name: /점프 없이 안전하게 선택/ });
  if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
}

async function note(page: Page, midi: number) {
  await page.locator('#safe-options').getByRole('button', { name: new RegExp(`MIDI ${midi}(?:,|$)`) }).click();
}

async function report(page: Page) {
  await page.getByRole('button', { name: '← 연습 지도' }).click();
  await page.getByRole('button', { name: '학습 기록', exact: true }).click();
  return page.getByRole('region', { name: '학습 기록', exact: true });
}

test('U07/U55 records a real fall separately from music success and keeps hidden reordered transfer evidence distinct', async ({ page }) => {
  await garden(page);
  await open(page, 'f02-c');
  await expect.poll(() => page.evaluate(() => window.__MUSIC_WORLD__?.getSnapshot().ready)).toBe(true);
  // Only keyboard input causes the fall; the test bridge is read-only here.
  await page.getByTestId('music-world-focus').focus();
  await page.keyboard.down('ArrowLeft');
  try { await expect(page.locator('.music-world-status')).toContainText('돌아왔어요', { timeout: 7000 }); }
  finally { await page.keyboard.up('ArrowLeft'); }
  await safe(page);
  for (const midi of [60, 64, 67]) await note(page, midi);
  await expect(page.getByRole('region', { name: '연습 완료' })).toBeVisible();
  await page.getByRole('button', { name: '← 연습 지도' }).click();
  await open(page, 'f02-c-transfer');
  await expect(page.locator('.practice-intro')).toContainText('스스로 적용');
  await expect(page.locator('.target-sequence')).toHaveCount(0);
  await expect(page.locator('.next-note')).toHaveCount(0);
  await safe(page);
  const displayedMidiOrder = await page.locator('#safe-options .safe-option-grid button').evaluateAll(buttons => buttons.map(button => Number(button.getAttribute('aria-label')?.match(/MIDI (\d+)/)?.[1])));
  expect(displayedMidiOrder).toEqual([67, 60, 64]);
  for (const midi of [60, 64, 67]) await note(page, midi);
  await expect(page.getByRole('region', { name: '연습 완료' })).toBeVisible();
  await expect(page.getByTestId('music-balance')).toHaveText('2');
  const evidence = await report(page);
  const original = evidence.locator('[data-attempt-content-id="f02-c"]');
  await expect(original).toContainText('낙하 1회가 있었지만 음악 조건은 충족');
  await expect(original).toContainText('0회 · 이동 사건 제외');
  await expect(original).toContainText('안내 목표 표시');
  const transfer = evidence.locator('[data-attempt-content-id="f02-c-transfer"]');
  await expect(transfer).toContainText('위치 변경 조건 충족 · 답 미노출');
  await expect(transfer).toContainText('원본 안내 활동과 별도 기록');
  await expect(transfer).toContainText('안전 선택 사용');
  await expect(transfer).toContainText('청음 · 정밀 실시간 리듬 · 실제 악기 연주 · 내청 · 장기 숙달');
});

test('U29/U54 preserves a creative self-reflection and demonstration evidence without changing completion or rewards', async ({ page }) => {
  await garden(page);
  await page.getByRole('tab', { name: /나만의 음악/ }).click();
  await open(page, 'a07-targets');
  await safe(page);
  await page.getByRole('button', { name: /예시 들어보기/ }).click();
  await page.getByRole('button', { name: '소리 끄기 / 재생 중단' }).click();
  for (const midi of [65, 67, 69, 72, 71, 67, 65, 62, 64, 67, 69, 72]) await note(page, midi);
  await page.getByRole('button', { name: '조건 확인', exact: true }).click();
  await expect(page.getByRole('region', { name: '연습 완료' })).toBeVisible();
  await page.getByLabel('나의 자기평가').fill('마지막 E에 도착하는 느낌이 좋았다. 다음에는 쉼을 넣어 보겠다.');
  await page.getByRole('button', { name: '자기평가 저장' }).click();
  await expect(page.getByTestId('music-balance')).toHaveText('1');
  const evidence = await report(page);
  const attempt = evidence.locator('[data-attempt-content-id="a07-targets"]');
  await expect(attempt).toContainText('시범 재생 사용');
  await expect(attempt).toContainText('마지막 E에 도착하는 느낌이 좋았다. 다음에는 쉼을 넣어 보겠다.');
  await expect(attempt).toContainText('자동 점수나 교사 평가가 아닌 사용자 작성 기록');
  await expect.poll(() => page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('sky-sprout.music.progress.v1') ?? '{}');
    const item = saved.attempts?.find((entry: { contentId: string }) => entry.contentId === 'a07-targets');
    return { text: item?.reflection?.text, completed: item?.completed, balance: saved.ledger?.balance };
  })).toEqual({ text: '마지막 E에 도착하는 느낌이 좋았다. 다음에는 쉼을 넣어 보겠다.', completed: true, balance: 1 });
  await page.reload();
  await page.getByRole('button', { name: '음악 정원 시작' }).click();
  await page.getByRole('button', { name: '학습 기록', exact: true }).click();
  await expect(page.locator('.evidence-reflection')).toContainText('다음에는 쉼을 넣어 보겠다.');
});

test('U44/U45 offers optional prerequisite practice after repeated mismatches and records a direct skip without diagnosis', async ({ page }) => {
  await garden(page);
  await open(page, 'f13-c-major');
  await safe(page);
  for (const midi of [60, 63, 67]) await note(page, midi);
  await page.getByRole('button', { name: '조건 확인', exact: true }).click();
  await page.getByRole('button', { name: '조건 확인', exact: true }).click();
  const support = page.getByRole('region', { name: '나에게 맞는 다음 연습' });
  await expect(support.getByRole('heading')).toHaveText('다른 방법으로 이어가도 좋아요');
  await expect(support.getByRole('button', { name: /F02 ·/ })).toBeVisible();
  await expect(support).toContainText('필수 잠금이나 능력 진단이 아닙니다');
  const skip = support.getByRole('button', { name: '다음 활동으로 직접 건너뛰기' });
  await expect(skip).toBeDisabled();
  await page.getByLabel('건너뛰는 이유').selectOption('explore_first');
  await skip.click();
  await expect(page.getByTestId('music-practice')).toHaveAttribute('data-content-id', 'f13-c-minor');
  await expect(page.getByTestId('music-balance')).toHaveText('0');
  const evidence = await report(page);
  const attempt = evidence.locator('[data-attempt-content-id="f13-c-major"]');
  await expect(attempt).toContainText('직접 건너뛰기 · 진단 없음');
  await expect(attempt).toContainText('다른 내용을 먼저 탐색');
  await expect(attempt).toContainText('2회 · 이동 사건 제외');
  await expect(attempt).toContainText('진단검사를 실시하지 않았으며 완료·숙달로 간주하지 않습니다');
  await expect.poll(() => page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('sky-sprout.music.progress.v1') ?? '{}');
    return saved.attempts?.find((item: { contentId: string }) => item.contentId === 'f13-c-major');
  })).toMatchObject({ completed: false, navigationDecision: { kind: 'direct_skip', reason: 'explore_first', diagnosisPerformed: false, targetContentId: 'f13-c-minor' } });
});

test('learning area tabs support roving focus, wrapping arrows, Home and End', async ({ page }) => {
  await garden(page);
  const tabs = page.getByRole('tablist', { name: '학습 영역' }).getByRole('tab');
  await tabs.nth(0).focus();
  await expect(tabs.nth(0)).toHaveAttribute('tabindex', '0');
  await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1');
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-module-id="J01"]')).toBeVisible();
  await page.keyboard.press('End');
  await expect(tabs.nth(3)).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.nth(3)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tabs.nth(0)).toBeFocused();
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(3)).toHaveAttribute('tabindex', '-1');
});

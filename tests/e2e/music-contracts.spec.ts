import { expect, test } from '@playwright/test';

test('flag off leaves story and old editor available and preserves learning storage', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('sky-sprout.music.progress.v1', 'preserve-this-original'));
  await page.goto('/?music=off');
  await expect(page.getByRole('button', { name: '음악 정원 시작' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Create Level' }).click();
  await expect(page.getByRole('button', { name: '음악 편집기 열기' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Back to menu' }).click();
  await page.getByRole('button', { name: 'Play Story' }).click();
  await expect(page.locator('canvas')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('sky-sprout.music.progress.v1'))).toBe('preserve-this-original');
});

test('pausing a listening stimulus cancels the pending confirmation and muting invalidates a fresh hearing', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: '음악 정원 시작' }).click();
  await page.getByRole('button', { name: '연습 설정' }).click();
  await page.getByLabel('도움 정도').selectOption('practice');
  await page.locator('[data-exercise-id="f01-listen-1"]').click();
  await page.getByRole('button', { name: /문제 소리 듣기/ }).click();
  await page.getByRole('button', { name: 'Ⅱ 일시정지', exact: true }).click();
  await page.getByRole('button', { name: '▶ 계속하기', exact: true }).click();
  // Wait beyond the first scheduled stimulus, including its confirmation timer.
  await page.waitForTimeout(3000);
  const confirm = page.getByRole('button', { name: '소리가 들렸어요' });
  await expect(confirm).toBeDisabled();
  await page.getByRole('button', { name: /문제 소리 듣기/ }).click();
  await expect(confirm).toBeEnabled({ timeout: 6000 }); await confirm.click();
  await page.getByRole('button', { name: '소리 끄기 / 재생 중단' }).click();
  await page.getByRole('button', { name: /점프 없이 안전하게 선택/ }).click();
  await page.getByRole('button', { name: '두 번째가 높음 ↑', exact: true }).click();
  await page.getByRole('button', { name: '조건 확인', exact: true }).click();
  await expect(page.locator('.music-feedback')).toContainText('미측정');
  await expect(page.getByTestId('music-balance')).toHaveText('0');
});

test('teacher purpose blocks contradictory grading, reorders by keyboard and converts exposed listening to theory', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Create Level' }).click();
  await page.getByRole('button', { name: '음악 편집기 열기' }).click();
  const apply = page.getByRole('button', { name: '검증 후 레벨에 적용' });
  await page.getByLabel('학습 목적').selectOption('create_phrase');
  await expect(apply).toBeDisabled();
  await expect(page.getByLabel('음악 검증 결과')).toContainText('자유 창작');
  await page.getByLabel('학습 목적').selectOption('follow_pattern');
  await page.getByRole('button', { name: '2번째 목표 앞으로 이동' }).focus();
  await page.keyboard.press('Enter');
  const json = page.getByRole('textbox', { name: '음악 과제 JSON' });
  expect(JSON.parse(await json.inputValue()).target).toEqual(['E4', 'C4', 'G4']);
  await page.getByRole('button', { name: '수정 되돌리기', exact: true }).click();
  expect(JSON.parse(await json.inputValue()).target).toEqual(['C4', 'E4', 'G4']);
  await page.getByLabel('검증된 예시에서 시작').selectOption('f01-listen-1');
  await page.getByRole('button', { name: '새 과제로 복사' }).click();
  await page.getByLabel('정답 예시 표시').selectOption('visible');
  await expect(apply).toBeDisabled();
  await expect(page.getByLabel('음악 검증 결과')).toContainText('답 이름이 노출');
  await page.getByRole('button', { name: '기호 이해 시범으로 목적·명칭 변경' }).click();
  await expect(apply).toBeEnabled();
  expect(JSON.parse(await json.inputValue())).toMatchObject({ kind: 'contextual_choice', learningPurpose: 'theory_demo', assessmentDomain: 'symbolic_theory' });
  await expect(page.getByLabel('과제 이름')).toHaveValue(/기호 이해/);
});

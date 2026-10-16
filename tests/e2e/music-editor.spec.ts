import { expect, test } from '@playwright/test';

test('teacher edits validate, keep invalid source, play without live rewards, save and reopen', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Level' }).click();
  await page.getByRole('button', { name: '음악 편집기 열기' }).click();
  const title = page.getByLabel('과제 이름');
  await title.fill(''); await expect(title).toBeVisible();
  await title.fill('우리 수업 도미솔');
  await page.getByLabel('학생에게 보이는 목표').fill('도, 미, 솔을 차례로 모아요.');
  const editor = page.getByRole('textbox', { name: '음악 과제 JSON' });
  const valid = JSON.parse(await editor.inputValue());
  expect(valid.prompt).toBe('도, 미, 솔을 차례로 모아요.');
  const invalid = structuredClone(valid); invalid.notes[0].midi = 61;
  await editor.fill(JSON.stringify(invalid));
  await expect(page.getByRole('button', { name: '검증 후 레벨에 적용' })).toBeDisabled();
  await expect(page.getByLabel('음악 검증 결과')).toContainText('MIDI');
  expect(JSON.parse(await editor.inputValue()).notes[0].midi).toBe(61);
  await editor.fill(JSON.stringify(valid, null, 2));
  await page.getByRole('button', { name: '음악 테스트 플레이' }).click();
  await page.getByRole('button', { name: /점프 없이 안전하게 선택/ }).click();
  for (const midi of [60, 64, 67]) await page.getByRole('button', { name: new RegExp(`MIDI ${midi}$`) }).click();
  await expect(page.getByRole('region', { name: '연습 완료' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('sky-sprout.music.progress.v1'))).toBeNull();
  await page.getByRole('button', { name: '편집기로', exact: true }).click();
  await page.getByRole('button', { name: '검증 후 레벨에 적용' }).click();
  await page.getByRole('button', { name: '편집기로 돌아가기' }).click();
  await page.getByRole('button', { name: 'Save level' }).click();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to menu' }).click();
  await page.getByRole('button', { name: 'My Levels' }).click();
  await page.getByRole('button', { name: 'Edit Untitled Sky Forge Level' }).click();
  await page.getByRole('button', { name: '음악 편집기 열기' }).click();
  await expect(page.getByLabel('과제 이름')).toHaveValue('우리 수업 도미솔');
  expect(JSON.parse(await editor.inputValue()).notes.map((n: { midi: number }) => n.midi)).toEqual([60, 64, 67]);
  expect(errors).toEqual([]);
});

test('unknown music package is retained in editor and cannot replace the saved lesson', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Create Level' }).click();
  await page.getByRole('button', { name: '음악 편집기 열기' }).click();
  const original = '{"schemaVersion":99,"safeRoom":true,"exercises":[]}';
  await page.getByLabel('음악 JSON 가져오기').setInputFiles({ name: 'future.json', mimeType: 'application/json', buffer: Buffer.from(original) });
  await expect(page.getByRole('textbox', { name: '음악 과제 JSON' })).toHaveValue(original);
  await expect(page.getByRole('button', { name: '검증 후 레벨에 적용' })).toBeDisabled();
  await expect(page.getByText(/지원하지 않는 음악 버전 99/)).toBeVisible();
});

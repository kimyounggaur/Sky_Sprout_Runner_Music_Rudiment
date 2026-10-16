import { expect, test, type Page } from '@playwright/test';

test.use({ screenshot: 'only-on-failure' });
test.setTimeout(90_000);

const areaTitles = {
  foundation: '음악의 첫걸음', jazz: '재즈 화성의 길', creative: '나만의 음악', experimental: '실험 온실'
} as const;

async function openActivity(page: Page, id: string, area: keyof typeof areaTitles) {
  await page.goto('/');
  await page.getByRole('button', { name: '음악 정원 시작' }).click();
  await page.getByRole('tab', { name: new RegExp(areaTitles[area]) }).click();
  await page.locator(`[data-exercise-id="${id}"]`).click();
  await expect(page.getByTestId('music-practice')).toHaveAttribute('data-content-id', id);
  await page.getByRole('button', { name: /점프 없이 안전하게 선택/ }).click();
  await expect(page.locator('#safe-options')).toBeVisible();
}

const safeButtons = (page: Page) => page.locator('#safe-options .safe-option-grid');
const tray = (page: Page) => page.locator('.note-tray li:not(.tray-empty)');
const completion = (page: Page) => page.getByRole('region', { name: '연습 완료' });
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function note(page: Page, midi: number) {
  await safeButtons(page).getByRole('button', { name: new RegExp(`MIDI ${midi}(?:,|$)`) }).click();
}

async function label(page: Page, text: string) {
  // These are the visible labels from the supplied design, not target arrays or internal answer APIs.
  await safeButtons(page).getByRole('button').filter({
    has: page.locator('span').filter({ hasText: new RegExp(`^${escapeRegex(text)}$`) })
  }).click();
}

async function submit(page: Page) {
  await page.getByRole('button', { name: '조건 확인', exact: true }).click();
}

test('F13 unordered G4–C4–E4 completes the C major collection and preserves safe-input evidence', async ({ page }) => {
  await openActivity(page, 'f13-c-major', 'foundation');
  for (const midi of [67, 60, 64]) await note(page, midi);
  await expect(tray(page)).toHaveCount(3);
  await submit(page);
  await expect(completion(page)).toBeVisible();
  await expect(page.locator('.music-feedback')).toContainText('순서와 관계없이');
  await expect(page.getByTestId('music-balance')).toHaveText('1');
  await expect.poll(() => page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('sky-sprout.music.progress.v1') ?? '{}');
    return saved.attempts?.find((item: { contentId: string }) => item.contentId === 'f13-c-major');
  })).toMatchObject({ answerSnapshot: ['G4', 'C4', 'E4'], completed: true, inputMode: 'safe' });
});

test('F15 uses actual lowest pitch rather than first selection and allows a different E-bass voicing', async ({ page }) => {
  await openActivity(page, 'f15-first-inversion', 'foundation');
  // E selected first does not make this C3–E4–G4 voicing first inversion.
  for (const midi of [64, 67, 48]) await note(page, midi);
  await submit(page);
  await expect(completion(page)).toHaveCount(0);
  await expect(page.locator('.music-feedback')).toContainText('실제 가장 낮은 음');
  await expect(page.getByTestId('music-balance')).toHaveText('0');
  await expect(tray(page)).toHaveCount(3);
  await page.getByRole('button', { name: '트레이 비우기' }).click();
  // C4 and G4 are selected before E3; final actual bass is still E3.
  for (const midi of [60, 67, 52]) await note(page, midi);
  await submit(page);
  await expect(completion(page)).toBeVisible();
  await expect(page.getByTestId('music-balance')).toHaveText('1');
});

test('F05 accepts an alternative four-beat composition with an explicit rest', async ({ page }) => {
  await openActivity(page, 'f05-four-beats', 'foundation');
  await label(page, '2분음표 · 2박');
  await label(page, '4분쉼표 · 1박 쉼');
  await submit(page);
  await expect(completion(page)).toHaveCount(0);
  await expect(page.locator('.music-feedback')).toContainText('총 4박');
  await expect(tray(page)).toHaveCount(2);
  await label(page, '4분음표 · 1박');
  await submit(page);
  await expect(completion(page)).toBeVisible();
  await expect(page.getByTestId('music-balance')).toHaveText('1');
});

test('F19 repairs C7 to Cmaj7 at the end of the real ii7–V7–Imaj7 chord route', async ({ page }) => {
  await openActivity(page, 'f19-c-251', 'foundation');
  for (const chord of ['Dm7 · ii7', 'G7 · V7', 'C7']) await label(page, chord);
  await submit(page);
  await expect(completion(page)).toHaveCount(0);
  await expect(page.getByTestId('music-balance')).toHaveText('0');
  await page.getByRole('button', { name: '한 칸 되돌리기' }).click();
  await expect(tray(page)).toHaveCount(2);
  await label(page, 'Cmaj7 · Imaj7');
  await submit(page);
  await expect(completion(page)).toBeVisible();
  await expect(page.getByTestId('music-balance')).toHaveText('1');
});

test('J02 guide tones keep fixed voice identities when the higher voice is selected first', async ({ page }) => {
  await openActivity(page, 'j02-guide-d-g', 'jazz');
  await expect(page.getByRole('heading', { name: '함께 흐르는 음악' })).toBeVisible();
  await expect(page.locator('.music-context')).toContainText('D2');
  await expect(page.locator('.music-context')).toContainText('G2');
  await label(page, '높은 성부 C4 → B3');
  await label(page, '낮은 성부 F3 유지');
  await submit(page);
  await expect(completion(page)).toBeVisible();
  await expect(page.locator('.music-feedback')).toContainText('총 이동 1반음');
  await expect(page.getByTestId('music-balance')).toHaveText('1');
});

test('A07 accepts two distinct original phrases with the fixed F4/B4/E4 bar arrivals and awards once', async ({ page }) => {
  await openActivity(page, 'a07-targets', 'creative');
  const phrases = [
    [65, 67, 69, 72, 71, 67, 65, 62, 64, 67, 69, 72],
    [65, 65, 65, 65, 71, 71, 71, 63, 64, 64, 64, 64]
  ];
  for (const [index, phrase] of phrases.entries()) {
    if (index) await page.getByRole('button', { name: '이 방 다시 연습' }).click();
    for (const midi of phrase) await note(page, midi);
    await expect(tray(page)).toHaveCount(12);
    await submit(page);
    await expect(completion(page)).toBeVisible();
    await expect(page.locator('.music-feedback')).toContainText('공개된 조건');
    await expect(page.getByTestId('music-balance')).toHaveText('1');
  }
  await expect.poll(() => page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('sky-sprout.music.progress.v1') ?? '{}');
    return saved.attempts?.filter((item: { contentId: string; completed: boolean }) => item.contentId === 'a07-targets' && item.completed).map((item: { answerSnapshot: string[] }) => item.answerSnapshot);
  })).toEqual([
    ['F4', 'G4', 'A4', 'C5', 'B4', 'G4', 'F4', 'D4', 'E4', 'G4', 'A4', 'C5'],
    ['F4', 'F4', 'F4', 'F4', 'B4', 'B4', 'B4', 'D#4', 'E4', 'E4', 'E4', 'E4']
  ]);
});

test('J20 completes the supplied 32-bar AABA with a distinct final B-flat-six cadence', async ({ page }) => {
  await openActivity(page, 'j20-rhythm-changes32', 'jazz');
  const a = ['B♭6 · 2박', 'G7 · 2박', 'Cm7 · 2박', 'F7 · 2박', 'Dm7 · 2박', 'G7 · 2박', 'Cm7 · 2박', 'F7 · 2박', 'Fm7 · 2박', 'B♭7 · 2박', 'E♭6 · 2박', 'Edim7 · 2박', 'B♭6/F · 2박', 'G7 · 2박', 'Cm7 · 2박', 'F7 · 2박'];
  const bridge = ['D7 · 4박', 'D7 · 4박', 'G7 · 4박', 'G7 · 4박', 'C7 · 4박', 'C7 · 4박', 'F7 · 4박', 'F7 · 4박'];
  // Written directly from the design's AABA example. No imported/runtime answer array is read.
  for (const chord of [...a, ...a, ...bridge, ...a.slice(0, -2)]) await label(page, chord);
  await expect(tray(page)).toHaveCount(54);
  await submit(page);
  await expect(completion(page)).toHaveCount(0);
  await expect(page.getByTestId('music-balance')).toHaveText('0');
  await label(page, 'B♭6 · 종결 4박');
  await expect(tray(page)).toHaveCount(55);
  await submit(page);
  await expect(completion(page)).toBeVisible();
  await expect(page.getByTestId('music-balance')).toHaveText('1');
  await expect(tray(page).last()).toContainText('B♭6 · 종결 4박');
});

test('X03 schedules distinct minus/plus25-cent oscillator frequencies through the real playback UI', async ({ page }) => {
  await page.addInitScript(() => {
    const target = window as unknown as { __musicScheduledFrequencies: number[] };
    target.__musicScheduledFrequencies = [];
    const createOscillator = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const oscillator = createOscillator.call(this);
      const scheduleFrequency = oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
      oscillator.frequency.setValueAtTime = (value: number, time: number) => {
        target.__musicScheduledFrequencies.push(value);
        return scheduleFrequency(value, time);
      };
      return oscillator;
    };
  });
  await openActivity(page, 'x03-cents', 'experimental');
  await label(page, 'E4 −25센트');
  await page.getByRole('button', { name: /내가 고른 음악 듣기/ }).click();
  const capturedFrequency = () => page.evaluate(() => (window as unknown as { __musicScheduledFrequencies: number[] }).__musicScheduledFrequencies.at(-1));
  await expect.poll(capturedFrequency).toBeCloseTo(440 * 2 ** ((64 - 69) / 12 - 25 / 1200), 5);
  await submit(page);
  await expect(completion(page)).toHaveCount(0);
  await page.getByRole('button', { name: '트레이 비우기' }).click();
  await label(page, 'E4 +25센트');
  await page.getByRole('button', { name: /내가 고른 음악 듣기/ }).click();
  await expect.poll(capturedFrequency).toBeCloseTo(440 * 2 ** ((64 - 69) / 12 + 25 / 1200), 5);
  await submit(page);
  await expect(completion(page)).toBeVisible();
  await expect(page.getByTestId('music-balance')).toHaveText('1');
  await expect(page.locator('.practice-intro')).toContainText('센트 편차 +25');
  // This verifies real Web Audio scheduling, not physical loudspeaker output or listening achievement.
});

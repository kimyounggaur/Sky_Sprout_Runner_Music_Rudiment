import { expect, test, type Page } from '@playwright/test';

test.setTimeout(60_000);

/** Deterministic output-clock fixture: exercises lifecycle/UI, not real audio latency. */
async function installClockAudio(page: Page) {
  await page.clock.install();
  await page.addInitScript(() => {
    const fixture = { starts: [] as number[], contexts: [] as EventTarget[] };
    Object.defineProperty(window, '__TIMING_FIXTURE__', { value: fixture });
    class ClockAudioContext extends EventTarget {
      state = 'running'; destination = {}; onstatechange: (() => void) | null = null;
      constructor() { super(); fixture.contexts.push(this); }
      get currentTime() { return 1 + performance.now() / 1000; }
      async resume() { this.state = 'running'; }
      async close() { this.state = 'closed'; }
      getOutputTimestamp() { const now = performance.now(); return { contextTime: 1 + now / 1000, performanceTime: Math.max(0.001, now) }; }
      createOscillator() {
        return { type: 'triangle', frequency: { setValueAtTime() {} }, onended: null as (() => void) | null,
          connect() {}, disconnect() {}, stop() {}, start(time: number) { fixture.starts.push((time - 1) * 1000); } };
      }
      createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
    }
    Object.defineProperty(window, 'AudioContext', { value: ClockAudioContext, configurable: true });
  });
}

async function openRhythm(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: '음악 정원 시작' }).click();
  await page.locator('[data-exercise-id="f05-four-beats"]').click();
  await expect(page.getByRole('region', { name: '안전 리듬 패드' })).toBeVisible();
  await page.getByText('반응 편향 보정 · 선택 사항', { exact: true }).click();
}

async function feedTake(page: Page, errors: number[]) {
  const targets = await page.evaluate(count => {
    const fixture = (window as unknown as { __TIMING_FIXTURE__: { starts: number[] } }).__TIMING_FIXTURE__;
    return fixture.starts.slice(-count);
  }, errors.length);
  expect(targets).toHaveLength(errors.length);
  for (let index = 0; index < targets.length; index++) {
    const timestamp = targets[index] + errors[index];
    const current = await page.evaluate(() => performance.now());
    if (timestamp > current) await page.clock.fastForward(timestamp - current);
    await page.locator('.rhythm-pad').evaluate((element, time) => {
      const event = new PointerEvent('pointerdown', { bubbles: true });
      Object.defineProperty(event, 'timeStamp', { value: time });
      element.dispatchEvent(event);
    }, timestamp);
  }
  await page.clock.fastForward(1000);
}

test('U21 stable calibration and U28 raw/quantized playback preserve the original result', async ({ page }) => {
  await installClockAudio(page); await openRhythm(page);
  await page.getByRole('button', { name: '8박 보정 표본 시작' }).click();
  await expect(page.getByTestId('rhythm-status')).toContainText('낮은 소리 8번');
  await feedTake(page, [80, 80, 80, 80, 80, 80, 80, 80]);
  await expect(page.getByTestId('rhythm-calibration')).toContainText('반응 편향 80.0 ms');
  await page.getByRole('button', { name: '카운트인 시작', exact: true }).click();
  await expect(page.getByTestId('rhythm-status')).toContainText('낮은 소리 4번');
  await feedTake(page, [80, -20, 100, 0]);
  await expect(page.locator('.timing-results')).toContainText('원본 80 ms / 반응 보정 0 ms');
  const original = await page.locator('.timing-results li').allTextContents();
  await page.getByRole('button', { name: '원입력 그대로 재생' }).click();
  await expect(page.getByRole('status').filter({ hasText: '원입력 재생 · 입력 간격 그대로' })).toBeVisible();
  await expect(page.locator('.timing-results li')).toHaveText(original);
  await page.getByRole('button', { name: '양자화한 사본 재생' }).click();
  await expect(page.getByRole('status').filter({ hasText: '양자화 재생 · 가까운 박으로 옮긴 사본' })).toBeVisible();
  await expect(page.locator('.timing-results li')).toHaveText(original);
  await expect(page.getByTestId('music-balance')).toHaveText('0');
});

test('U21 unstable samples defer calibration; U22 sink changes discard the running take', async ({ page }) => {
  await installClockAudio(page); await openRhythm(page);
  await page.getByRole('button', { name: '8박 보정 표본 시작' }).click();
  await expect(page.getByTestId('rhythm-status')).toContainText('낮은 소리 8번');
  await feedTake(page, [-90, 90, -90, 90, -90, 90, -90, 90]);
  await expect(page.getByTestId('rhythm-calibration')).toContainText('변동 또는 편향이 시제품 기준을 넘었습니다');
  await expect(page.getByTestId('rhythm-calibration')).toContainText('적용 보류');
  await page.getByRole('button', { name: '카운트인 시작', exact: true }).click();
  await expect(page.locator('.rhythm-pad')).toBeEnabled();
  await page.evaluate(() => {
    const fixture = (window as unknown as { __TIMING_FIXTURE__: { contexts: EventTarget[] } }).__TIMING_FIXTURE__;
    fixture.contexts.at(-1)?.dispatchEvent(new Event('sinkchange'));
  });
  await expect(page.locator('.rhythm-pad')).toBeDisabled();
  await expect(page.getByTestId('rhythm-status')).toContainText('출력 장치 변경');
  await expect(page.getByTestId('rhythm-status')).toContainText('새 카운트인');
  await expect(page.locator('.timing-results')).toHaveCount(0);
  await expect(page.getByTestId('music-balance')).toHaveText('0');
});

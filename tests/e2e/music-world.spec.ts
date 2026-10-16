import { expect, test, type Page } from '@playwright/test';

test.use({ screenshot: 'only-on-failure' });
test.setTimeout(60_000);

async function openGarden(page: Page) {
  await page.goto('/?music-test');
  await page.getByRole('button', { name: '음악 정원 시작' }).click();
}

async function openFirstPractice(page: Page) {
  await openGarden(page);
  await page.getByRole('button', { name: /도–미–솔, 첫 연습 시작/ }).click();
  await expect(page.getByTestId('music-practice')).toHaveAttribute('data-content-id', 'f02-c');
  await expect.poll(() => page.evaluate(() => window.__MUSIC_WORLD__?.getSnapshot().ready)).toBe(true);
}

const world = (page: Page) => page.evaluate(() => window.__MUSIC_WORLD__!.getSnapshot());
const trayNotes = (page: Page) => page.locator('.note-tray li:not(.tray-empty)');

async function moveTo(page: Page, targetX: number) {
  const before = await world(page);
  const key = before.player!.x < targetX ? 'ArrowRight' : 'ArrowLeft';
  await page.getByTestId('music-world-focus').focus();
  await page.keyboard.down(key);
  try {
    await page.waitForFunction(({ x, direction }) => {
      const position = window.__MUSIC_WORLD__!.getSnapshot().player!.x;
      return direction === 'ArrowRight' ? position >= x - 8 : position <= x + 8;
    }, { x: targetX, direction: key }, { timeout: 10_000 });
  } finally { await page.keyboard.up(key); }
  await page.waitForTimeout(160);
}

async function jump(page: Page, duration = 240) {
  const startY = (await world(page)).player!.y;
  await page.keyboard.down('Space');
  await Promise.all([
    page.waitForTimeout(duration),
    page.waitForFunction(y => window.__MUSIC_WORLD__!.getSnapshot().player!.y < y - 1, startY)
  ]);
  await page.keyboard.up('Space');
  await expect.poll(async () => (await world(page)).player?.grounded).toBe(true);
}

async function safeChoice(page: Page, midi: number) {
  const toggle = page.getByRole('button', { name: /점프 없이 안전하게 선택/ });
  if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
  await page.getByRole('button', { name: new RegExp(`MIDI ${midi}$`) }).click();
}

test('physical head contacts, wrong order, safe fall, pause and Wind Gate preserve learning', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await openFirstPractice(page);
  const initial = await world(page);
  expect(initial.player).toMatchObject({ health: 3, width: 22, height: 34 });
  expect(initial.gate.open).toBe(false);

  // The first answer comes from real keyboard motion and the unchanged Player jump.
  await moveTo(page, initial.blocks[0].x);
  await jump(page);
  await expect(trayNotes(page)).toHaveCount(1);
  await jump(page);
  await expect(trayNotes(page)).toHaveCount(1);
  await expect(page.getByTestId('music-balance')).toHaveText('0');
  const outsideInput = await world(page);
  await page.getByRole('button', { name: '도움 보기' }).focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(180);
  expect((await world(page)).player!.y).toBeCloseTo(outsideInput.player!.y, 1);
  expect((await world(page)).contacts.count).toBe(outsideInput.contacts.count);

  await page.getByRole('button', { name: /일시정지/ }).click();
  const frozen = await world(page);
  await page.getByTestId('music-world-focus').focus();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowRight');
  expect((await world(page)).player!.x).toBeCloseTo(frozen.player!.x, 1);
  await page.getByRole('button', { name: /계속하기/ }).click();

  // Fall from the actual left cliff; no direct call to a return/answer API.
  await page.getByTestId('music-world-focus').focus();
  await page.keyboard.down('ArrowLeft');
  await expect.poll(async () => (await world(page)).player!.x, { timeout: 1500 }).toBeLessThan(frozen.player!.x - 5);
  await expect(page.locator('.music-world-status')).toContainText('돌아왔어요', { timeout: 6000 });
  await page.keyboard.up('ArrowLeft');
  expect((await world(page)).player!.health).toBe(3);
  expect((await world(page)).interactions.fall).toBe(1);
  await expect(trayNotes(page)).toHaveCount(1);

  await moveTo(page, initial.blocks[2].x); await jump(page);
  await expect(trayNotes(page)).toHaveCount(1);
  await expect(page.locator('.music-feedback')).toContainText(/차례|순서/);
  await expect(page.locator('.music-feedback')).toContainText('G4도 이 화음의 구성음');
  await moveTo(page, initial.blocks[1].x); await jump(page);
  await expect(trayNotes(page)).toHaveCount(2);
  await moveTo(page, initial.blocks[2].x); await jump(page);
  await expect(page.getByTestId('music-balance')).toHaveText('1');
  expect((await world(page)).gate.open).toBe(true);
  await page.getByTestId('music-world-focus').focus();
  await page.keyboard.down('ArrowRight');
  try {
    await expect(page.getByTestId('music-practice')).toHaveAttribute('data-content-id', 'f02-f', { timeout: 6000 });
  } finally { await page.keyboard.up('ArrowRight'); }
  expect(errors).toEqual([]);
});

test('side contact is recorded once per separation without selecting a note or counting a manual return as a fall', async ({ page }) => {
  await openFirstPractice(page);
  await safeChoice(page, 60);
  await page.getByRole('button', { name: /점프 없이 안전하게 선택/ }).click();
  // Set up only the collision geometry. Actual keyboard motion causes contact.
  await page.evaluate(() => {
    const player = window.__MUSIC_WORLD__!.scene.children.getByName('Sprout') as Phaser.Physics.Arcade.Sprite;
    const body = player.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.reset(195, 244);
  });
  await page.getByTestId('music-world-focus').focus();
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await world(page)).interactions.invalid_contact).toBe(1);
  await page.waitForTimeout(500);
  expect((await world(page)).interactions.invalid_contact).toBe(1);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowLeft');
  await expect.poll(async () => (await world(page)).player!.x).toBeLessThan(190);
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await world(page)).interactions.invalid_contact).toBe(2);
  await page.keyboard.up('ArrowRight');
  expect((await world(page)).contacts.count).toBe(0);
  await expect(trayNotes(page)).toHaveCount(1);
  await page.evaluate(() => {
    const player = window.__MUSIC_WORLD__!.scene.children.getByName('Sprout') as Phaser.Physics.Arcade.Sprite;
    (player.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);
  });
  await page.getByRole('button', { name: '등불로 돌아오기', exact: true }).click();
  expect((await world(page)).interactions.fall).toBe(0);
  await expect(page.getByTestId('music-balance')).toHaveText('0');
  await expect.poll(() => page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('sky-sprout.music.progress.v1') ?? '{}');
    return saved.attempts?.find((attempt: { contentId: string }) => attempt.contentId === 'f02-c');
  })).toMatchObject({ invalidEvents: 2, motorEvents: 0, conditionMismatches: 0 });
});

test('safe C and F sequences award exactly once across retry and reload', async ({ page }) => {
  await openFirstPractice(page);
  await safeChoice(page, 60);
  await safeChoice(page, 67);
  await expect(trayNotes(page)).toHaveCount(1);
  await safeChoice(page, 64);
  await expect(trayNotes(page)).toHaveCount(2);
  await expect(page.locator('.next-note')).toContainText('G4');
  await safeChoice(page, 67);
  await expect(page.getByTestId('music-balance')).toHaveText('1');
  await page.getByRole('button', { name: /다음 연습으로/ }).click();
  await expect(page.getByTestId('music-practice')).toHaveAttribute('data-content-id', 'f02-f');
  await safeChoice(page, 65); await safeChoice(page, 69); await safeChoice(page, 60);
  await expect(trayNotes(page)).toHaveCount(2);
  await safeChoice(page, 72);
  await expect(page.getByTestId('music-balance')).toHaveText('2');
  await page.getByRole('button', { name: '이 방 다시 연습' }).click();
  await safeChoice(page, 65); await safeChoice(page, 69); await safeChoice(page, 72);
  await expect(page.getByTestId('music-balance')).toHaveText('2');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sky-sprout.music.progress.v1') ?? '{}').ledger?.balance)).toBe(2);
  await page.reload();
  await page.getByRole('button', { name: '음악 정원 시작' }).click();
  await expect(page.getByTestId('music-balance')).toHaveText('2');
  await page.getByRole('button', { name: /도–미–솔, 첫 연습 시작/ }).click();
  await safeChoice(page, 60); await safeChoice(page, 64); await safeChoice(page, 67);
  await expect(page.getByTestId('music-balance')).toHaveText('2');
});

test('portrait uses a scrolling camera, 44px controls and single-pointer safe selection', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openFirstPractice(page);
  const snapshot = await world(page);
  expect(snapshot.camera.width).toBeLessThanOrEqual(390);
  expect(snapshot.camera.width).toBeGreaterThan(300);
  const controls = await page.locator('.music-world-controls button').evaluateAll(buttons => buttons.map(button => {
    const bounds = button.getBoundingClientRect(); return { width: bounds.width, height: bounds.height };
  }));
  controls.forEach(bounds => { expect(bounds.width).toBeGreaterThanOrEqual(44); expect(bounds.height).toBeGreaterThanOrEqual(44); });
  const right = page.getByRole('button', { name: '오른쪽으로 이동' });
  await right.scrollIntoViewIfNeeded();
  const bounds = (await right.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(250);
  await page.mouse.move(bounds.x + 200, bounds.y - 60);
  await page.mouse.up();
  await page.waitForTimeout(160);
  const afterRelease = (await world(page)).player!.x;
  expect(afterRelease).toBeGreaterThan(snapshot.player!.x + 10);
  await page.waitForTimeout(200);
  expect((await world(page)).player!.x).toBeCloseTo(afterRelease, 1);
  await safeChoice(page, 60); await safeChoice(page, 64); await safeChoice(page, 67);
  await expect(page.getByRole('region', { name: '연습 완료' })).toBeVisible();
  await expect(page.getByTestId('music-balance')).toHaveText('1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('release then re-press in one frame starts a fresh jump without the previous jump cut', async ({ page }) => {
  await openFirstPractice(page);
  await moveTo(page, (await world(page)).blocks[0].x);
  await page.evaluate(() => {
    const player = window.__MUSIC_WORLD__!.scene.children.getByName('Sprout') as Phaser.GameObjects.GameObject & { grow: () => boolean };
    player.grow();
  });
  await page.keyboard.down('Space');
  await expect.poll(async () => (await world(page)).contacts.count).toBe(1);
  await expect.poll(async () => (await world(page)).player!.grounded).toBe(true);
  // Both DOM edges are delivered before the next Phaser update. The old keyup
  // belongs to the completed jump; it must not cut the new held jump.
  const velocityAfterFrame = await page.evaluate(() => new Promise<number>(resolve => {
    const scene = window.__MUSIC_WORLD__!.scene;
    const region = document.querySelector('[data-testid="music-world-focus"]')!;
    region.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', bubbles: true }));
    region.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
    scene.events.once('postupdate', () => resolve(window.__MUSIC_WORLD__!.getSnapshot().player!.velocityY));
  }));
  expect(velocityAfterFrame).toBe(-455);
  await expect.poll(async () => (await world(page)).contacts.count).toBe(2);
  await page.keyboard.up('Space');
  await expect(trayNotes(page)).toHaveCount(1);
  await expect.poll(async () => (await world(page)).player!.grounded).toBe(true);
  const shortTapVelocity = await page.evaluate(() => new Promise<number>(resolve => {
    const scene = window.__MUSIC_WORLD__!.scene;
    const region = document.querySelector('[data-testid="music-world-focus"]')!;
    region.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
    region.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', bubbles: true }));
    scene.events.once('postupdate', () => resolve(window.__MUSIC_WORLD__!.getSnapshot().player!.velocityY));
  }));
  expect(shortTapVelocity).toBe(-175);
});

test('music block height is reachable with normal and grown bodies at 30, 60 and variable physics steps', async ({ page }) => {
  await openFirstPractice(page);
  const first = (await world(page)).blocks[0];
  await moveTo(page, first.x);
  for (const grown of [false, true]) {
    if (grown) {
      await page.evaluate(() => {
        const player = window.__MUSIC_WORLD__!.scene.children.getByName('Sprout') as Phaser.GameObjects.GameObject & { grow: () => boolean };
        player.grow();
      });
      await page.waitForTimeout(100);
      expect((await world(page)).player!.height).toBe(68);
    }
    for (const fps of [30, 60, 0]) {
      await page.evaluate((rate) => {
        const physics = window.__MUSIC_WORLD__!.scene.physics.world;
        physics.fixedStep = rate !== 0;
        physics.setFPS(rate || 60);
      }, fps);
      for (const duration of [150, 260]) {
        const before = (await world(page)).contacts.count;
        await jump(page, duration);
        await expect.poll(async () => (await world(page)).contacts.count, { message: `grown=${grown}, physicsHz=${fps}, pressMs=${duration}` }).toBe(before + 1);
        expect((await world(page)).contacts.last?.id).toBe(first.id);
      }
    }
  }
});

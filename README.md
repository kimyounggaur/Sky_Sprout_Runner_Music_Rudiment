# Sky Sprout Runner

## 음악 정원 · 로컬 릴리스 후보

사용자가 제공한 `Sky-Sprout/Sky-Sprout-Art-Pack-v1`과 `스카이러너_음악이론_재즈화성학_VIBE코딩_프롬프트팩_v1.0.md`를 기반으로 음악이론·재즈화성학 학습 경로를 추가했습니다. 기존 Story와 Sky Forge Editor를 유지하며 첫 화면의 **음악 정원 시작**으로 들어갑니다. React / TypeScript / Phaser 3 / Web Audio로 동작하는 정적 웹 앱입니다.

**현재 범위:** F01–F24, J01–J28, A01–A16, X01–X06의 74개 개념에 103개 활동이 있습니다. 카탈로그는 76개이며 X07 실제 악기 연결과 X08 문화별 전문 자료는 준비 중입니다. 고급 활동은 명시된 조·음역·문맥의 실습 예시입니다. 전문가나 실제 학습자가 전 과정을 검수한 정식 교재로 표시하지 않습니다.

### 실행과 사용

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 5180
```

브라우저에서 `http://127.0.0.1:5180`을 엽니다. 빌드 결과는 HTTP 정적 서버로 열어야 하며 `dist/index.html`을 파일로 직접 열지 않습니다.

- 첫 연습은 C4 → E4 → G4, 다음은 F4 → A4 → C5입니다. F 과제의 C4는 옥타브가 달라 정답으로 처리하지 않습니다.
- 게임 영역을 클릭하거나 Tab으로 초점을 둔 뒤 방향키/A·D로 이동하고 Space/W/↑로 블록 아래에서 점프합니다. 같은 블록도 접촉을 완전히 분리한 다음 다시 칠 수 있습니다.
- **점프 없이 안전하게 선택**을 열면 세계 이동이 멈추고 같은 판정을 버튼·키보드로 연습합니다. 느리게 답해도 시간 감점은 없습니다.
- 지도에서 고정도/이동도, 안내/적용, 움직임 감소, 안전 선택을 설정합니다. 청음은 **적용**에서 문제 소리를 끝까지 듣고 실제로 들렸음을 확인해야 합니다. 답 노출·무음·중단은 미측정입니다.
- 위치를 바꾼 C/F 확인은 별도 활동·기록입니다. 정밀 리듬은 점프 비행시간으로 채점하지 않으며 별도 패드의 원입력 시각으로 관찰합니다.
- 교사 편집기는 기존 **Create Level → Music** 또는 음악 지도의 **교사 편집기**에서 엽니다. 목표·음높이·대안 답·자유 창작 제약을 검증하고, 순서 버튼/JSON/Undo/Redo로 수정하며, 원래 레벨 저장·불러오기와 연결됩니다. 테스트 플레이의 보상·학습 기록은 미리보기 안에서만 유지됩니다.
- 학생 보고서는 이동 사건, 음악 조건 불일치, 도움·시범·안전 입력, 직접 건너뛰기, 미측정 영역과 창작 자기평가를 구분합니다. 보상은 활동별 최초 조건 충족 시 1개이며 Story 점수·수집률에 합산하지 않습니다.

### 단계별 구현 지도

| 단계 | 로컬 구현 | 남은 검증/한계 |
|---|---|---|
| S00–S01 | 원본 파일·실행 경로 조사, baseline 복사/해시, 원본 회귀 | 현재 폴더에는 `.git`과 별도 v2.0 설계 원문이 없음 |
| S02–S07 | 음높이/철자 계약, 불변 세션, 접촉 중복 제거, C/F 방, 안전 복귀, 독립 보상 | 진행 중 Story 장면을 저장·복원하는 출입 기능 대신 메뉴에서 분리 실행 |
| S08–S11 | 기보·음정·조성·전위, 위치 변경 확인, 리듬 패드, Web Audio, 교사 검증 | 실제 출력 지연/OS 출력 경로/보조기기는 추가 실기기 검증 필요 |
| S12–S15 | 장·단조 ii–V–I, 가이드톤, 텐션·보이싱, 대리/차용/모드 | 준비된 선택지와 공개 문맥 범위, 자유로운 모든 화성 해석의 자동 인증은 아님 |
| S16–S19 | 12마디 블루스, 32마디 AABA, 타깃·동기, 컴핑/베이스·전조·리하모니 예시 | 창작은 공개 제약과 사실 관찰로 확인하며 예술적 우열을 매기지 않음 |
| S20 | 교사 JSON 왕복, 대안 답 검사, 생성 seed, 순서 편집, 학습 보고서·자기평가 | 교사 콘텐츠의 교육 적합성은 사람의 검토 필요 |
| S21 | X01–X06 한정 실험 | X07/X08 보류. 마이크·MIDI·외부 AI API를 요청하지 않음 |
| S22–S23 | Chromium 실제 흐름, 모바일 크기/키보드/회색조/입력 취소, 수치·콘텐츠 검사 | 실제 iOS/Android·화면낭독기·장기 p95/p99 성능과 전문가 검수 미실행 |
| S24 | 로컬 정적 빌드, 소스·자산 manifest, 수용기준 감사, 복귀 경로 | 원격 저장소·운영 배포는 변경하지 않음 |

67개 수용기준의 정확한 실행/부분/보류 상태는 [수용기준 감사](output/verification/acceptance-audit.json), 최종 명령 결과는 [릴리스 검증 기록](output/verification/release-report.json)을 확인하세요. 일부 통과를 전체 S00–S24 또는 WCAG 인증으로 확대하지 않습니다.

### 검증 명령

```powershell
npm test
npm run lint
npm run build
npx playwright test --workers=2
```

Playwright는 `dist`를 로컬 4173 포트에서 제공하여 production bundle을 검사합니다. `test:e2e`는 build도 함께 수행합니다. 주요 증거는 `tests/unit/music*.test.ts`, `tests/e2e/music-*.spec.ts`, `output/verification`에 있습니다. 물리 도달성의 30/60Hz는 물리 스텝 설정이며 실제 모바일 FPS 측정과 다릅니다.

### 저장과 데이터 보존

- 음악 기록은 `sky-sprout.music.progress.v1` 단일 version-1 봉투에 저장합니다. 최근 200시도와 보상 원장·설정이 포함됩니다. 이름·이메일·녹음·외부 전송은 요구하지 않습니다. 자기평가 자유 입력을 내보낼 때는 사용자가 적은 내용도 JSON에 포함됩니다.
- 보상 ID는 로컬 프로필 + 활동 ID + rewardEpoch로 고정하며 재시도·재접속·콘텐츠 설명 수정으로 중복 지급하지 않습니다.
- Web Locks와 revision으로 동시 탭 덮어쓰기를 차단합니다. 손상/미지원 저장, 저장 불가, 다른 탭 변경 시 원문을 덮어쓰지 않고 현재 메모리에서 연습할 수 있습니다. 내보낸 기록은 백업용이며 기록 JSON을 재가져오는 UI는 없습니다.
- Story의 `sky-sprout-runner.best-score`와 `sky-sprout-runner:custom-levels:*`는 별도입니다. 레벨은 기존 version 1에 optional `music` 패키지를 추가합니다. 미지원 음악 버전은 조용히 버리지 않고 거절합니다.
- 음악을 끄려면 `/?music=off`를 열거나 빌드 환경에서 `VITE_MUSIC_ENABLED=false`를 설정합니다. 기존 데이터는 유지합니다. 음악이 포함된 레벨의 실행은 안내 화면으로 대체하며 원래 Story와 일반 레벨 편집은 가능합니다.
- 소스 복귀가 필요하면 먼저 레벨과 학습 기록을 내보내고, `output/baseline`과 현재 파일을 비교한 뒤 이번 변경분만 복구합니다. 사용자 후속 변경을 덮어쓰거나 전체 localStorage를 지우지 마세요. 구버전 앱으로 음악 필드가 있는 레벨을 재저장하면 필드를 잃을 수 있으므로 해당 JSON 백업을 보존하세요.

### 자산과 배포 범위

새싹·구름섬·블록·씨앗 그림은 사용자 제공 아트팩에서 복사했습니다. 원본 제작 기록과 manifest는 아트팩에 있고, 실제 포함 파일 해시와 출처는 `output/verification/asset-provenance.json`에 기록합니다. 별도 제3자 음원·웹폰트는 없으며 음은 Web Audio로 합성합니다. React/React DOM/Phaser의 설치된 라이선스는 MIT입니다. 사용자 제공 이미지의 별도 재배포 라이선스 문서는 확인되지 않아 공개 재배포 권리까지 인증하지 않습니다.

`output/release/sky-sprout-music-local.zip`은 로컬 검토용 정적 빌드 후보입니다. 실기기·전문가 검수와 원격 배포를 완료했다고 의미하지 않습니다.

---

## Original platform game

Sky Sprout Runner is an original browser platform game built with Vite, React, TypeScript, and Phaser 3. The playable demo follows Sprout, a small seedling spirit, across a cloud-island stage to gather Light Seed Shards and reach the Wind Gate.

## Creative Principles

The original Story uses original names, level layouts, code-generated placeholder art, and WebAudio sound effects. The music extension additionally uses the user-provided Sky Sprout art pack described above.

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Open the local URL printed by Vite. The app is a static client-side game and does not need a server or database after build.

## Test

```bash
npm run build
npm run test
npm run test:e2e
npm run lint
```

The E2E suite serves the production build, opens the game in Chromium, checks the original game/editor and the music learning flows.

## Controls

- Left: Arrow Left or A
- Right: Arrow Right or D
- Jump: Space, W, or Arrow Up
- Run: Shift
- Pause: P, Escape, or the top-right touch button
- Restart at checkpoint: R
- Mobile: left/right buttons bottom-left, jump and run buttons bottom-right
- Wall cling: hold toward a wall while falling to slide slowly, then jump to kick away
- Double jump: press jump once more while airborne

## Screen Layout

The first screen is the game menu with the title, Sprout, and a Start button. During play, the HUD sits along the top edge with health, seed count, score, time, checkpoint, and Breeze Orb status. Touch controls are anchored to the bottom corners and the pause button is placed in the top-right corner so it does not cover the HUD.

## Architecture

- `src/components/GameCanvas.tsx` mounts and destroys the Phaser game instance from React.
- `src/game/scenes` contains Boot, Menu, Level, HUD, Pause, Game Over, and Clear scenes.
- `src/game/entities` contains Player, enemies, pickups, hazards, checkpoints, platforms, and the finish gate.
- `src/game/systems` contains input, touch controls, scoring, saving, audio, camera, collision, particles, and level loading.
- `src/game/data/levels/level1.ts` is the editable data-driven stage definition.
- `tests/unit` covers pure player physics, scoring, saving, level validation, editor command stacks, schema migration, advanced editor tools, and local persistence guards.
- `tests/e2e` contains the Playwright browser smoke test.

## Game Systems

Player movement uses acceleration, separate walk/run speed caps, ground and air drag, coyote time, jump buffering, variable jump height, wall cling, wall jump, one double jump, stronger falling gravity, knockback, and invulnerability after damage. Enemies can be stomped from above or damage the player from the side. Falling below the stage returns Sprout to the latest checkpoint while health remains available.

Rune boxes release a Growth Bud when hit from below. Collecting a Growth Bud doubles Sprout's height. The score system awards points for Light Seed Shards, defeated enemies, Breeze Orb or Growth Bud collection, and fast level clears. Best score is stored in `localStorage` under the `sky-sprout-runner.best-score` key.

## Editing The Level

Story content can still be edited in `src/game/data/levels/level1.ts`, but custom stages can now be made in the browser with **Sky Forge Editor**.

Open the app, choose **Create Level**, and use the palette to place original Sky Sprout Runner objects on the grid. Choose **My Levels** to reopen, play, duplicate, export, import, or delete saved custom levels.

### Sky Forge Editor

- **Palette:** Terrain, Platforms, Items, Enemies, Hazards, Utilities, and Decorations.
- **Layers:** show, hide, lock, unlock, and set the active layer for Terrain, Platforms, Items, Enemies, Hazards, Utilities, and Decorations.
- **Placement:** choose an object, then click the Phaser editor canvas.
- **Selection:** use Select mode, then click an object. Drag selected objects to move them.
- **Properties:** edit position, size, visibility, lock state, notes, speed, moving-platform paths, and patrol-style values from the right panel.
- **Path Tool:** select a Moving Breeze Platform, switch to Path mode, and click the canvas to add waypoints. The path preview line shows loop or ping-pong routing, and waypoint coordinates can be edited in the inspector.
- **Multi-select Inspector:** select multiple objects with Shift-click, then apply common visible/locked changes, align edges, distribute spacing, duplicate, delete, or drag as a group.
- **Mini Map:** the lower-right preview shows the full level, visible objects, and the current viewport. Click it to jump the editor camera.
- **Templates:** Level Settings can replace the current level with Empty Island, Starter Plains, Floating Challenge, Enemy Practice, or Speed Run Strip.
- **Difficulty Estimator:** the side panel estimates easy, normal, hard, or experimental from enemy count, hazard count, jump gaps, checkpoint spacing, and level length.
- **Undo/Redo:** toolbar buttons or `Ctrl/Cmd+Z` and `Ctrl/Cmd+Y`.
- **Save/Load:** levels, compact generated thumbnails, and best custom-level play records are saved to `localStorage` under `sky-sprout-runner:custom-levels:*`.
- **Import/Export:** JSON files use the Sky Forge schema and include `schemaVersion`.
- **Test Play:** the editor deep-clones the current level and starts `LevelScene`; press `Escape` to return with the editor state still open.
- **Validation:** the panel reports missing spawn/finish, duplicate ids, out-of-bounds objects, weak moving-platform paths, hazards near spawn, and summary info.
- **Mobile:** the palette collapses into a lower drawer, with floating Copy/Delete/Save/Test actions.

Keyboard shortcuts: `V` Select, `B` Brush, `E` Erase, `R` Rectangle, `H` Pan, `P` Path, `T` Test, `G` Grid, `S` Snap, `Delete` remove, `Ctrl/Cmd+S` save, `Ctrl/Cmd+D` duplicate.

The editor follows the project creative rules: no external images, sounds, fonts, or famous platform-game assets. All editor objects use cloud-island, wind, sprout, and light-seed names and generated rendering.

### LevelData Schema

Custom levels use plain JSON data in `src/game/data/LevelData.ts`:

- `world`: tile size, dimensions, theme, and background variant
- `playerSpawn` and `finishGate`: one each for playable levels
- `terrain`, `platforms`, `collectibles`, `powerUps`, `enemies`, `hazards`, `checkpoints`, `decorations`
- `metadata`: difficulty, tags, and estimated time

The runtime adapter converts this schema to the existing `LevelLoader` format so story levels and custom levels use the same play scene. To add a new custom object, add its type in `LevelData.ts`, add a palette entry in `src/editor/data/objectCatalog.ts`, render it in `EditorScene`, and map it in `toRuntimeLevelData` if it should affect gameplay.

`localStorage` is browser-local, size-limited, and not shared across devices. Export JSON before clearing browser data or moving levels between browsers.

### Story Level Source

The built-in stage is made from plain TypeScript data:

- `terrain`: solid rectangles, including grass, stone, cloud, sky brick, and rune box blocks
- `movingPlatforms`: platform rectangles with `from`, `to`, and `speed`
- `collectibles`: Light Seed Shards
- `powerUps`: Breeze Orbs with duration
- `enemies`: Drift Bug, Puff Hopper, and Wind Wisp definitions
- `hazards`: Thorn Crystal rectangles
- `checkpoints`: Glow Lantern positions
- `finishGate`: Wind Gate position

Run `npm run test` after editing level data. The validation test checks for unique ids and basic stage route requirements.

## Build And Deploy

```bash
npm run build
```

Deploy the generated `dist` folder to any static hosting provider. No environment variables are required.

## Future Improvements

- Add more stages and biome-specific hazards.
- Replace placeholder generated textures with a larger original art pass.
- Add settings for sound volume and input remapping.
- Add a collectible route timer and optional challenge medals.

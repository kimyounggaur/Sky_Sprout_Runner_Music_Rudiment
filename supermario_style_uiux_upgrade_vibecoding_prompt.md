# Sky Sprout Runner UI/UX 현대화용 바이브코딩 프롬프트

> 목적: `https://kimyounggaur.github.io/Supermario_Copy-Codex-/` 웹앱을 최신 2D 플랫폼 게임 수준의 밝고 촉각적인 UI/UX로 발전시키기 위한 Codex용 실행 프롬프트입니다.  
> 중요한 제약: 최신 슈퍼마리오 게임의 **사용성 원칙, 명확한 피드백, 즐거운 모션, 친절한 접근성**은 참고하되, Nintendo/Super Mario의 캐릭터, 로고, 명칭, 그래픽, 음악, 사운드, UI 화면 구성을 복제하지 않습니다.

---

## 사용법

아래의 **마스터 프롬프트 전체**를 Codex에 붙여넣고 실행하세요.  
Codex가 구현을 시작하기 전에 현재 레포 구조와 기존 기능을 다시 확인하도록 되어 있습니다.

---

# Codex 마스터 프롬프트

너는 지금부터 최고 수준의 시니어 프론트엔드 엔지니어, Phaser 게임 UI 엔지니어, 게임 UX 디자이너, 인터랙션 디자이너, 접근성 QA 엔지니어, Playwright 테스트 엔지니어 역할을 동시에 수행한다.

현재 레포는 Vite + React + TypeScript + Phaser 3 기반의 오리지널 웹 플랫폼 게임이다. 현재 사용자-facing 게임명은 `Sky Sprout Runner`이며, 브라우저에서 실행되는 2D 횡스크롤 플랫폼 게임과 커스텀 레벨 에디터가 포함되어 있다.

이번 목표는 기존 기능을 유지하면서 전체 UI/UX를 최신 2D 플랫폼 게임처럼 밝고, 반응성 있고, 촉각적이고, 친절하고, 완성도 높은 데모 수준으로 업그레이드하는 것이다.

단, 절대 특정 상용 게임을 복제하지 않는다. 최신 Super Mario 계열 게임에서 배울 수 있는 것은 다음과 같은 **추상적 UX 원칙**뿐이다.

- 큰 버튼과 명확한 선택 상태
- 둥근 카드, 선명한 아이콘, 강한 실루엣
- 즉각적인 음향/모션 피드백
- 쉬운 난이도 선택과 초보자 보조 기능
- 수집/클리어/기록/도전 목표의 명확한 시각화
- 레벨 에디터에서 빠른 배치, 빠른 테스트, 빠른 수정
- 모바일/터치 조작에서도 동일하게 이해되는 UI
- 과도한 텍스트보다 아이콘+짧은 문구 중심의 안내
- 놀라움과 축하감이 있는 클리어 연출

이 프로젝트는 반드시 오리지널이어야 한다.

---

## 절대 금지 사항

다음 사항은 코드, UI, README, 파일명, 변수명, 테스트명, 에셋명 어디에도 추가하지 마라.

1. `Mario`, `Luigi`, `Peach`, `Bowser`, `Goomba`, `Koopa`, `Nintendo`, `Super Mario`, `Mario Maker`, `Mushroom Kingdom` 등의 명칭.
2. 빨간 모자 배관공, 초록 배관공, 공주, 거북이 적, 굼바형 적, 버섯 파워업, 파이어 플라워, 스타 코인, 물음표 블록, 초록 파이프, 마리오식 벽돌 블록 등 식별 가능한 시각 요소.
3. 업로드된 이미지나 외부 이미지 에셋 사용. 특히 다음과 비슷한 파일이 프로젝트에 있거나 추가되어 있으면 사용하지 말고 제거하거나 오리지널 placeholder로 교체하라.
   - `Mario_29.webp`
   - `파이프.png`
   - `벽돌.png`
   - `퀘스천박스.png`
   - `Super_Mushroom_NSMB.webp`
   - `Star_Coin.webp`
   - `MK8_Fire_Flower.webp`
   - `super mario components*.jpg`
4. 기존 상용 게임의 UI 레이아웃을 픽셀 단위로 따라 하는 것.
5. 외부 폰트, 외부 음악, 외부 효과음, 외부 스프라이트, 외부 아이콘 라이브러리 추가.
6. README나 UI에 “마리오풍”, “마리오 메이커풍”, “Nintendo-like” 같은 문구를 제품 표현으로 노출하는 것.

허용되는 것은 오직 오리지널 `Sky Sprout Runner` 세계관에 맞는 새싹, 구름섬, 바람, 빛의 씨앗, 꽃가루, 하늘길, 바람문, 랜턴, 요정/정령 분위기의 그래픽과 UI이다.

---

## 현재 프로젝트에 대한 전제

작업을 시작하기 전에 실제 레포를 다시 확인하라. 다음 전제가 맞는지 검증하고, 다르면 실제 코드 기준으로 계획을 조정하라.

현재 예상 구조:

- `package.json`에는 `dev`, `build`, `test`, `test:e2e`, `lint`, `format` 스크립트가 있다.
- 앱은 React `App.tsx`에서 `menu`, `story`, `editor`, `levels` 같은 모드를 관리한다.
- 메인 메뉴에는 `Play Story`, `Create Level`, `My Levels`, `Controls`, `Credits`가 있다.
- `EditorRoot`와 `EditorShell` 기반의 레벨 에디터가 있다.
- 현재 에디터 UI 이름은 `Sky Forge Editor`로 보일 수 있다.
- 현재 CSS는 `src/styles/global.css`에 대부분 들어 있으며, 단순한 그라디언트, 직사각형 버튼, 패널형 레이아웃 중심이다.
- 현재 Phaser HUD는 `HP`, `Seeds`, `Score`, `Time`, `Checkpoint`, `Breeze active` 같은 텍스트 중심이다.
- 현재 게임 메뉴 Scene은 Phaser 텍스트와 사각형 버튼 중심이다.
- 현재 README는 이 프로젝트가 오리지널이고 외부 저작권 에셋을 사용하지 않는다고 설명한다.

이 전제는 출발점일 뿐이다. 실제 파일을 확인한 뒤 구현하라.

---

## 전체 방향

UI/UX의 목표 이름은 **Bloom Pop UI Pass**로 한다.  
사용자-facing 에디터 명칭은 기존 `Sky Forge Editor`를 유지해도 되지만, 가능하면 더 친근한 **Sprout Studio**로 리브랜딩하라. 단, 저장 데이터 호환성은 유지하라.

전체 톤:

- 밝고 선명한 하늘색, 잎사귀 초록, 햇살 노랑, 산호색 포인트
- 둥근 카드와 말랑한 버튼
- 두꺼운 stroke, 부드러운 drop shadow, 살짝 튀는 hover/press 애니메이션
- UI가 게임 월드의 일부처럼 느껴지는 “스티커/장난감/보드게임” 감각
- 초보자에게 친절하지만 숙련자에게도 빠른 메뉴 이동 제공
- 모든 중요한 액션에 시각+청각 피드백 제공
- 모바일과 데스크톱 모두에서 손가락/마우스로 누르기 쉬운 hit target

구현 원칙:

- React는 메뉴, 오버레이, 레벨 선택, 결과 화면, 설정, 에디터 패널 같은 UI를 담당한다.
- Phaser는 게임 월드, 인게임 물리, 파티클, 게임 카메라, 플레이어 입력을 담당한다.
- HUD는 가능하면 React overlay로 현대화하되, 기존 Phaser HUD 이벤트 구조와 테스트 호환성을 유지한다.
- 외부 UI 라이브러리 없이 순수 CSS와 React 컴포넌트로 구현한다.
- 모든 아이콘은 CSS, inline SVG, Canvas/Phaser generated texture, 또는 텍스트 심볼을 기반으로 직접 만든다.
- `prefers-reduced-motion`를 존중한다.
- 키보드, 마우스, 터치, 게임패드 확장 가능성을 고려한다.

---

## UX 리서치에서 반영할 추상 원칙

최신 2D 플랫폼 게임 UX에서 반영할 포인트를 오리지널 방식으로 재해석하라.

### 1. “놀라움”을 UI에도 반영

게임 내 `Breeze Orb`, `Light Seed`, `Wind Gate`, `Glow Lantern` 같은 세계관 요소를 UI에서도 사용한다.

예:

- 메인 메뉴 배경에 떠다니는 구름, 빛 씨앗, 바람 리본
- 버튼 hover 시 작은 씨앗 파티클
- 스테이지 클리어 시 `Bloom Burst` 축하 연출
- 새 기록 달성 시 `New Best!` 배지
- 에디터에서 테스트 플레이를 시작할 때 “바람문으로 입장”하는 transition

### 2. “배지/능력 선택” UX를 오리지널로 추가

상용 게임의 배지 시스템을 복제하지 말고, Sky Sprout 세계관에 맞춘 **Sprout Charms** 시스템을 메뉴/UI로 추가하라.

초기 MVP에서는 실제 게임플레이 능력에 깊게 연결하지 않아도 된다. 우선 UI/UX 레이어로 구현하라.

예시 Sprout Charms:

- `Feather Drift`: 공중 조작 설명 카드
- `Seed Magnet`: 수집 아이템 안내 카드
- `Safe Step`: 초보자 추천 카드
- `Swift Breeze`: 타임어택 추천 카드

요구사항:

- 메인 메뉴 또는 레벨 시작 전 `Charm 선택 패널`을 추가한다.
- 현재는 선택 저장과 HUD 표시만 구현해도 된다.
- 이후 실제 플레이어 능력에 연결할 수 있게 타입과 저장 구조를 준비한다.
- 모든 명칭과 아이콘은 오리지널이어야 한다.

### 3. “초보자 친화” UX

다음 기능을 추가한다.

- 첫 방문 온보딩 카드
- 조작법을 짧게 보여주는 `Controls Toast`
- 쉬움/보통/도전 난이도 설명
- 실패 후 “체크포인트에서 다시 시작”, “에디터로 돌아가기”, “조작법 보기” 선택
- 말하는 꽃을 복제하지 말고, 오리지널 `Guide Sprout` 텍스트 힌트 시스템 구현
- 설정에서 힌트 표시 끄기 가능

### 4. “빠른 제작과 테스트” UX

레벨 에디터를 현대화한다.

- 팔레트를 더 시각적으로 만든다.
- 현재 선택 도구가 명확히 보이게 한다.
- `Test` 버튼은 항상 눈에 띄는 CTA로 둔다.
- `Save`, `Undo`, `Redo`, `Validate`는 아이콘+라벨 조합으로 개선한다.
- 에디터의 validation 결과를 친절한 문장으로 바꾼다.
- 에디터에서 플레이 테스트 후 돌아오면 마지막 카메라/선택/도구 상태를 유지한다.

---

## 디자인 시스템 요구사항

새 파일을 만들거나 기존 CSS를 정리해서 디자인 토큰을 도입하라.

권장 파일:

```text
src/ui/
  design/
    tokens.css
    motion.css
    icons.tsx
  components/
    BloomButton.tsx
    BloomCard.tsx
    BloomPanel.tsx
    BloomBadge.tsx
    IconChip.tsx
    StatPill.tsx
    ToastStack.tsx
    ModalFrame.tsx
    ProgressRing.tsx
  screens/
    HomeScreen.tsx
    LevelSelectScreen.tsx
    ResultsScreen.tsx
    SettingsScreen.tsx
    CharmSelectScreen.tsx
  hud/
    HudOverlay.tsx
    TouchControlOverlay.tsx
  state/
    uiStore.ts
    preferences.ts
```

기존 구조를 크게 깨지 않는 선에서 조정하라. 반드시 위 구조를 그대로 따를 필요는 없지만, UI 관련 코드가 무작위로 흩어지지 않게 정리하라.

### CSS 토큰

다음과 유사한 토큰을 정의하라.

```css
:root {
  --ui-sky-100: #dff8ff;
  --ui-sky-300: #7ed8ff;
  --ui-sky-600: #2399d6;
  --ui-leaf-100: #eaffc8;
  --ui-leaf-400: #68d65d;
  --ui-leaf-700: #218a3f;
  --ui-sun-200: #fff1a8;
  --ui-sun-400: #ffd84d;
  --ui-coral-400: #ff6f6f;
  --ui-berry-500: #a35cff;
  --ui-ink-900: #10313a;
  --ui-cream: #fffaf0;

  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 34px;
  --radius-pill: 999px;

  --shadow-pop: 0 7px 0 rgba(13, 57, 67, 0.18), 0 18px 36px rgba(13, 57, 67, 0.18);
  --shadow-soft: 0 10px 28px rgba(13, 57, 67, 0.16);
  --stroke-soft: 2px solid rgba(16, 49, 58, 0.14);

  --motion-fast: 120ms;
  --motion-normal: 220ms;
  --motion-slow: 420ms;
  --ease-pop: cubic-bezier(.2, 1.4, .32, 1);
}
```

토큰은 실제 구현에 맞게 조정해도 된다.

### 버튼 UX

`BloomButton` 컴포넌트를 만든다.

요구사항:

- variant: `primary`, `secondary`, `ghost`, `danger`, `editor`, `play`
- size: `sm`, `md`, `lg`, `xl`
- icon slot
- loading/disabled 상태
- keyboard focus ring
- hover 시 살짝 위로 뜨는 효과
- active 시 눌리는 효과
- 터치 기기에서는 hover 효과에 의존하지 않음
- `aria-label` 지원
- 외부 SVG 라이브러리 사용 금지

### 카드 UX

`BloomCard` 컴포넌트를 만든다.

요구사항:

- rounded card
- optional icon/thumbnail
- selected 상태
- locked/disabled 상태
- new/clear/best 배지
- level select, charm select, settings, editor palette에 재사용

### 아이콘

아이콘은 직접 구현한다.

가능한 방식:

- 작은 inline SVG 컴포넌트
- CSS shape
- 텍스트 심볼
- Phaser generated texture

필수 아이콘:

- leaf heart / health
- light seed / collectible
- wind swirl / power
- lantern / checkpoint
- gate / finish
- play triangle
- pause
- settings gear
- undo
- redo
- save
- validate
- brush
- erase
- select cursor
- warning
- info
- trophy
- timer

---

## 화면별 개선 요구사항

## Phase A. 메인 메뉴를 Home Hub로 개선

현재 단순 중앙 버튼 메뉴를 **Home Hub**로 개선하라.

구성:

1. 상단: 게임 로고 텍스트 `Sky Sprout Runner`
2. 부제: `A breezy cloud-island platformer`
3. 중앙: Sprout 캐릭터 또는 오리지널 새싹 심볼의 generated illustration
4. 주요 CTA 카드:
   - `Story Adventure`
   - `Sprout Studio`
   - `My Levels`
5. 보조 버튼:
   - `Controls`
   - `Settings`
   - `Credits`
6. 우측 또는 하단: 최근 기록 카드
   - Best Score
   - Last Clear Time
   - Created Levels Count
7. 첫 방문이면 조작법/목표를 알려주는 짧은 onboarding card

시각 요구:

- 배경은 하늘 그라디언트 + 떠다니는 구름 + 바람 리본 + 빛 씨앗 파티클
- CTA 카드는 크고 둥글며 선택 시 pop 애니메이션
- `Story Adventure`는 가장 큰 버튼으로 보이게 한다.
- `Sprout Studio`는 창작 도구 느낌이 나도록 브러시/격자 아이콘을 표시한다.
- `My Levels`는 폴더/지도 카드 느낌으로 표시한다.

구현 요구:

- React 컴포넌트 기반으로 구현하라.
- 기존 `App.tsx`의 mode 전환과 호환되게 한다.
- 기존 `LandingPanel`의 접근성 헤더는 유지하거나 개선한다.
- `data-testid`를 추가한다.
  - `home-screen`
  - `home-story-button`
  - `home-studio-button`
  - `home-levels-button`
  - `home-settings-button`

---

## Phase B. 레벨 선택 화면 개선

Story Mode 진입 전 또는 Story Mode 내부 메뉴를 개선한다.

구성:

- World Map 느낌의 레벨 선택 화면
- 레벨 카드 4개 이상
- 각 카드에 다음 표시:
  - 레벨 이름
  - 난이도
  - 수집률
  - 최고 점수
  - 클리어 여부
  - 추천 Charm
- 선택된 레벨 preview panel
- `Play Level` CTA
- `Back` 버튼

오리지널 레벨 이름 예시:

- `Wind Island Ascent`
- `Lantern Cloudway`
- `Starlit Gust Bridge`
- `Ancient Gate Trial`

주의:

- 기존 유명 게임의 월드맵을 복제하지 마라.
- 단순 경로형 dotted line, 구름섬 카드, 랜턴 노드 등 오리지널 표현을 사용하라.

---

## Phase C. HUD를 현대화

현재 HUD가 텍스트 중심이면, 이를 아이콘 중심의 readable HUD로 개선하라.

필수 표시:

- Health: 잎 하트 3개 또는 sprout heart 3개
- Seeds: 현재/전체 Light Seed Shard
- Score + Best
- Time
- Checkpoint label
- Active power/charm slot
- 모바일에서는 버튼과 겹치지 않음

UX 요구:

- 수집 시 seed counter가 살짝 튀고 반짝임
- 피격 시 health chip이 흔들리되 과하지 않게
- 체크포인트 도달 시 오른쪽 상단 toast
- power-up 활성화 시 작은 progress ring 또는 countdown bar
- 클리어 직전에는 finish guide toast 가능

구현 방식:

- 가능하면 React `HudOverlay`로 구현하고 Phaser의 HUD 이벤트를 구독한다.
- 기존 `HudScene`을 완전히 제거하기보다, 테스트와 fallback을 위해 유지하거나 얇은 event bridge로 전환한다.
- `publishHudState` 또는 기존 debug state가 있으면 테스트 호환성을 유지한다.
- HUD overlay가 Phaser canvas pointer input을 방해하지 않도록 `pointer-events`를 세밀하게 설정한다.

테스트:

- E2E에서 HUD seed/health/score element가 표시되는지 확인한다.
- `data-testid`:
  - `hud-overlay`
  - `hud-health`
  - `hud-seeds`
  - `hud-score`
  - `hud-time`
  - `hud-power`

---

## Phase D. Pause / Game Over / Level Complete 개선

### Pause Menu

구성:

- 반투명 배경 blur
- 큰 제목 `Paused`
- 버튼:
  - Resume
  - Restart from Checkpoint
  - Controls
  - Settings
  - Quit to Home
- 현재 레벨명/시간/수집률 표시
- 모바일에서도 누르기 쉬운 버튼 크기

### Game Over / Retry

구성:

- 원인에 따른 메시지:
  - 낙사
  - 체력 0
  - 위험물 피격
- 버튼:
  - Retry from Checkpoint
  - Restart Level
  - Open Controls
  - Back to Home
- 초보자용 힌트:
  - “점프 버튼을 짧게 누르면 낮게, 길게 누르면 높게 점프합니다.”
  - “Shift를 누르면 더 멀리 뛸 수 있습니다.”

### Level Complete

구성:

- `Bloom Clear!` 또는 `Wind Gate Opened!`
- 점수
- 최고 점수 갱신 여부
- 클리어 시간
- 수집률
- 피격 횟수 또는 retry 횟수
- medal:
  - Sprout
  - Breeze
  - Radiant
- 버튼:
  - Next Level
  - Replay
  - Level Select
  - Back to Home
  - Edit Copy in Sprout Studio

연출:

- seed confetti
- soft screen flash
- 짧은 오리지널 WebAudio fanfare
- reduced motion 설정에서는 confetti 수와 motion 축소

---

## Phase E. Settings / Accessibility 추가

설정 패널을 추가한다.

필수 설정:

- Master volume
- Sound effects volume
- Music volume 또는 ambience volume
- Reduced motion
- Screen shake on/off
- Show guide tips on/off
- High contrast UI on/off
- Touch controls always visible on/off
- Input help overlay on/off
- Reset save data

저장:

- localStorage key: `sky-sprout-runner:ui-preferences`
- parse 실패 시 안전하게 기본값 복구
- 개인정보/외부 서버 없음

접근성:

- 버튼 focus ring 명확하게
- `aria-label`, `aria-live` 적용
- 모달은 focus trap 또는 최소한 Esc 닫기 지원
- 키보드만으로 모든 메뉴 이동 가능
- 색상만으로 상태를 구분하지 말고 아이콘/텍스트 병행
- 최소 터치 타겟 44px 이상
- `prefers-reduced-motion` 대응
- 고대비 모드에서 텍스트 명확히 표시

---

## Phase F. Sprout Charms UI 추가

레벨 시작 전 `Sprout Charms` 선택 UI를 추가한다.

초기 구현 목표:

- 사용자에게 4개 charm 카드 표시
- 하나 선택 가능
- 선택 상태 localStorage 저장
- HUD에 선택 charm 표시
- README에 향후 실제 능력 연결 방법 설명

Charm 예시:

1. `Feather Drift`
   - 설명: “공중 제어를 연습하기 좋은 추천 charm.”
   - 아이콘: 바람 깃털
2. `Seed Magnet`
   - 설명: “수집 루트를 찾는 플레이어에게 추천.”
   - 아이콘: 빛 씨앗 주변 원형 오라
3. `Safe Step`
   - 설명: “처음 플레이하는 사람에게 추천.”
   - 아이콘: 잎 방패
4. `Swift Breeze`
   - 설명: “빠른 클리어 도전을 위한 charm.”
   - 아이콘: 바람 화살

주의:

- 실제 능력 조정은 MVP에서는 선택 사항이다.
- 실제 능력에 연결한다면 `physicsConfig`를 너무 많이 망가뜨리지 말고 multiplier 방식으로 작게 적용하라.
- Charm 적용 여부를 테스트로 검증한다.

---

## Phase G. 에디터 UI/UX 개선

현재 에디터가 패널 중심이라면, 이를 더 사용하기 쉬운 창작 도구처럼 개선한다.

### 에디터 리브랜딩

- UI 표시명: `Sprout Studio`
- 기존 저장 데이터와 클래스명은 필요하면 유지해도 되지만 사용자-facing 텍스트는 통일한다.
- README에도 `Sprout Studio`로 설명한다.
- 기존 `Sky Forge` 명칭은 마이그레이션 메모로만 남기거나 제거한다.

### 에디터 레이아웃

데스크톱:

- 상단: 둥근 toolbar
- 왼쪽: 시각적 palette dock
- 중앙: 캔버스
- 오른쪽: properties inspector
- 하단: status bar + validation drawer
- 우하단: 큰 `Test Play` floating button

모바일:

- 상단 compact toolbar
- 하단 bottom sheet palette
- 우하단 floating action cluster
- 속성 패널은 bottom sheet
- 캔버스 위 UI가 너무 많이 가리지 않게 한다.

### 팔레트 개선

현재 swatch만 있으면, 다음을 추가하라.

- category pill tabs
- 검색
- 즐겨찾기
- 최근 사용
- 아이콘 preview
- item 설명 tooltip 또는 details panel
- 선택된 item을 큰 preview로 표시

카테고리:

- Terrain
- Platforms
- Items
- Enemies
- Hazards
- Utilities
- Decorations

기존 object catalog를 유지하되 UI 표현을 강화한다.

### 도구 표시

도구 버튼:

- Select
- Brush
- Erase
- Rectangle
- Pan
- Path
- Validate
- Test

요구:

- 현재 도구가 강하게 표시되어야 한다.
- 단축키 label을 작게 표시한다.
- tooltip을 제공한다.
- keyboard focus와 touch press 모두 지원한다.

### Validation UX

현재 technical message가 있다면 사용자 친화 문장으로 바꿔라.

예:

- Before: `Missing finish gate`
- After: `Wind Gate가 없습니다. 플레이어가 스테이지를 끝낼 수 없어요.`

Validation panel 요구:

- error/warning/info 필터
- 문제 클릭 시 해당 위치로 이동
- 위치가 있는 문제는 canvas marker 표시
- 치명적 error가 있으면 Test Play 전에 확인 모달 표시
- warning만 있으면 “그래도 테스트” 가능

### Playtest UX

- `Test Play` 클릭 시 현재 에디터 상태 snapshot 생성
- transition overlay: `Opening Wind Gate...`
- test play 중에는 우상단 `Back to Studio` 버튼 표시
- 플레이 완료 시 `Return to Studio` 버튼 표시
- 돌아오면 선택/도구/카메라/validation 상태 보존

---

## Phase H. 터치 조작 UI 개선

게임 플레이 터치 UI:

- 왼쪽 하단: 좌/우 movement pad
- 오른쪽 하단: Jump 큰 버튼
- Jump 옆: Run 작은 버튼
- 상단 오른쪽: Pause
- touch 영역은 시각보다 hitbox가 약간 넓어야 한다.
- HUD와 겹치면 안 된다.
- 가로/세로 viewport 모두 고려한다.

에디터 터치 UI:

- 탭으로 선택/배치
- 드래그로 paint
- 두 손가락으로 pan
- pinch zoom 가능하면 구현
- 길게 누르면 context menu
- 모바일 최소 기능:
  - tile 배치
  - object 선택
  - 삭제
  - 저장
  - 테스트 플레이

---

## Phase I. 사운드/모션 피드백

외부 사운드 사용 금지. WebAudio 또는 Phaser sound generated beep만 사용한다.

필수 UI 사운드:

- button hover 또는 focus: 아주 작고 짧은 tick
- button press: pop
- menu open: soft sweep
- modal close: soft tap
- save: sparkle
- validation error: gentle bump
- level complete: 짧은 fanfare
- new best: high sparkle

볼륨 설정과 연동하라.

모션:

- button press scale 0.97 → 1
- card hover translateY(-3px)
- modal enter pop
- toast slide/fade
- result medal bounce
- HUD counter bump
- seed particle float

`prefers-reduced-motion` 또는 settings reduced motion이 켜져 있으면 다음을 적용하라.

- transform scale/translate 최소화
- confetti 수 감소
- screen shake 비활성화
- 반복 animation 중지

---

## Phase J. 기술 아키텍처

### React와 Phaser 통신

UI 상태는 React store에서 관리하되, 게임 상태는 Phaser에서 이벤트로 전달한다.

권장:

```text
src/ui/state/uiStore.ts
src/ui/state/gameUiBridge.ts
src/game/utils/debugState.ts 또는 events.ts 확장
```

이벤트 예시:

```ts
type GameUiEvent =
  | { type: 'hud:update'; payload: HudPayload }
  | { type: 'game:paused' }
  | { type: 'game:resumed' }
  | { type: 'level:complete'; payload: LevelCompletePayload }
  | { type: 'toast'; payload: ToastPayload }
  | { type: 'settings:changed'; payload: UiPreferences };
```

주의:

- 매 프레임 React state를 갱신하지 마라.
- HUD 숫자가 변할 때만 갱신하라.
- pointer events가 게임 입력을 막지 않게 UI layer별로 `pointer-events`를 제어하라.
- Phaser scene destroy 시 이벤트 리스너를 반드시 해제하라.

### 파일 분리

권장 변경/추가 파일:

```text
src/ui/design/tokens.css
src/ui/design/motion.css
src/ui/design/icons.tsx
src/ui/components/BloomButton.tsx
src/ui/components/BloomCard.tsx
src/ui/components/BloomPanel.tsx
src/ui/components/BloomBadge.tsx
src/ui/components/StatPill.tsx
src/ui/components/ToastStack.tsx
src/ui/components/ModalFrame.tsx
src/ui/screens/HomeScreen.tsx
src/ui/screens/LevelSelectScreen.tsx
src/ui/screens/SettingsScreen.tsx
src/ui/screens/CharmSelectScreen.tsx
src/ui/screens/ResultsScreen.tsx
src/ui/hud/HudOverlay.tsx
src/ui/hud/TouchControlOverlay.tsx
src/ui/state/preferences.ts
src/ui/state/uiStore.ts
src/ui/state/gameUiBridge.ts
src/game/systems/UiAudioSystem.ts
src/game/systems/UiFeedbackSystem.ts
src/editor/components/StudioToolbar.tsx
src/editor/components/StudioPalettePanel.tsx
src/editor/components/StudioValidationDrawer.tsx
src/editor/components/StudioFloatingActions.tsx
```

기존 컴포넌트를 수정해도 되지만, UI 공통 컴포넌트가 재사용 가능하게 설계하라.

---

# 단계별 구현 계획

## Phase 0. 현재 상태 감사

1. `package.json` 확인
2. `src/App.tsx` 확인
3. `src/styles/global.css` 확인
4. `src/components` 확인
5. `src/game/scenes/MenuScene.ts`, `HudScene.ts`, `PauseScene.ts`, `GameOverScene.ts`, `LevelCompleteScene.ts` 확인
6. `src/editor` 전체 구조 확인
7. `README.md` 확인
8. `tests/e2e` 확인
9. public 또는 src에 금지 에셋/명칭이 있는지 확인
10. 현재 앱을 실행하거나 Playwright로 smoke screenshot을 찍어 before 상태를 기록

감사 결과를 짧게 정리한 뒤 구현을 시작하라.

---

## Phase 1. 디자인 토큰과 공통 UI 컴포넌트

1. `tokens.css`, `motion.css` 추가
2. 기존 `global.css`에서 중복되는 색/spacing을 토큰 기반으로 정리
3. `BloomButton` 구현
4. `BloomCard` 구현
5. `BloomPanel` 구현
6. `BloomBadge` 구현
7. `StatPill` 구현
8. `ModalFrame` 구현
9. `ToastStack` 구현
10. 직접 만든 inline SVG 아이콘 세트 구현
11. Storybook은 추가하지 말고, 실제 화면에 바로 통합

테스트:

- TypeScript build 통과
- 버튼 focus/disabled/aria 속성 확인

---

## Phase 2. Home Hub 구현

1. 기존 `main-menu` JSX를 `HomeScreen`으로 분리
2. `Play Story`, `Create Level`, `My Levels`를 카드형 CTA로 개선
3. `Settings` 메뉴 추가
4. 최근 기록 카드 추가
5. 첫 방문 onboarding card 추가
6. 배경 구름/씨앗/바람 리본 CSS animation 추가
7. `prefers-reduced-motion` 대응
8. `data-testid` 추가
9. 기존 Controls/Credits modal은 `ModalFrame`으로 교체
10. 모바일 layout 최적화

테스트:

- `editor-smoke` 또는 `game-smoke`가 깨지지 않게 button text/testid 보강
- `home-story-button`, `home-studio-button`, `home-levels-button` 확인

---

## Phase 3. Settings와 Preferences

1. `UiPreferences` 타입 작성
2. localStorage safe parse/write 작성
3. settings screen/modal 작성
4. volume sliders 작성
5. reduced motion, high contrast, guide tips, screen shake 토글 작성
6. CSS에 high contrast class 적용
7. WebAudio/UI audio가 preference를 읽도록 준비
8. reset save data는 confirm 후 실행
9. README에 설정 설명 추가

테스트:

- preferences unit test 작성
- localStorage parse 실패 시 기본값 복구 테스트

---

## Phase 4. HUD Overlay 현대화

1. 기존 HudScene 이벤트 구조 파악
2. `HudOverlay` React 컴포넌트 구현
3. health/seed/score/time/checkpoint/power/charm 표시
4. 변화 감지 시 counter bump animation
5. checkpoint/power/toast 연동
6. Phaser HUD text가 중복으로 보이면 숨기거나 fallback만 유지
7. mobile safe area 적용
8. `data-testid` 추가
9. E2E 상태 확인용 DOM text 유지

테스트:

- game smoke에서 HUD overlay 보임 확인
- seed/health/score DOM 존재 확인
- mobile viewport에서 터치 버튼과 HUD 충돌 없음 확인

---

## Phase 5. Charm Select UX

1. `SproutCharm` 타입 작성
2. charm catalog 작성
3. `CharmSelectScreen` 또는 level start modal 구현
4. 선택한 charm localStorage 저장
5. HUD에 charm 표시
6. 추후 gameplay 적용 가능한 hook 작성
7. README에 Charm 구조 설명

테스트:

- charm 선택/저장 unit test
- E2E에서 charm 선택 후 story 시작 가능 확인

---

## Phase 6. Level Select 현대화

1. Story level selector를 React screen 또는 Phaser menu 개선으로 교체
2. 레벨 카드, 난이도, 수집률, 최고 기록 표시
3. 선택 preview panel 구현
4. locked/coming soon 상태 표시
5. `Play Level` CTA 구현
6. localStorage 기록과 연결
7. 사용자 제작 레벨 목록과 시각 언어 통일

테스트:

- Level 1 시작 가능
- custom level play flow 유지
- 기존 GameCanvas skipMenu 동작 유지

---

## Phase 7. Pause / GameOver / Complete 화면 개선

1. 기존 Phaser Scene UI 확인
2. 가능하면 React overlay modal로 통합하거나 Phaser scene UI를 같은 design token 느낌으로 재작성
3. Pause menu 개선
4. GameOver retry UI 개선
5. LevelComplete 결과 화면 개선
6. 결과 통계를 계산해 표시
7. New Best animation 구현
8. Back/Home/Replay/Next/Edit Copy 버튼 연결
9. Toast/fanfare 연결

테스트:

- pause key/button 동작
- gameover retry 동작
- level complete event가 localStorage 기록 저장
- `Back to Studio` flow 유지

---

## Phase 8. Sprout Studio 에디터 UI 개선

1. 사용자-facing 텍스트를 `Sprout Studio`로 정리
2. 기존 `EditorToolbar`를 `StudioToolbar` 또는 개선된 toolbar로 교체
3. palette panel을 카드/아이콘 중심으로 개선
4. tool 상태 표시 강화
5. validation drawer 개선
6. floating `Test Play` 버튼 추가
7. `Save` 상태를 명확히 표시
8. properties panel을 더 읽기 쉬운 section/card 구조로 개선
9. mini-map을 더 선명하게 조정
10. mobile bottom sheet 또는 compact layout 개선

테스트:

- editor smoke 통과
- save/load 통과
- test play 통과
- tool shortcut이 input focus 중 오작동하지 않게 확인

---

## Phase 9. UI 사운드와 피드백 시스템

1. `UiAudioSystem` 작성
2. WebAudio generated sound 구현
3. settings volume과 연동
4. button press/focus/save/error/complete/new best 사운드 연결
5. `UiFeedbackSystem` 또는 toast event 작성
6. 반복 사운드 spam 방지 throttle 적용
7. reduced motion과 screen shake 설정 반영

테스트:

- 음소거/볼륨 0에서 소리 재생 시도해도 에러 없음
- user gesture 전 AudioContext 문제가 콘솔 에러를 만들지 않음

---

## Phase 10. 모바일 최적화

1. 360x740, 390x844, 768x1024 viewport 기준 점검
2. Home Hub 카드 배치 개선
3. HUD safe area 조정
4. touch controls hitbox 확대
5. pause/settings modal mobile full-screen sheet 적용
6. editor palette bottom sheet 적용
7. test play overlay mobile 위치 조정
8. landscape mobile에서 HUD와 controls 충돌 방지

테스트:

- Playwright mobile viewport smoke 추가
- 주요 버튼 44px 이상인지 점검

---

## Phase 11. 접근성/국제화 준비

1. aria-label 누락 보완
2. aria-live toast 적용
3. focus trap 또는 focus restore 구현
4. Esc 닫기 통일
5. Tab 순서 점검
6. 색상 대비 확인
7. 텍스트가 너무 작지 않게 조정
8. 한국어/영어 UI 문자열을 한 곳에 모으는 준비를 한다. 실제 i18n 라이브러리는 추가하지 않아도 된다.

---

## Phase 12. 테스트 보강

Vitest 추가/수정:

- `uiPreferences.test.ts`
- `charmSelection.test.ts`
- `uiStore.test.ts`
- 기존 editor/history/storage/validation 테스트 유지

Playwright 추가/수정:

- `home-ui.spec.ts`
  - home screen 표시
  - story/studio/levels/settings 버튼 표시
  - settings 열고 닫기
- `hud-ui.spec.ts`
  - story start 후 HUD overlay 표시
  - pause overlay 표시
- `editor-ui.spec.ts`
  - Sprout Studio 진입
  - palette 표시
  - Test Play floating button 표시
- `mobile-ui.spec.ts`
  - 모바일 viewport에서 home CTA와 touch controls 표시

테스트 작성 원칙:

- pixel-perfect 스냅샷 테스트는 피한다.
- `data-testid`, aria role, visible text 중심으로 검증한다.
- canvas 내부 픽셀보다 React overlay 상태를 검증한다.
- localStorage는 테스트 시작마다 초기화한다.

---

## Phase 13. 문서화

README를 업데이트하라.

추가할 내용:

1. Bloom Pop UI Pass 요약
2. Home Hub 설명
3. Sprout Studio 설명
4. HUD와 touch controls 설명
5. Settings와 accessibility 설명
6. Sprout Charms 설명
7. 저장 데이터 key 설명
8. 테스트 방법
9. 오리지널 에셋/명칭 원칙 재명시
10. 금지 에셋을 사용하지 않는다는 점 명시

README에 상용 게임명이나 공식 캐릭터명을 비교/홍보 문구로 넣지 마라.

---

## Phase 14. 최종 감사

다음을 반드시 실행하라.

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

실패하면 직접 원인을 찾아 수정하라.

추가 감사:

```bash
grep -RniE "Mario|Luigi|Peach|Bowser|Goomba|Koopa|Nintendo|Super Mario|Mario Maker|Mushroom Kingdom|Question Block|Fire Flower" src public README.md || true
```

위 grep 결과에 사용자-facing 금지 명칭이 나오면 제거하라. 단, 외부 URL이나 레포 이름처럼 코드 내부에서 바꿀 수 없는 문맥은 제품 UI에 노출되지 않게만 처리하라.

또 다음을 확인하라.

- 브라우저 콘솔 오류 없음
- React key warning 없음
- Phaser scene destroy 시 listener leak 없음
- modal focus restore 동작
- localStorage parse 실패 대응
- mobile layout overflow 없음
- reduced motion 설정 반영
- 모든 이미지는 code-generated 또는 CSS/SVG 기반 오리지널

---

# 수용 기준

다음 조건을 모두 만족해야 완료다.

## 기능 기준

1. Home Hub가 기존 main menu를 대체하거나 명확히 개선한다.
2. Story Adventure 시작 가능.
3. Sprout Studio 진입 가능.
4. My Levels 진입 가능.
5. Settings 열기/저장 가능.
6. Controls/Credits 확인 가능.
7. HUD가 아이콘 중심으로 개선됨.
8. Pause/GameOver/Complete UI가 새 디자인 시스템과 일관됨.
9. 모바일 touch controls가 HUD와 겹치지 않음.
10. Sprout Charms 선택/저장/표시 가능.
11. 레벨 선택 화면이 카드/월드맵 느낌으로 개선됨.
12. Sprout Studio toolbar/palette/validation/test play UX가 개선됨.
13. Test Play 후 에디터 복귀 가능.
14. localStorage 데이터 손상 시 앱이 죽지 않음.
15. 모든 주요 UI에 keyboard focus가 보임.

## 품질 기준

1. `npm run lint` 성공.
2. `npm run test` 성공.
3. `npm run build` 성공.
4. `npm run test:e2e` 성공. 환경 문제일 경우 원인과 해결 방법을 명확히 문서화.
5. TypeScript strict 기준에서 타입 오류 없음.
6. 외부 에셋/폰트/사운드 추가 없음.
7. Nintendo/Super Mario 관련 명칭과 에셋 없음.
8. 기존 게임 플레이와 에디터 기능이 깨지지 않음.
9. README와 실제 동작이 일치함.
10. 모바일에서 주요 기능 사용 가능.

## UX 기준

1. 첫 화면에서 사용자가 무엇을 할 수 있는지 3초 안에 이해 가능.
2. 주요 CTA는 명확하게 구분됨.
3. hover/focus/press 상태가 모두 보임.
4. 실패/성공/저장/검증 결과 피드백이 즉각적임.
5. 에디터에서 “선택한 도구”와 “선택한 오브젝트”가 명확함.
6. 클리어 화면이 보상감 있게 느껴짐.
7. 모션이 과하지 않고 reduced motion에서 줄어듦.
8. 텍스트가 너무 작거나 대비가 낮지 않음.

---

# 구현 중 주의할 점

- 한 번에 거대한 리팩터링을 하지 말고, 단계별로 작동 가능한 상태를 유지하라.
- React overlay가 Phaser canvas 입력을 막지 않도록 주의하라.
- UI sound는 사용자 gesture 이전에 AudioContext를 강제로 시작하지 마라.
- `window.confirm` 사용은 최소화하고 가능하면 `ModalFrame`으로 대체하라.
- editor keydown handler는 input/textarea/select focus 중 Delete, Backspace, Ctrl+S 등이 오작동하지 않도록 처리하라.
- E2E는 canvas 픽셀 검증보다 DOM overlay/testid 검증 중심으로 안정화하라.
- 모바일 CSS는 마지막에 대충 덧붙이지 말고 처음부터 responsive grid를 고려하라.
- 저장 데이터 마이그레이션이 필요하면 기존 사용자 level이 사라지지 않게 하라.
- 기존 기능을 지우지 말고, UI shell을 현대화하는 방향으로 진행하라.

---

# 최종 응답 형식

작업 완료 후 다음 형식으로 보고하라.

```text
## 변경 요약
- ...

## 주요 UI/UX 개선
- ...

## 수정/추가 파일
- ...

## 테스트 결과
- npm run lint: pass/fail
- npm run test: pass/fail
- npm run build: pass/fail
- npm run test:e2e: pass/fail

## 저작권/상표권 감사 결과
- 금지 명칭/에셋 사용 여부
- 외부 에셋 사용 여부

## 남은 리스크와 다음 개선 제안
- ...
```

---

# 후속 폴리싱 프롬프트

MVP가 완성된 뒤 다음 프롬프트를 이어서 사용하라.

```text
방금 구현한 Bloom Pop UI Pass를 실제 데모 공개 수준으로 폴리싱하라.

집중 항목:
1. Home Hub 첫인상
2. 버튼 hover/focus/press 감각
3. HUD 가독성
4. Pause/GameOver/Complete 보상감
5. Sprout Studio 팔레트 사용성
6. 모바일 layout
7. reduced motion/accessibility
8. E2E 안정성
9. README 정확성
10. 저작권/상표권 리스크

해야 할 일:
- Playwright로 데스크톱과 모바일 viewport 스크린샷을 찍어 시각적 문제를 찾는다.
- 버튼/카드의 spacing, shadow, radius, font size를 튜닝한다.
- HUD가 게임 플레이를 가리지 않는지 확인한다.
- 에디터에서 Test Play 버튼이 항상 찾기 쉬운지 확인한다.
- settings와 preferences가 실제로 반영되는지 확인한다.
- 모든 모달의 focus/escape 동작을 확인한다.
- `prefers-reduced-motion`과 앱 내부 reduced motion 설정을 모두 확인한다.
- 금지 명칭과 에셋 grep 감사를 다시 실행한다.

마지막에 다음을 실행하라.

npm run lint
npm run test
npm run build
npm run test:e2e

실패하면 직접 수정하라.
```

---

# 최종 코드리뷰 프롬프트

```text
이 프로젝트의 UI/UX 현대화 결과를 출시 전 코드리뷰 관점에서 매우 엄격하게 감사하라.

검토 항목:
1. 저작권/상표권 리스크
2. 외부 에셋/폰트/사운드 사용 여부
3. React와 Phaser lifecycle 충돌
4. UI overlay가 게임 입력을 막는 문제
5. localStorage preferences/schema 손상 대응
6. 모달 focus trap/focus restore
7. reduced motion 동작
8. 모바일 터치 UX
9. E2E 테스트 안정성
10. README와 실제 기능 불일치
11. TypeScript 타입 안정성
12. browser console warning/error
13. scene destroy 시 이벤트 리스너 누수
14. 성능: 매 프레임 React state 갱신 여부
15. 접근성: aria-label, focus ring, contrast

문제를 발견하면 직접 수정하라.
모든 수정 후 다음을 실행하라.

npm run lint
npm run test
npm run build
npm run test:e2e

마지막에 출시 가능 여부를 명확히 판정하라.
```

# 적용 방법과 규격

이 문서는 **후속 통합용**입니다. 이번 작업은 원본 파일을 변경하지 않았습니다. 적용 전에 별도 브랜치나 작업 공간에서 기존 키·충돌 크기·타이밍을 유지한 상태로 비교하세요.

## 로딩 경로

`assets/`를 후속 게임 프로젝트의 `public/art/sky-sprout-v1/`로 복사할 수 있습니다. `src/game/scenes/PreloadScene.ts` 또는 기존 텍스처 등록 단계에서 읽습니다. 원본 `src/render/textureDefinitions.ts`, `TextureFactory.ts`, `phaserTextures.ts`가 프로시저럴 텍스처를 만드는 구조이므로 같은 키를 두 번 등록하지 마세요. 별도의 `art-*` 키로 등록해 적용 범위를 명확히 합니다.

```ts
this.load.spritesheet('art-sprout', '/art/sky-sprout-v1/raster/sprout-keyposes-strip.png', {
  frameWidth: 256, frameHeight: 256
});
this.load.image('art-meadow', '/art/sky-sprout-v1/raster/platform-meadow.png');
this.load.image('art-seed', '/art/sky-sprout-v1/raster/light-seed.png');
this.load.image('art-sky', '/art/sky-sprout-v1/raster/background-sky.png');
this.load.image('art-islands', '/art/sky-sprout-v1/raster/background-islands.png');
```

## 캐릭터와 물리

원본 게임의 `PLAYER.width=30`, `PLAYER.height=42`, 게임 논리 해상도 960×540을 확인했습니다. 그림 크기를 키우는 것과 충돌 판정을 키우는 것은 다른 작업입니다. 우선 기존 물리 바디를 유지하고 표시 전용 스프라이트를 따라가게 하세요. 발 위치를 월드 좌표에 맞추고 PNG 투명 여백을 충돌로 쓰지 않습니다.

표시용 스프라이트 예시: `setOrigin(0.5, 244/256)` 후 `setDisplaySize(72,72)`. 발 월드 좌표를 기준으로 배치합니다. 프레임별 잎 높이와 몸 크기에 작은 생성 편차가 있으므로 빠른 사이클을 확대 재생해 추가 정렬이 필요한지 확인하세요. 기존 `sprout-wall`, `sprout-hurt`, `sprout-crouch`는 이 패키지에 없으며 기존 텍스처를 유지하거나 후속 제작해야 합니다.

| 프레임 | 파일 | 타이밍 / 용도 |
|---|---|---|
| 0 | sprout-idle | 정지, 1.4초 주기로 1~2% 호흡 변형 가능 |
| 1, 2 | sprout-run-a / run-b | 140ms씩 반복하는 두 키포즈 검증용. 완성된 달리기 루프 아님 |
| 3 | sprout-jump | 상승 시작부터 정점 전까지 |
| 4 | sprout-fall | 하강, 낙하 속도에 맞춰 0~5° 회전 가능 |
| 5 | sprout-land | 착지 직후 90~170ms, 이후 idle/run |

연속 플레이의 매끄러운 달리기를 위해서는 양쪽 발 교차를 포함한 6~8개의 중간 프레임과 일관된 발 기준 보정이 필요합니다. `ANIMATION.json`은 키포즈와 UI 타이밍 계약이며 완성된 게임 애니메이션 파일은 아닙니다.

## 지형·패럴랙스

- 풀섬: 원본 960×448. 표시 비율 2.14:1을 유지하세요. 가장 윗꽃이 아니라 평평한 잔디 면을 충돌 상단으로 씁니다. 실제 그림의 잔디 선을 기준으로 얇은 별도 정적 바디를 배치합니다.
- 구름: 512×288. 원본 비율 유지. 이동 플랫폼 스크립트와 텍스처를 분리합니다.
- 블록: 256×256. 표시 크기 48~72px 권장. 완전한 타일맵 가장자리/코너 세트는 아닙니다. 투명 패딩을 감안해 모듈 사이 간격을 맞추세요.
- 하늘: 1536×1024. 먼 레이어 스크롤 계수 0.06, 중경 섬 0.22 권장. 미리보기는 약한 가로 이동만 구현합니다.
- 배경은 무한 seamless 반복을 검증하지 않았습니다. 대표 장면에는 cover/crop, 긴 레벨에는 장면 전환·별도 연결 배경을 사용하세요.

## 수집물·적

256×256 PNG는 표시 크기 32~56px로 사용합니다. 밝은 씨앗은 32px에서도 형태가 식별되지만 실제 모바일 화면에선 20px 이하가 되지 않게 하세요. 장애물은 별도의 원형/다각형 바디, 씨앗은 관대한 원형 수집 영역, 적은 발과 몸 중심 바디를 사용하세요. 기존 레벨의 난이도를 바꾸지 않도록 기존 바디를 먼저 유지합니다.

## UI와 접근성

SVG의 버튼 바탕에는 텍스트가 없습니다. 번역·숫자·포커스·상태는 DOM에서 처리합니다. `button-primary.svg`와 `button-secondary.svg`의 9-slice inset은 30px, `hud-pill.svg`는 40px가 시작점입니다. 현재 미리보기는 같은 팔레트를 CSS로 구현해 가변 폭을 지원합니다.

SVG 아이콘 48×48은 24~32 CSS px, 터치 컨테이너는 최소 44×44px로 표시합니다. 텍스트를 포함한 버튼에는 aria-label 또는 실제 텍스트를 제공하세요. 아이콘만 바뀌는 버튼은 상태 변경 시 accessible name도 갱신해야 합니다. 포커스를 가두는 모달과 일시정지 시 게임 입력 해제는 후속 정식 통합에서 구현하세요.

## 검수 범위

프리뷰의 점프는 680ms 예시 곡선이며 원본 물리를 대체하지 않습니다. 수집은 효과 확인 버튼으로 실행되며 충돌 판정이 없습니다. 게임 진행·저장·오디오·네트워크·점수의 진위는 이번 프로토타입의 범위가 아닙니다. 점프·달리기와 적/발판의 정식 물리는 원본 시스템에 연결해 검증해야 합니다.

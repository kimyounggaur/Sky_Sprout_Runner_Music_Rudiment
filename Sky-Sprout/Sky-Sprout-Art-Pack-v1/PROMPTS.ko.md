# 생성 사양과 이력

내장 이미지 생성 도구를 사용했습니다. GPT 아스트라 실행 여부와 이미지 생성 내부 모델명은 확인되지 않았습니다. CLI/API 방식으로 바꾸지 않았습니다. 생성 응답의 실제 PNG 바이트를 이 Windows 작업 폴더에 저장했고, Sharp로 시트 영역 분리·비율 유지 리사이즈·투명 패딩·스트립 조립을 수행했습니다. 알파 채널을 보존했으며 색상키 제거는 사용하지 않았습니다. SVG UI는 직접 작성했습니다.

## 캐릭터 — 최종 사양

1536×1024 transparent PNG, 3 columns × 2 rows. Same original Sky Sprout Runner character: lime/emerald pear-shaped body, two broad leaves on one short stem, dark teal oval eyes with white highlights, small smile, two dark green rounded feet, tiny expressive green arms. No clothing, hat or scarf. Premium tactile softly shaded 3D game sprite, upper-left yellow-green light, cool emerald lower-right occlusion, clean silhouette readable at 48px. Row 1: idle, running right A, running right B. Row 2: jump rising, fall with lifted leaves, celebratory landing squash. Equal scale, no background, no text/grid, generous clear gutters.

수정 프롬프트: “Edit ONLY the green sprout character six-pose sheet; preserve the same identity, colors, lighting and six-cell layout. Upper right run pose must use the opposite leg stride from upper middle; lower-left jumping character must have exactly two leaves, never three. Keep idle, falling and celebration poses visually unchanged. All six characters fully inside their cells with 35px clear gutters. Genuinely transparent alpha, no labels, ground or shadows.”

선택본은 `sprout-fixed-generated.png`입니다. 교차 보행이 완전히 해결된 연속 사이클은 아니므로 2개 달리기 이미지를 키포즈로 분류했습니다. 정식 연속 애니메이션에는 중간 프레임 보완이 필요합니다.

## 지형

1536×1024 transparent environment atlas. Top left: wide floating grass island, flat bright lime moss top, honey sandstone layered rounded rock sides, hanging emerald roots and small pink flowers at edges. Top right: small pillowy white/pale-blue cloud platform, horizontal landing surface, scalloped bottom. Bottom left: square grass-topped sandstone block. Bottom right: amber rune block with glowing leaf rune, rounded chamfers. Side-scrolling front camera with slight top visible, upper-left warm light and teal shadow, tactile 3D platformer finish, isolated modules, no background/text/characters/branded symbols.

## 수집물·적·장애물

1536×1024 transparent PNG, 3×2 grid. Row 1: radiant gold almond-shaped light seed with etched leaf vein; coral-pink drift bug with rounded shell, feet, oval eyes and small angry brows; cobalt/violet thorn pod with six ivory spikes and orange core. Row 2: turquoise breeze orb with white swirl; green leaves holding peach glowing growth bud; cream/teal checkpoint lantern with gold light and leaf roof. Consistent upper-left sunlight, clean silhouettes readable at 32–48px, clear transparent gutters, no text or external shadows.

## 먼 하늘

Wide 1536×1024 opaque sky plate. Luminous cerulean to turquoise sky, enormous ivory sculpted clouds on lower third and perimeter, warm sunlight upper left, distant muted cyan/periwinkle floating islands at horizon. Central and upper-middle 65% uncluttered for gameplay. Premium soft 3D/painted environment finish, level side camera, no close foreground platforms, characters, HUD or text.

## 중경 섬

1536×1024 transparent layer. Three separate floating garden islands across lower half at different heights: small left, medium center, tall right. Rounded jade/aqua leaf canopies, pale turquoise tapering crags, ivory clouds around roots, pale paths. Lower saturation and contrast than the lime protagonist. Upper-left sunlight, slight top visible, full silhouettes within margins, decorative background rather than walkable terrain. No buildings, characters or text.

생성 원본은 `sources/`에 포함했습니다. 미리보기는 실제 개별 파일을 읽으며 생성된 장면 한 장을 덮어씌운 방식이 아닙니다.

import type { LevelData, TerrainDef } from '../../types';

type FloatingBlockKind = Extract<TerrainDef['kind'], 'skyBrick' | 'runeBox'>;

const floatingBlockSize = 44;

function floatingBlockCluster(
  id: string,
  startX: number,
  y: number,
  pattern: FloatingBlockKind[]
): TerrainDef[] {
  return pattern.map((kind, index) => ({
    id: `${id}-${index + 1}`,
    kind,
    x: startX + index * floatingBlockSize,
    y,
    width: floatingBlockSize,
    height: floatingBlockSize
  }));
}

const floatingBlocks: TerrainDef[] = [
  ...floatingBlockCluster('tutorial-floating-block', 930, 390, [
    'skyBrick',
    'runeBox',
    'skyBrick'
  ]),
  ...floatingBlockCluster('seed-floating-block', 1695, 315, [
    'skyBrick',
    'skyBrick',
    'runeBox',
    'skyBrick'
  ]),
  ...floatingBlockCluster('patrol-floating-block', 2460, 445, [
    'skyBrick',
    'runeBox',
    'skyBrick',
    'runeBox',
    'skyBrick'
  ]),
  ...floatingBlockCluster('checkpoint-floating-block', 3815, 390, [
    'skyBrick',
    'runeBox',
    'skyBrick'
  ]),
  ...floatingBlockCluster('final-floating-block', 4560, 375, [
    'skyBrick',
    'skyBrick',
    'runeBox',
    'skyBrick'
  ])
];

export const level1: LevelData = {
  id: 'level-1-wind-island',
  name: 'Wind Island Ascent',
  world: {
    width: 5400,
    height: 720,
    fallY: 760,
    timeLimitSeconds: 240
  },
  start: { x: 120, y: 548 },
  terrain: [
    { id: 'grass-01', kind: 'grass', x: 340, y: 660, width: 680, height: 96 },
    { id: 'step-01', kind: 'cloud', x: 810, y: 590, width: 220, height: 34 },
    { id: 'step-02', kind: 'cloud', x: 1090, y: 525, width: 230, height: 34 },
    { id: 'grass-02', kind: 'grass', x: 1510, y: 660, width: 760, height: 96 },
    { id: 'collect-ledge-01', kind: 'stone', x: 1580, y: 510, width: 220, height: 34 },
    { id: 'collect-ledge-02', kind: 'cloud', x: 1880, y: 450, width: 210, height: 34 },
    { id: 'grass-03', kind: 'grass', x: 2390, y: 660, width: 640, height: 96 },
    { id: 'enemy-ledge-01', kind: 'stone', x: 2260, y: 520, width: 260, height: 34 },
    { id: 'gap-step-01', kind: 'cloud', x: 2750, y: 570, width: 230, height: 34 },
    { id: 'grass-04', kind: 'grass', x: 3330, y: 660, width: 700, height: 96 },
    { id: 'hazard-safe-ledge', kind: 'cloud', x: 3210, y: 515, width: 180, height: 34 },
    { id: 'checkpoint-ground', kind: 'grass', x: 3900, y: 660, width: 420, height: 96 },
    { id: 'power-ledge', kind: 'stone', x: 4020, y: 515, width: 240, height: 34 },
    { id: 'final-platform-01', kind: 'cloud', x: 4400, y: 570, width: 220, height: 34 },
    { id: 'final-platform-02', kind: 'cloud', x: 4690, y: 500, width: 220, height: 34 },
    { id: 'finish-ground', kind: 'grass', x: 5110, y: 660, width: 580, height: 96 },
    ...floatingBlocks
  ],
  movingPlatforms: [
    {
      id: 'breeze-lift-01',
      x: 2990,
      y: 520,
      width: 170,
      height: 28,
      from: { x: 2920, y: 520 },
      to: { x: 3180, y: 475 },
      speed: 88
    },
    {
      id: 'breeze-lift-02',
      x: 3560,
      y: 515,
      width: 170,
      height: 28,
      from: { x: 3480, y: 515 },
      to: { x: 3740, y: 515 },
      speed: 95
    }
  ],
  collectibles: [
    { id: 'seed-01', x: 400, y: 585 },
    { id: 'seed-02', x: 820, y: 535 },
    { id: 'seed-03', x: 1090, y: 470 },
    { id: 'seed-04', x: 1540, y: 455 },
    { id: 'seed-05', x: 1620, y: 455 },
    { id: 'seed-06', x: 1880, y: 395 },
    { id: 'seed-07', x: 2290, y: 465 },
    { id: 'seed-08', x: 2520, y: 585 },
    { id: 'seed-09', x: 2990, y: 455 },
    { id: 'seed-10', x: 3210, y: 460 },
    { id: 'seed-11', x: 4015, y: 460 },
    { id: 'seed-12', x: 4685, y: 445 },
    { id: 'seed-13', x: 5000, y: 585 },
    { id: 'seed-14', x: 5200, y: 585 }
  ],
  powerUps: [{ id: 'breeze-orb-01', x: 4100, y: 455, durationMs: 9000 }],
  enemies: [
    { id: 'drift-bug-01', kind: 'driftBug', x: 2060, y: 600, patrolDistance: 190, speed: 65 },
    { id: 'puff-hopper-01', kind: 'puffHopper', x: 2360, y: 455, patrolDistance: 120, speed: 44 },
    { id: 'wind-wisp-01', kind: 'windWisp', x: 3330, y: 455, patrolDistance: 120, speed: 45 },
    { id: 'drift-bug-02', kind: 'driftBug', x: 4880, y: 600, patrolDistance: 170, speed: 70 }
  ],
  hazards: [
    { id: 'thorn-01', kind: 'thornCrystal', x: 3450, y: 620, width: 80, height: 46 },
    { id: 'thorn-02', kind: 'thornCrystal', x: 3615, y: 620, width: 90, height: 46 }
  ],
  checkpoints: [{ id: 'glow-lantern-01', label: 'Glow Lantern', x: 3880, y: 590 }],
  finishGate: { id: 'wind-gate-01', x: 5240, y: 570 }
};

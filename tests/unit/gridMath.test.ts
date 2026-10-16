import { describe, expect, it } from 'vitest';
import {
  clampToLevelBounds,
  pixelToTile,
  screenToWorld,
  snapToGrid,
  tileToPixel
} from '../../src/editor/utils/gridMath';

describe('editor grid math', () => {
  it('converts between pixel and tile coordinates', () => {
    expect(pixelToTile({ x: 95, y: 64 }, 32)).toEqual({ x: 2, y: 2 });
    expect(tileToPixel({ x: 4, y: 3 }, 32)).toEqual({ x: 128, y: 96 });
  });

  it('snaps arbitrary positions to the nearest grid point', () => {
    expect(snapToGrid({ x: 47, y: 81 }, 32)).toEqual({ x: 32, y: 96 });
  });

  it('clamps positions to level bounds', () => {
    expect(clampToLevelBounds({ x: -20, y: 900 }, { width: 640, height: 360 })).toEqual({
      x: 0,
      y: 360
    });
  });

  it('maps screen coordinates through camera pan and zoom', () => {
    expect(screenToWorld({ x: 320, y: 160 }, { x: 120, y: 40, zoom: 2 })).toEqual({
      x: 280,
      y: 120
    });
  });
});

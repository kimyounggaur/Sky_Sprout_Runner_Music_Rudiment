import type { Point } from '../../game/types';

export interface CameraView {
  x: number;
  y: number;
  zoom: number;
}

export function pixelToTile(point: Point, tileSize: number): Point {
  return {
    x: Math.floor(point.x / tileSize),
    y: Math.floor(point.y / tileSize)
  };
}

export function tileToPixel(point: Point, tileSize: number): Point {
  return {
    x: point.x * tileSize,
    y: point.y * tileSize
  };
}

export function snapToGrid(point: Point, tileSize: number): Point {
  return {
    x: Math.round(point.x / tileSize) * tileSize,
    y: Math.round(point.y / tileSize) * tileSize
  };
}

export function clampToLevelBounds(point: Point, bounds: { width: number; height: number }): Point {
  return {
    x: Math.min(Math.max(point.x, 0), bounds.width),
    y: Math.min(Math.max(point.y, 0), bounds.height)
  };
}

export function screenToWorld(point: Point, camera: CameraView): Point {
  return {
    x: point.x / camera.zoom + camera.x,
    y: point.y / camera.zoom + camera.y
  };
}

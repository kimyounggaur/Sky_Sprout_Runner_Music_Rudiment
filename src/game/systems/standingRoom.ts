export interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function hasStandingRoom(standingBounds: Bounds, obstacles: Bounds[]): boolean {
  return obstacles.every((obstacle) => {
    const horizontalOverlap =
      Math.min(standingBounds.right, obstacle.right) -
      Math.max(standingBounds.left, obstacle.left);
    const verticalOverlap =
      Math.min(standingBounds.bottom, obstacle.bottom) -
      Math.max(standingBounds.top, obstacle.top);

    return horizontalOverlap <= 0 || verticalOverlap <= 0;
  });
}

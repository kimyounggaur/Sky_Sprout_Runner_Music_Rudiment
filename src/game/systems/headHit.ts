interface VerticalContactBody {
  left: number;
  right: number;
  top: number;
  blocked: { up: boolean };
  touching: { up: boolean };
  deltaY(): number;
}

interface BlockBody {
  left: number;
  right: number;
  bottom: number;
}

export function didHitBlockFromBelow(playerBody: VerticalContactBody, blockBody: BlockBody): boolean {
  const verticalDelta = playerBody.deltaY();
  const previousTop = playerBody.top - verticalDelta;
  const horizontalOverlap =
    Math.min(playerBody.right, blockBody.right) - Math.max(playerBody.left, blockBody.left);
  const requiredOverlap = Math.min(12, (playerBody.right - playerBody.left) * 0.45);

  return (
    verticalDelta < -0.1 &&
    (playerBody.blocked.up || playerBody.touching.up) &&
    previousTop >= blockBody.bottom - 2 &&
    playerBody.top <= blockBody.bottom + 6 &&
    horizontalOverlap >= requiredOverlap
  );
}

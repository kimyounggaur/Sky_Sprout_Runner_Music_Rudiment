import { Player } from '../entities/Player';
import { BaseEnemy } from '../entities/BaseEnemy';
import { getArcadeBody } from '../utils/assertions';
import { overlapsRange } from '../utils/math';

export class CollisionSystem {
  static isStomp(player: Player, enemy: BaseEnemy): boolean {
    const playerBody = getArcadeBody(player);
    const enemyBody = getArcadeBody(enemy);
    const horizontallyOverlapping = overlapsRange(
      playerBody.left,
      playerBody.right,
      enemyBody.left + 3,
      enemyBody.right - 3
    );

    return (
      horizontallyOverlapping &&
      playerBody.velocity.y > 70 &&
      playerBody.bottom <= enemyBody.top + 16
    );
  }

  static knockbackDirection(player: Player, sourceX: number): -1 | 1 {
    return player.x < sourceX ? -1 : 1;
  }
}

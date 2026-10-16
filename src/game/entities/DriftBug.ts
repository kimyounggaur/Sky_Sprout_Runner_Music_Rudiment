import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import { getArcadeBody } from '../utils/assertions';

export class DriftBug extends BaseEnemy {
  private direction: -1 | 1 = -1;
  private readonly homeX: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly patrolDistance = 160,
    private readonly speed = 65
  ) {
    super(scene, x, y, 'drift-bug');
    this.homeX = x;
    const body = getArcadeBody(this);
    body.setSize(28, 20);
    body.setOffset(2, 8);
    body.setVelocityX(-this.speed);
  }

  updateEnemy(time: number): void {
    if (this.defeated) {
      return;
    }

    const body = getArcadeBody(this);

    if (this.x < this.homeX - this.patrolDistance / 2 || body.blocked.left) {
      this.direction = 1;
    } else if (this.x > this.homeX + this.patrolDistance / 2 || body.blocked.right) {
      this.direction = -1;
    }

    body.setVelocityX(this.direction * this.speed);
    this.setFlipX(this.direction > 0);
    this.setScale(1, 1 + Math.sin(time / 140) * 0.04);
  }
}

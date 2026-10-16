import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import { getArcadeBody } from '../utils/assertions';

export class PuffHopper extends BaseEnemy {
  private direction: -1 | 1 = 1;
  private readonly homeX: number;
  private nextHopAt = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly patrolDistance = 120,
    private readonly speed = 42
  ) {
    super(scene, x, y, 'puff-hopper');
    this.homeX = x;
    const body = getArcadeBody(this);
    body.setSize(28, 24);
    body.setOffset(2, 6);
    this.nextHopAt = scene.time.now + 700;
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
    this.setFlipX(this.direction < 0);

    if ((body.blocked.down || body.touching.down) && time >= this.nextHopAt) {
      body.setVelocityY(-330);
      this.nextHopAt = time + 1250;
    }

    this.setScale(1 + Math.sin(time / 180) * 0.05, 1 - Math.sin(time / 180) * 0.04);
  }
}

import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import { getArcadeBody } from '../utils/assertions';

export class WindWisp extends BaseEnemy {
  private readonly homeX: number;
  private readonly homeY: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly patrolDistance = 130,
    private readonly speed = 45
  ) {
    super(scene, x, y, 'wind-wisp');
    this.homeX = x;
    this.homeY = y;
    const body = getArcadeBody(this);
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(28, 28);
    body.setOffset(2, 2);
  }

  updateEnemy(time: number): void {
    if (this.defeated) {
      return;
    }

    const t = time / 1000;
    const nextX = this.homeX + Math.sin(t * (this.speed / 24)) * (this.patrolDistance / 2);
    const nextY = this.homeY + Math.sin(t * 2.6) * 34;
    this.setPosition(nextX, nextY);
    getArcadeBody(this).updateFromGameObject();
    this.setAlpha(0.82 + Math.sin(time / 130) * 0.12);
  }
}

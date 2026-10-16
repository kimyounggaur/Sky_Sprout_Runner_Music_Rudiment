import Phaser from 'phaser';
import { DEPTHS } from '../config/constants';
import type { Point } from '../types';
import { getArcadeBody } from '../utils/assertions';

export class MovingPlatform extends Phaser.Physics.Arcade.Image {
  private direction = 1;
  private segmentIndex = 0;
  private readonly path: Point[];

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    private readonly from: Point,
    private readonly to: Point,
    private readonly speed: number,
    waypoints: Point[] = [from, to],
    private readonly mode: 'loop' | 'pingPong' = 'pingPong'
  ) {
    super(scene, x, y, 'moving-platform');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(DEPTHS.terrain + 1);
    this.setDisplaySize(width, height);
    this.setImmovable(true);

    const body = getArcadeBody(this);
    body.setAllowGravity(false);
    body.setSize(width, height);
    body.setOffset(0, 0);

    this.path = waypoints.length >= 2 ? waypoints : [from, to];
  }

  updatePlatform(): void {
    const body = getArcadeBody(this);
    const target = this.path[this.segmentIndex] ?? this.to;
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const remaining = Math.hypot(dx, dy);

    if (remaining < 4) {
      this.advanceTarget();
      body.setVelocity(0, 0);
      return;
    }

    const vx = (dx / Math.max(remaining, 1)) * this.speed;
    const vy = (dy / Math.max(remaining, 1)) * this.speed;
    body.setVelocity(vx, vy);

    if (this.path.length < 2 || Phaser.Math.Distance.Between(this.from.x, this.from.y, this.to.x, this.to.y) === 0) {
      body.setVelocity(0, 0);
    }
  }

  private advanceTarget(): void {
    if (this.mode === 'loop') {
      this.segmentIndex = (this.segmentIndex + 1) % this.path.length;
      return;
    }

    if (this.segmentIndex >= this.path.length - 1) {
      this.direction = -1;
    } else if (this.segmentIndex <= 0) {
      this.direction = 1;
    }

    this.segmentIndex += this.direction;
  }
}

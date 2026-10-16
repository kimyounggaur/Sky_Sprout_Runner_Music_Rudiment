import Phaser from 'phaser';
import { DEPTHS } from '../config/constants';
import { getArcadeBody } from '../utils/assertions';

export class GrowthBud extends Phaser.Physics.Arcade.Sprite {
  private emerging = true;
  private direction: -1 | 1 = 1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'growth-bud');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(DEPTHS.pickups);
    this.setName('Growth Bud');

    const body = getArcadeBody(this);
    body.setAllowGravity(false);
    body.setEnable(false);
    body.setSize(24, 24);
    body.setOffset(4, 8);

    scene.tweens.add({
      targets: this,
      y: y - 34,
      duration: 420,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.emerging = false;
        body.setEnable(true);
        body.reset(this.x, this.y);
        body.setAllowGravity(true);
        body.setVelocityX(75);
      }
    });
  }

  updateBud(): void {
    if (this.emerging || !this.active) {
      return;
    }

    const body = getArcadeBody(this);
    if (body.blocked.left) {
      this.direction = 1;
    } else if (body.blocked.right) {
      this.direction = -1;
    }

    body.setVelocityX(this.direction * 75);
  }

  collect(): void {
    this.disableBody(true, true);
  }
}

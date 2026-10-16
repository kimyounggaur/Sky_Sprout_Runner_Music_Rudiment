import Phaser from 'phaser';
import { DEPTHS } from '../config/constants';
import { getArcadeBody } from '../utils/assertions';

export class Checkpoint extends Phaser.Physics.Arcade.Image {
  private activated = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly id: string,
    readonly label: string
  ) {
    super(scene, x, y, 'glow-lantern');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTHS.pickups);
    this.setName(id);

    const body = getArcadeBody(this);
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(36, 54);
  }

  activate(): boolean {
    if (this.activated) {
      return false;
    }

    this.activated = true;
    this.setTexture('glow-lantern-active');
    return true;
  }
}

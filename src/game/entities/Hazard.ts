import Phaser from 'phaser';
import { DEPTHS } from '../config/constants';
import { getArcadeBody } from '../utils/assertions';

export class Hazard extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y, 'thorn-crystal');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTHS.terrain + 2);
    this.setDisplaySize(width, height);

    const body = getArcadeBody(this);
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(width * 0.82, height * 0.72);
    body.setOffset(width * 0.09, height * 0.2);
  }
}

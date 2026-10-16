import Phaser from 'phaser';
import { DEPTHS } from '../config/constants';
import { getArcadeBody } from '../utils/assertions';

export abstract class BaseEnemy extends Phaser.Physics.Arcade.Sprite {
  protected defeated = false;

  protected constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(DEPTHS.enemies);
    this.setOrigin(0.5, 0.5);
    this.setCollideWorldBounds(false);
  }

  abstract updateEnemy(time: number, delta: number): void;

  defeat(): void {
    if (this.defeated) {
      return;
    }

    this.defeated = true;
    getArcadeBody(this).enable = false;
    this.setVisible(false);
    this.setActive(false);
  }

  isDefeated(): boolean {
    return this.defeated;
  }
}

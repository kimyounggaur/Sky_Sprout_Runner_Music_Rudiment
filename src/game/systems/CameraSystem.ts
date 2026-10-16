import Phaser from 'phaser';
import type { LevelData } from '../types';
import { Player } from '../entities/Player';

export class CameraSystem {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly level: LevelData
  ) {}

  follow(player: Player): void {
    const camera = this.scene.cameras.main;
    camera.setBounds(0, 0, this.level.world.width, this.level.world.height);
    camera.setDeadzone(190, 150);
    camera.setLerp(0.08, 0.1);
    camera.startFollow(player, false, 0.08, 0.1);
  }

  update(player: Player): void {
    const camera = this.scene.cameras.main;
    camera.setFollowOffset(player.facing > 0 ? -90 : 70, 32);
  }
}

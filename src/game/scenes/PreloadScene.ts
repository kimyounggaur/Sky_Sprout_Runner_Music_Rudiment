import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  create(): void {
    const launch = window.__SKY_SPROUT_LAUNCH;
    if (launch?.skipMenu || launch?.level) {
      this.scene.start('LevelScene', {
        level: launch.level,
        testPlay: launch.testPlay
      });
      return;
    }

    this.scene.start('MenuScene');
  }
}

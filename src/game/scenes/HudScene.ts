import Phaser from 'phaser';
import { DEPTHS, EVENTS } from '../config/constants';
import type { HudPayload } from '../types';
import { publishHudState } from '../utils/debugState';

export class HudScene extends Phaser.Scene {
  private healthText!: Phaser.GameObjects.Text;
  private shardText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private checkpointText!: Phaser.GameObjects.Text;
  private powerText!: Phaser.GameObjects.Text;

  constructor() {
    super('HudScene');
  }

  create(): void {
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#102c31',
      stroke: '#ffffff',
      strokeThickness: 4
    };

    this.healthText = this.add.text(18, 16, 'HP 3', textStyle).setDepth(DEPTHS.ui);
    this.shardText = this.add.text(18, 42, 'Seeds 0/0', textStyle).setDepth(DEPTHS.ui);
    this.scoreText = this.add.text(18, 68, 'Score 0', textStyle).setDepth(DEPTHS.ui);
    this.timeText = this.add
      .text(942, 16, 'Time 0', textStyle)
      .setOrigin(1, 0)
      .setDepth(DEPTHS.ui);
    this.checkpointText = this.add
      .text(942, 42, 'Checkpoint Start', textStyle)
      .setOrigin(1, 0)
      .setDepth(DEPTHS.ui);
    this.powerText = this.add
      .text(942, 68, '', textStyle)
      .setOrigin(1, 0)
      .setDepth(DEPTHS.ui);

    this.game.events.on(EVENTS.hudUpdate, this.updateHud, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(EVENTS.hudUpdate, this.updateHud, this);
    });
  }

  private updateHud(payload: HudPayload): void {
    this.healthText.setText(`HP ${payload.health}`);
    this.shardText.setText(`Seeds ${payload.shards}/${payload.totalShards}`);
    this.scoreText.setText(`Score ${payload.score}  Best ${payload.highScore}`);
    this.timeText.setText(`Time ${payload.elapsedSeconds}s`);
    this.checkpointText.setText(`Checkpoint ${payload.checkpointLabel}`);
    this.powerText.setText(payload.powerActive ? 'Breeze active' : '');
    publishHudState(payload);
  }
}

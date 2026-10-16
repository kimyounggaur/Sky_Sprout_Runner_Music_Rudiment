import Phaser from 'phaser';
import { DEPTHS, GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import type { LevelCompletePayload } from '../types';
import { publishGameState } from '../utils/debugState';

export class LevelCompleteScene extends Phaser.Scene {
  private payload: LevelCompletePayload = {
    score: 0,
    shards: 0,
    totalShards: 0,
    elapsedSeconds: 0,
    bestScore: 0
  };

  constructor() {
    super('LevelCompleteScene');
  }

  init(data: Partial<LevelCompletePayload>): void {
    this.payload = { ...this.payload, ...data };
  }

  create(): void {
    publishGameState('levelComplete');
    const collectionRate =
      this.payload.totalShards === 0
        ? 100
        : Math.round((this.payload.shards / this.payload.totalShards) * 100);

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x103845, 0.62).setOrigin(0).setDepth(DEPTHS.overlay);
    this.add
      .text(GAME_WIDTH / 2, 142, 'Wind Gate Reached', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '42px',
        color: '#f7fffb'
      })
      .setOrigin(0.5)
      .setDepth(DEPTHS.overlay + 1);
    this.add
      .text(
        GAME_WIDTH / 2,
        230,
        [
          `Score ${this.payload.score}`,
          `Seeds ${this.payload.shards}/${this.payload.totalShards} (${collectionRate}%)`,
          `Time ${this.payload.elapsedSeconds}s`,
          `Best ${this.payload.bestScore}`
        ],
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '22px',
          color: '#ffffff',
          align: 'center',
          lineSpacing: 8
        }
      )
      .setOrigin(0.5)
      .setDepth(DEPTHS.overlay + 1);

    this.createButton(380, 'Play Again', () => this.restart());
    this.createButton(445, 'Menu', () => this.backToMenu());
    this.input.keyboard?.once('keydown-ENTER', this.restart, this);
  }

  private createButton(y: number, label: string, action: () => void): void {
    const button = this.add
      .rectangle(GAME_WIDTH / 2, y, 190, 50, 0xf4fff7, 0.94)
      .setStrokeStyle(2, 0x7de0c4, 1)
      .setDepth(DEPTHS.overlay + 1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_WIDTH / 2, y, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '23px',
        color: '#123237'
      })
      .setOrigin(0.5)
      .setDepth(DEPTHS.overlay + 2)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', action);
    button.on('pointerdown', action);
  }

  private restart(): void {
    AudioManager.get().play('button');
    this.scene.stop('HudScene');
    this.scene.stop('LevelScene');
    this.scene.start('LevelScene');
  }

  private backToMenu(): void {
    AudioManager.get().play('button');
    this.scene.stop('HudScene');
    this.scene.stop('LevelScene');
    this.scene.start('MenuScene');
  }
}

import Phaser from 'phaser';
import { DEPTHS, GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import { publishGameState } from '../utils/debugState';

interface GameOverData {
  score: number;
  bestScore: number;
}

export class GameOverScene extends Phaser.Scene {
  private score = 0;
  private bestScore = 0;

  constructor() {
    super('GameOverScene');
  }

  init(data: Partial<GameOverData>): void {
    this.score = data.score ?? 0;
    this.bestScore = data.bestScore ?? 0;
  }

  create(): void {
    publishGameState('gameOver');
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x16282b, 0.72).setOrigin(0).setDepth(DEPTHS.overlay);
    this.add
      .text(GAME_WIDTH / 2, 180, 'Run Ended', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '44px',
        color: '#fff8e0'
      })
      .setOrigin(0.5)
      .setDepth(DEPTHS.overlay + 1);
    this.add
      .text(GAME_WIDTH / 2, 242, `Score ${this.score}   Best ${this.bestScore}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#ffffff'
      })
      .setOrigin(0.5)
      .setDepth(DEPTHS.overlay + 1);
    this.createButton(326, 'Try Again', () => this.restart());
    this.createButton(392, 'Menu', () => this.backToMenu());
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

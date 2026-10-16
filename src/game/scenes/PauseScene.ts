import Phaser from 'phaser';
import { DEPTHS, GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import { publishGameState } from '../utils/debugState';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create(): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0b2430, 0.45).setOrigin(0).setDepth(DEPTHS.overlay);
    this.add
      .text(GAME_WIDTH / 2, 190, 'Paused', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '46px',
        color: '#f7fffb'
      })
      .setOrigin(0.5)
      .setDepth(DEPTHS.overlay + 1);

    this.createButton(270, 'Resume', () => this.resumeLevel());
    this.createButton(340, 'Restart', () => this.restartLevel());
    this.createButton(410, 'Menu', () => this.backToMenu());

    this.input.keyboard?.on('keydown', this.handleKeyDown, this);
    window.addEventListener('keydown', this.handleWindowKeyDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', this.handleKeyDown, this);
      window.removeEventListener('keydown', this.handleWindowKeyDown);
    });
    publishGameState('paused');
  }

  private createButton(y: number, label: string, action: () => void): void {
    const button = this.add
      .rectangle(GAME_WIDTH / 2, y, 190, 50, 0xf4fff7, 0.92)
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

  private resumeLevel(): void {
    AudioManager.get().play('button');
    publishGameState('playing');
    this.scene.resume('LevelScene');
    this.scene.stop();
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.code === 'KeyP' || event.code === 'Escape') {
      this.resumeLevel();
    }
  }

  private readonly handleWindowKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'KeyP' || event.code === 'Escape') {
      this.resumeLevel();
    }
  };

  private restartLevel(): void {
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

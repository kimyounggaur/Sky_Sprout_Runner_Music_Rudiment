import Phaser from 'phaser';
import { DEPTHS } from '../config/constants';

interface TouchButton {
  root: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

export class TouchControls {
  private readonly root: Phaser.GameObjects.Container;
  private readonly buttons = new Map<string, TouchButton>();
  private leftDown = false;
  private rightDown = false;
  private jumpDown = false;
  private runDown = false;
  private jumpPressedQueued = false;
  private jumpReleasedQueued = false;
  private pausePressedQueued = false;

  constructor(private readonly scene: Phaser.Scene) {
    this.root = scene.add.container(0, 0).setDepth(DEPTHS.touch).setScrollFactor(0);

    this.createButton('left', '<', 62, 462, 74, 62, (down) => {
      this.leftDown = down;
    });
    this.createButton('right', '>', 150, 462, 74, 62, (down) => {
      this.rightDown = down;
    });
    this.createButton('jump', '^', 828, 452, 82, 72, (down) => {
      if (down && !this.jumpDown) {
        this.jumpPressedQueued = true;
      }
      if (!down && this.jumpDown) {
        this.jumpReleasedQueued = true;
      }
      this.jumpDown = down;
    });
    this.createButton('run', '>>', 728, 470, 70, 54, (down) => {
      this.runDown = down;
    });
    this.createButton('pause', 'II', 904, 46, 58, 44, (down) => {
      if (down) {
        this.pausePressedQueued = true;
      }
    });

    this.layout();
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
  }

  getLeftDown(): boolean {
    return this.leftDown;
  }

  getRightDown(): boolean {
    return this.rightDown;
  }

  getJumpDown(): boolean {
    return this.jumpDown;
  }

  getRunDown(): boolean {
    return this.runDown;
  }

  consumeJumpPressed(): boolean {
    const value = this.jumpPressedQueued;
    this.jumpPressedQueued = false;
    return value;
  }

  consumeJumpReleased(): boolean {
    const value = this.jumpReleasedQueued;
    this.jumpReleasedQueued = false;
    return value;
  }

  consumePausePressed(): boolean {
    const value = this.pausePressedQueued;
    this.pausePressedQueued = false;
    return value;
  }

  destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.root.destroy(true);
  }

  private createButton(
    id: string,
    label: string,
    x: number,
    y: number,
    width: number,
    height: number,
    setDown: (down: boolean) => void
  ): void {
    const container = this.scene.add.container(x, y);
    const background = this.scene.add
      .rectangle(0, 0, width, height, 0xffffff, 0.22)
      .setStrokeStyle(2, 0xffffff, 0.42);
    const text = this.scene.add
      .text(0, 0, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: id === 'run' ? '20px' : '26px',
        color: '#103236'
      })
      .setOrigin(0.5);

    container.add([background, text]);
    background.setInteractive({ useHandCursor: true });

    const applyVisual = (down: boolean) => {
      background.setFillStyle(down ? 0xe9fff4 : 0xffffff, down ? 0.45 : 0.22);
      background.setStrokeStyle(2, 0xffffff, down ? 0.8 : 0.42);
    };

    background.on('pointerdown', () => {
      setDown(true);
      applyVisual(true);
    });

    const release = () => {
      setDown(false);
      applyVisual(false);
    };

    background.on('pointerup', release);
    background.on('pointerout', release);
    background.on('pointerupoutside', release);

    this.root.add(container);
    this.buttons.set(id, { root: container, background, label: text });
  }

  private layout(): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    this.setButtonPosition('left', 62, height - 78);
    this.setButtonPosition('right', 150, height - 78);
    this.setButtonPosition('run', width - 232, height - 70);
    this.setButtonPosition('jump', width - 132, height - 80);
    this.setButtonPosition('pause', width - 56, 44);
  }

  private setButtonPosition(id: string, x: number, y: number): void {
    const button = this.buttons.get(id);
    if (!button) {
      return;
    }

    button.root.setPosition(x, y);
    button.label.setAlpha(0.92);
  }
}

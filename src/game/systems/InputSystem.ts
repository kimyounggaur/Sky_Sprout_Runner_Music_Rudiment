import Phaser from 'phaser';
import type { PlayerInput } from '../types';
import { TouchControls } from './TouchControls';

type KeyName =
  | 'left'
  | 'right'
  | 'down'
  | 'a'
  | 'd'
  | 'space'
  | 'w'
  | 'up'
  | 'shift'
  | 'p'
  | 'esc'
  | 'r';

const emptyInput: PlayerInput = {
  left: false,
  right: false,
  down: false,
  jumpDown: false,
  jumpPressed: false,
  jumpReleased: false,
  run: false,
  pausePressed: false,
  restartPressed: false
};

export class InputSystem {
  private readonly keys: Partial<Record<KeyName, Phaser.Input.Keyboard.Key>> = {};
  private readonly touch: TouchControls;

  constructor(private readonly scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;

    if (keyboard) {
      this.keys.left = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
      this.keys.right = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
      this.keys.down = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      this.keys.a = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keys.d = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keys.space = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.keys.w = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keys.up = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
      this.keys.shift = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
      this.keys.p = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this.keys.esc = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.keys.r = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    }

    this.touch = new TouchControls(scene);
  }

  read(): PlayerInput {
    const jumpKeys = [this.keys.space, this.keys.w, this.keys.up];
    const pauseKeys = [this.keys.p, this.keys.esc];

    return {
      ...emptyInput,
      left: this.isDown(this.keys.left, this.keys.a) || this.touch.getLeftDown(),
      right: this.isDown(this.keys.right, this.keys.d) || this.touch.getRightDown(),
      down: this.isDown(this.keys.down),
      jumpDown: this.isDown(...jumpKeys) || this.touch.getJumpDown(),
      jumpPressed: this.justDown(...jumpKeys) || this.touch.consumeJumpPressed(),
      jumpReleased: this.justUp(...jumpKeys) || this.touch.consumeJumpReleased(),
      run: Boolean(this.keys.shift?.isDown) || this.touch.getRunDown(),
      pausePressed: this.justDown(...pauseKeys) || this.touch.consumePausePressed(),
      restartPressed: this.justDown(this.keys.r)
    };
  }

  destroy(): void {
    this.touch.destroy();
  }

  clearPausePress(): void {
    this.touch.consumePausePressed();
  }

  private isDown(...keys: Array<Phaser.Input.Keyboard.Key | undefined>): boolean {
    return keys.some((key) => Boolean(key?.isDown));
  }

  private justDown(...keys: Array<Phaser.Input.Keyboard.Key | undefined>): boolean {
    return keys.some((key) => (key ? Phaser.Input.Keyboard.JustDown(key) : false));
  }

  private justUp(...keys: Array<Phaser.Input.Keyboard.Key | undefined>): boolean {
    return keys.some((key) => (key ? Phaser.Input.Keyboard.JustUp(key) : false));
  }
}

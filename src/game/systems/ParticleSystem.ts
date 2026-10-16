import Phaser from 'phaser';
import { DEPTHS } from '../config/constants';

export class ParticleSystem {
  constructor(private readonly scene: Phaser.Scene) {}

  jumpDust(x: number, y: number): void {
    this.burst(x, y + 18, 'dust-particle', 8, 260, 80);
  }

  landDust(x: number, y: number): void {
    this.burst(x, y + 20, 'dust-particle', 12, 310, 105);
  }

  collectSpark(x: number, y: number): void {
    this.burst(x, y, 'spark-particle', 12, 420, 135);
  }

  enemyBurst(x: number, y: number): void {
    this.burst(x, y, 'leaf-particle', 14, 380, 120);
  }

  private burst(
    x: number,
    y: number,
    texture: string,
    quantity: number,
    lifespan: number,
    speed: number
  ): void {
    const emitter = this.scene.add.particles(x, y, texture, {
      speed: { min: speed * 0.4, max: speed },
      angle: { min: 205, max: 335 },
      lifespan,
      quantity,
      scale: { start: 1, end: 0 },
      alpha: { start: 0.9, end: 0 },
      gravityY: 420,
      emitting: false
    });

    emitter.setDepth(DEPTHS.particles);
    emitter.explode(quantity);
    this.scene.time.delayedCall(lifespan + 80, () => emitter.destroy());
  }
}

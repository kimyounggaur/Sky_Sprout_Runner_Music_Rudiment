import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.createGeneratedTextures();
    this.scene.start('PreloadScene');
  }

  private createGeneratedTextures(): void {
    const graphics = this.add.graphics();

    this.drawSprout(graphics, 'sprout-idle', 0x4fc36e, 0);
    this.drawSprout(graphics, 'sprout-run', 0x55ca72, 4);
    this.drawSprout(graphics, 'sprout-jump', 0x66d67f, -2);
    this.drawSprout(graphics, 'sprout-fall', 0x47b969, 3);
    this.drawSprout(graphics, 'sprout-hurt', 0x98d789, 0, true);
    this.drawSprout(graphics, 'sprout-wall', 0x4fcf76, -5);
    this.drawCrouchSprout(graphics);

    this.drawTerrain(graphics, 'terrain-grass', 0x66bd63, 0x7d6b4d, 0xf4fff4);
    this.drawTerrain(graphics, 'terrain-stone', 0xa7b8bd, 0x718389, 0xe6f3f5);
    this.drawTerrain(graphics, 'terrain-cloud', 0xf7fbff, 0xc3e5f5, 0xffffff);
    this.drawSkyBrick(graphics);
    this.drawRuneBox(graphics);
    this.drawMovingPlatform(graphics);
    this.drawSeed(graphics);
    this.drawOrb(graphics);
    this.drawGrowthBud(graphics);
    this.drawDriftBug(graphics);
    this.drawPuffHopper(graphics);
    this.drawWindWisp(graphics);
    this.drawThorn(graphics);
    this.drawLantern(graphics, false);
    this.drawLantern(graphics, true);
    this.drawGate(graphics);
    this.drawParticle(graphics, 'dust-particle', 0xded3a2);
    this.drawParticle(graphics, 'spark-particle', 0xfff2a3);
    this.drawParticle(graphics, 'leaf-particle', 0x63c973);

    graphics.destroy();
  }

  private drawSprout(
    graphics: Phaser.GameObjects.Graphics,
    key: string,
    bodyColor: number,
    lean: number,
    hurt = false
  ): void {
    if (this.textures.exists(key)) {
      return;
    }

    graphics.clear();
    graphics.fillStyle(0x1d6b3a, 1);
    graphics.fillEllipse(16 + lean, 25, 24, 28);
    graphics.fillStyle(bodyColor, 1);
    graphics.fillEllipse(16 + lean, 23, 22, 26);
    graphics.lineStyle(3, 0x2d9656, 1);
    graphics.lineBetween(16 + lean, 15, 16 + lean, 5);
    graphics.fillStyle(0x65d37e, 1);
    graphics.fillTriangle(16 + lean, 8, 5 + lean, 2, 8 + lean, 15);
    graphics.fillStyle(0x45b963, 1);
    graphics.fillTriangle(16 + lean, 8, 28 + lean, 1, 24 + lean, 15);
    graphics.fillStyle(0x123b2b, 1);
    graphics.fillCircle(11 + lean, 22, 2);
    graphics.fillCircle(21 + lean, 22, 2);
    graphics.lineStyle(2, 0x123b2b, 1);
    if (hurt) {
      graphics.lineBetween(11 + lean, 31, 21 + lean, 31);
    } else {
      graphics.lineBetween(12 + lean, 30, 16 + lean, 32);
      graphics.lineBetween(16 + lean, 32, 21 + lean, 29);
    }
    graphics.fillStyle(0x2f8f4f, 1);
    graphics.fillRoundedRect(7 + lean, 36, 7, 7, 3);
    graphics.fillRoundedRect(19 + lean, 36, 7, 7, 3);
    graphics.generateTexture(key, 32, 44);
  }

  private drawCrouchSprout(graphics: Phaser.GameObjects.Graphics): void {
    if (this.textures.exists('sprout-crouch')) {
      return;
    }

    graphics.clear();
    graphics.fillStyle(0x1d6b3a, 1);
    graphics.fillEllipse(16, 31, 26, 20);
    graphics.fillStyle(0x4fc36e, 1);
    graphics.fillEllipse(16, 29, 24, 18);
    graphics.lineStyle(3, 0x2d9656, 1);
    graphics.lineBetween(16, 23, 16, 13);
    graphics.fillStyle(0x65d37e, 1);
    graphics.fillTriangle(16, 15, 5, 13, 9, 24);
    graphics.fillStyle(0x45b963, 1);
    graphics.fillTriangle(16, 15, 28, 12, 23, 24);
    graphics.fillStyle(0x123b2b, 1);
    graphics.fillCircle(11, 28, 2);
    graphics.fillCircle(21, 28, 2);
    graphics.lineStyle(2, 0x123b2b, 1);
    graphics.lineBetween(12, 35, 16, 37);
    graphics.lineBetween(16, 37, 21, 34);
    graphics.fillStyle(0x2f8f4f, 1);
    graphics.fillRoundedRect(7, 39, 7, 5, 3);
    graphics.fillRoundedRect(19, 39, 7, 5, 3);
    graphics.generateTexture('sprout-crouch', 32, 44);
  }

  private drawTerrain(
    graphics: Phaser.GameObjects.Graphics,
    key: string,
    topColor: number,
    bodyColor: number,
    highlightColor: number
  ): void {
    if (this.textures.exists(key)) {
      return;
    }

    graphics.clear();
    graphics.fillStyle(bodyColor, 1);
    graphics.fillRect(0, 8, 64, 56);
    graphics.fillStyle(topColor, 1);
    graphics.fillRoundedRect(0, 0, 64, 20, 8);
    graphics.fillStyle(highlightColor, 0.55);
    graphics.fillEllipse(16, 10, 26, 10);
    graphics.fillEllipse(42, 10, 32, 12);
    graphics.lineStyle(2, 0x000000, 0.07);
    graphics.lineBetween(0, 22, 64, 22);
    graphics.generateTexture(key, 64, 64);
  }

  private drawMovingPlatform(graphics: Phaser.GameObjects.Graphics): void {
    if (this.textures.exists('moving-platform')) {
      return;
    }

    graphics.clear();
    graphics.fillStyle(0xdaf8ff, 1);
    graphics.fillRoundedRect(0, 0, 96, 24, 8);
    graphics.fillStyle(0x7bbbd1, 1);
    graphics.fillRoundedRect(8, 14, 80, 6, 3);
    graphics.lineStyle(2, 0xffffff, 0.75);
    graphics.strokeRoundedRect(3, 3, 90, 16, 7);
    graphics.generateTexture('moving-platform', 96, 24);
  }

  private drawSkyBrick(graphics: Phaser.GameObjects.Graphics): void {
    if (this.textures.exists('terrain-sky-brick')) {
      return;
    }

    graphics.clear();
    graphics.fillStyle(0x7d8f9b, 1);
    graphics.fillRoundedRect(0, 0, 44, 44, 4);
    graphics.fillStyle(0x9fb5c4, 1);
    graphics.fillRoundedRect(3, 3, 38, 38, 4);
    graphics.fillStyle(0xcde1ed, 0.6);
    graphics.fillRoundedRect(5, 4, 34, 8, 3);
    graphics.lineStyle(3, 0x52646f, 1);
    graphics.lineBetween(0, 15, 44, 15);
    graphics.lineBetween(0, 31, 44, 31);
    graphics.lineBetween(16, 0, 16, 15);
    graphics.lineBetween(29, 15, 29, 31);
    graphics.lineBetween(16, 31, 16, 44);
    graphics.lineStyle(2, 0xe7f7ff, 0.55);
    graphics.strokeRoundedRect(2, 2, 40, 40, 4);
    graphics.generateTexture('terrain-sky-brick', 44, 44);
  }

  private drawRuneBox(graphics: Phaser.GameObjects.Graphics): void {
    if (this.textures.exists('terrain-rune-box') && this.textures.exists('terrain-rune-box-used')) {
      return;
    }

    if (!this.textures.exists('terrain-rune-box')) {
      graphics.clear();
      graphics.fillStyle(0x9a6b00, 1);
      graphics.fillRoundedRect(0, 0, 44, 44, 5);
      graphics.fillStyle(0xf2bc2e, 1);
      graphics.fillRoundedRect(3, 3, 38, 38, 5);
      graphics.fillStyle(0xffdf61, 1);
      graphics.fillRoundedRect(6, 5, 30, 28, 4);
      graphics.fillStyle(0xfff1a8, 0.75);
      graphics.fillEllipse(15, 9, 20, 5);
      graphics.lineStyle(2, 0x8a6100, 0.85);
      graphics.strokeRoundedRect(3, 3, 38, 38, 5);
      graphics.lineStyle(3, 0xffffff, 0.85);
      graphics.lineBetween(22, 11, 29, 18);
      graphics.lineBetween(29, 18, 22, 25);
      graphics.lineBetween(22, 25, 15, 18);
      graphics.lineBetween(15, 18, 22, 11);
      graphics.fillStyle(0xffffff, 0.95);
      graphics.fillCircle(22, 33, 3);
      graphics.fillStyle(0x725100, 0.9);
      graphics.fillCircle(8, 8, 3);
      graphics.fillCircle(36, 8, 3);
      graphics.fillCircle(8, 36, 3);
      graphics.fillCircle(36, 36, 3);
      graphics.generateTexture('terrain-rune-box', 44, 44);
    }

    if (!this.textures.exists('terrain-rune-box-used')) {
      graphics.clear();
      graphics.fillStyle(0x5a6970, 1);
      graphics.fillRoundedRect(0, 0, 44, 44, 5);
      graphics.fillStyle(0x899ca5, 1);
      graphics.fillRoundedRect(3, 3, 38, 38, 5);
      graphics.lineStyle(3, 0x53666e, 1);
      graphics.lineBetween(10, 22, 34, 22);
      graphics.lineBetween(22, 10, 22, 34);
      graphics.lineStyle(2, 0xcfe7f0, 0.5);
      graphics.strokeRoundedRect(3, 3, 38, 38, 5);
      graphics.generateTexture('terrain-rune-box-used', 44, 44);
    }
  }

  private drawSeed(graphics: Phaser.GameObjects.Graphics): void {
    if (this.textures.exists('light-seed-shard')) {
      return;
    }

    graphics.clear();
    graphics.fillStyle(0xffe07a, 0.22);
    graphics.fillCircle(20, 20, 19);
    graphics.fillStyle(0xb46f00, 1);
    graphics.fillCircle(22, 20, 17);
    graphics.fillStyle(0xffc72e, 1);
    graphics.fillCircle(19, 20, 17);
    graphics.fillStyle(0xffe58c, 1);
    graphics.fillCircle(17, 18, 12);
    graphics.lineStyle(3, 0x9d6500, 0.8);
    graphics.strokeCircle(19, 20, 15);
    graphics.lineStyle(2, 0xfff4bf, 0.9);
    graphics.strokeCircle(17, 18, 10);
    graphics.fillStyle(0xf5ad00, 1);
    graphics.fillEllipse(20, 20, 10, 18);
    graphics.fillStyle(0xfff0a8, 1);
    graphics.fillEllipse(18, 17, 5, 9);
    graphics.fillStyle(0xd78a00, 1);
    graphics.fillEllipse(22, 23, 5, 9);
    graphics.fillStyle(0xffffff, 0.55);
    graphics.fillEllipse(12, 9, 14, 4);
    graphics.generateTexture('light-seed-shard', 40, 40);
  }

  private drawOrb(graphics: Phaser.GameObjects.Graphics): void {
    if (this.textures.exists('breeze-orb')) {
      return;
    }

    graphics.clear();
    graphics.fillStyle(0xb8fbff, 0.35);
    graphics.fillCircle(16, 16, 15);
    graphics.fillStyle(0x68dfe0, 0.85);
    graphics.fillCircle(16, 16, 10);
    graphics.lineStyle(2, 0xffffff, 0.9);
    graphics.strokeCircle(16, 16, 12);
    graphics.lineStyle(2, 0x2f9bb2, 0.9);
    graphics.lineBetween(7, 18, 13, 13);
    graphics.lineBetween(13, 13, 20, 13);
    graphics.lineBetween(20, 13, 25, 15);
    graphics.generateTexture('breeze-orb', 32, 32);
  }

  private drawGrowthBud(graphics: Phaser.GameObjects.Graphics): void {
    if (this.textures.exists('growth-bud')) {
      return;
    }

    graphics.clear();
    graphics.fillStyle(0xf5e7ad, 1);
    graphics.fillEllipse(16, 24, 24, 16);
    graphics.fillStyle(0x2e4d38, 1);
    graphics.fillEllipse(11, 24, 3, 10);
    graphics.fillEllipse(21, 24, 3, 10);
    graphics.fillStyle(0x62c975, 1);
    graphics.fillEllipse(16, 11, 28, 22);
    graphics.fillStyle(0xb9f3a7, 1);
    graphics.fillCircle(16, 8, 7);
    graphics.fillCircle(7, 13, 5);
    graphics.fillCircle(25, 13, 5);
    graphics.lineStyle(2, 0x2b8c55, 1);
    graphics.strokeEllipse(16, 11, 28, 22);
    graphics.fillStyle(0xffffff, 0.45);
    graphics.fillEllipse(10, 5, 10, 3);
    graphics.generateTexture('growth-bud', 32, 32);
  }

  private drawDriftBug(graphics: Phaser.GameObjects.Graphics): void {
    if (this.textures.exists('drift-bug')) {
      return;
    }

    graphics.clear();
    graphics.fillStyle(0x6c7c42, 1);
    graphics.fillEllipse(16, 18, 28, 18);
    graphics.fillStyle(0xa2b85c, 1);
    graphics.fillEllipse(16, 16, 24, 15);
    graphics.fillStyle(0x1c2e25, 1);
    graphics.fillCircle(10, 15, 2);
    graphics.fillCircle(22, 15, 2);
    graphics.lineStyle(2, 0x40502d, 1);
    graphics.lineBetween(8, 24, 4, 30);
    graphics.lineBetween(24, 24, 28, 30);
    graphics.generateTexture('drift-bug', 32, 32);
  }

  private drawPuffHopper(graphics: Phaser.GameObjects.Graphics): void {
    if (this.textures.exists('puff-hopper')) {
      return;
    }

    graphics.clear();
    graphics.fillStyle(0xdff9ff, 1);
    graphics.fillCircle(12, 18, 10);
    graphics.fillCircle(22, 17, 11);
    graphics.fillCircle(17, 12, 10);
    graphics.fillStyle(0x43636d, 1);
    graphics.fillCircle(12, 17, 2);
    graphics.fillCircle(22, 17, 2);
    graphics.lineStyle(2, 0x8ecbd7, 1);
    graphics.strokeRoundedRect(6, 11, 22, 18, 8);
    graphics.generateTexture('puff-hopper', 34, 34);
  }

  private drawWindWisp(graphics: Phaser.GameObjects.Graphics): void {
    if (this.textures.exists('wind-wisp')) {
      return;
    }

    graphics.clear();
    graphics.fillStyle(0xbff6ff, 0.36);
    graphics.fillCircle(16, 16, 15);
    graphics.lineStyle(4, 0x85d8ef, 0.85);
    graphics.lineBetween(6, 18, 11, 11);
    graphics.lineBetween(11, 11, 20, 10);
    graphics.lineBetween(20, 10, 25, 17);
    graphics.lineBetween(25, 17, 19, 25);
    graphics.lineBetween(19, 25, 10, 20);
    graphics.fillStyle(0x2b7687, 1);
    graphics.fillCircle(14, 15, 2);
    graphics.fillCircle(21, 16, 2);
    graphics.generateTexture('wind-wisp', 32, 32);
  }

  private drawThorn(graphics: Phaser.GameObjects.Graphics): void {
    if (this.textures.exists('thorn-crystal')) {
      return;
    }

    graphics.clear();
    graphics.fillStyle(0x8b4fb1, 1);
    graphics.fillTriangle(8, 46, 20, 4, 32, 46);
    graphics.fillStyle(0xb579d5, 1);
    graphics.fillTriangle(28, 46, 42, 9, 56, 46);
    graphics.fillStyle(0xe7c8ff, 0.65);
    graphics.fillTriangle(20, 4, 23, 36, 12, 40);
    graphics.lineStyle(2, 0x62347c, 1);
    graphics.strokeTriangle(8, 46, 20, 4, 32, 46);
    graphics.strokeTriangle(28, 46, 42, 9, 56, 46);
    graphics.generateTexture('thorn-crystal', 64, 48);
  }

  private drawLantern(graphics: Phaser.GameObjects.Graphics, active: boolean): void {
    const key = active ? 'glow-lantern-active' : 'glow-lantern';
    if (this.textures.exists(key)) {
      return;
    }

    graphics.clear();
    if (active) {
      graphics.fillStyle(0xffed9c, 0.22);
      graphics.fillCircle(20, 25, 24);
    }
    graphics.lineStyle(3, 0x51483a, 1);
    graphics.lineBetween(20, 2, 20, 10);
    graphics.fillStyle(0x564c43, 1);
    graphics.fillRoundedRect(9, 9, 22, 34, 5);
    graphics.fillStyle(active ? 0xffec70 : 0xb6c1b2, 1);
    graphics.fillRoundedRect(13, 14, 14, 20, 5);
    graphics.fillStyle(0x51483a, 1);
    graphics.fillRect(16, 42, 8, 12);
    graphics.generateTexture(key, 40, 56);
  }

  private drawGate(graphics: Phaser.GameObjects.Graphics): void {
    if (this.textures.exists('wind-gate')) {
      return;
    }

    graphics.clear();
    graphics.lineStyle(6, 0x70d4e8, 1);
    graphics.strokeRoundedRect(8, 6, 48, 90, 24);
    graphics.lineStyle(3, 0xffffff, 0.9);
    graphics.strokeRoundedRect(14, 12, 36, 78, 18);
    graphics.lineStyle(3, 0x5ba8c0, 0.85);
    graphics.lineBetween(22, 58, 30, 49);
    graphics.lineBetween(30, 49, 38, 50);
    graphics.lineBetween(38, 50, 45, 55);
    graphics.fillStyle(0xeaffff, 0.28);
    graphics.fillRoundedRect(17, 15, 30, 70, 15);
    graphics.generateTexture('wind-gate', 64, 104);
  }

  private drawParticle(graphics: Phaser.GameObjects.Graphics, key: string, color: number): void {
    if (this.textures.exists(key)) {
      return;
    }

    graphics.clear();
    graphics.fillStyle(color, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture(key, 8, 8);
  }
}

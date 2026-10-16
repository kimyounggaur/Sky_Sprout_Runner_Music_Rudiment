import Phaser from 'phaser';
import { level1 } from '../data/levels/level1';
import {
  isEditorLevelData,
  toRuntimeLevelData,
  type LevelData as EditorLevelData
} from '../data/LevelData';
import { Player } from '../entities/Player';
import { BaseEnemy } from '../entities/BaseEnemy';
import { Checkpoint } from '../entities/Checkpoint';
import { Collectible } from '../entities/Collectible';
import { FinishGate } from '../entities/FinishGate';
import { GrowthBud } from '../entities/GrowthBud';
import { Hazard } from '../entities/Hazard';
import { MovingPlatform } from '../entities/MovingPlatform';
import { PowerUp } from '../entities/PowerUp';
import { DEPTHS, EVENTS } from '../config/constants';
import type { HudPayload, LevelData, LevelObjects } from '../types';
import { AudioManager } from '../systems/AudioManager';
import { CameraSystem } from '../systems/CameraSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { InputSystem } from '../systems/InputSystem';
import { LevelLoader } from '../systems/LevelLoader';
import { ParticleSystem } from '../systems/ParticleSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { didHitBlockFromBelow } from '../systems/headHit';
import { getArcadeBody } from '../utils/assertions';
import { publishGameState } from '../utils/debugState';
import { secondsFromMs } from '../utils/timers';

type ArcadeObject = unknown;

export class LevelScene extends Phaser.Scene {
  private level: LevelData = level1;
  private testPlay = false;
  private player!: Player;
  private objects!: LevelObjects;
  private inputSystem!: InputSystem;
  private cameraSystem!: CameraSystem;
  private particles!: ParticleSystem;
  private scoreSystem!: ScoreSystem;
  private growthBuds!: Phaser.Physics.Arcade.Group;
  private audio!: AudioManager;
  private startedAt = 0;
  private lastHudAt = 0;
  private wasOnGround = false;
  private resolved = false;
  private ignorePauseUntil = 0;

  constructor() {
    super('LevelScene');
  }

  init(data?: { level?: LevelData | EditorLevelData | unknown; testPlay?: boolean }): void {
    this.testPlay = Boolean(data?.testPlay);
    if (isEditorLevelData(data?.level)) {
      this.level = toRuntimeLevelData(data.level);
      return;
    }

    if (data?.level && typeof data.level === 'object' && 'world' in data.level && 'start' in data.level) {
      this.level = data.level as LevelData;
      return;
    }

    this.level = level1;
  }

  create(): void {
    publishGameState('playing');
    this.resolved = false;
    this.startedAt = this.time.now;
    this.lastHudAt = 0;

    this.physics.world.setBounds(0, 0, this.level.world.width, this.level.world.fallY + 200);
    this.drawBackground();

    this.audio = AudioManager.get();
    this.scoreSystem = new ScoreSystem();
    this.particles = new ParticleSystem(this);
    this.inputSystem = new InputSystem(this);
    this.objects = new LevelLoader(this).load(this.level);
    this.growthBuds = this.physics.add.group({ allowGravity: true, immovable: false });
    this.player = new Player(this, this.level.start.x, this.level.start.y);
    this.player.resetForNewRun();

    this.setupPhysics();
    this.setupPlayerEvents();
    this.input.on('pointerdown', this.handlePointerPause, this);

    this.cameraSystem = new CameraSystem(this, this.level);
    this.cameraSystem.follow(this.player);

    if (this.scene.isActive('HudScene')) {
      this.scene.stop('HudScene');
    }
    this.scene.launch('HudScene');
    if (this.testPlay) {
      this.createTestPlayHud();
    }
    this.emitHud(true);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', this.handlePointerPause, this);
      this.events.off(Phaser.Scenes.Events.RESUME, this.handleResume, this);
      this.inputSystem.destroy();
    });
    this.events.on(Phaser.Scenes.Events.RESUME, this.handleResume, this);
  }

  update(time: number, delta: number): void {
    if (this.resolved) {
      return;
    }

    const input = this.inputSystem.read();

    if (input.pausePressed && time >= this.ignorePauseUntil) {
      if (this.testPlay) {
        this.returnToEditor();
        return;
      }
      this.pauseGame();
      return;
    }

    if (input.restartPressed) {
      this.restartCurrentCheckpoint();
    }

    this.updateMovingPlatforms();
    this.updateGrowthBuds();
    this.updateEnemies(time, delta);
    this.player.updateFromInput(this.resolveCrouchInput(input), time, delta);
    this.cameraSystem.update(this.player);
    this.checkFall(time);
    this.detectLanding();
    this.emitHud(false);
  }

  restartCurrentCheckpoint(): void {
    this.player.respawn();
    this.cameras.main.flash(120, 255, 255, 255, false);
  }

  private drawBackground(): void {
    const graphics = this.add.graphics().setDepth(DEPTHS.background);
    graphics.fillGradientStyle(0x7dd6ff, 0x7dd6ff, 0xc2f4ff, 0xc2f4ff, 1);
    graphics.fillRect(0, 0, this.level.world.width, this.level.world.height);

    for (let x = 120; x < this.level.world.width; x += 430) {
      const y = 95 + Math.sin(x * 0.006) * 38;
      graphics.fillStyle(0xffffff, 0.42);
      graphics.fillEllipse(x, y, 210, 54);
      graphics.fillEllipse(x + 62, y - 18, 120, 42);
      graphics.fillEllipse(x - 78, y + 5, 116, 36);
    }

    graphics.fillStyle(0x5dbd84, 0.28);
    graphics.fillRect(0, 650, this.level.world.width, 90);
  }

  private setupPhysics(): void {
    this.physics.add.collider(
      this.player,
      this.objects.terrain,
      this.handleTerrainCollision,
      undefined,
      this
    );
    this.physics.add.collider(this.player, this.objects.movingPlatforms);
    this.physics.add.collider(this.growthBuds, this.objects.terrain);
    this.physics.add.collider(this.growthBuds, this.objects.movingPlatforms);
    this.physics.add.collider(this.objects.enemies, this.objects.terrain);
    this.physics.add.collider(this.objects.enemies, this.objects.movingPlatforms);

    this.physics.add.overlap(
      this.player,
      this.objects.collectibles,
      this.handleCollectible,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.objects.powerUps,
      this.handlePowerUp,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.growthBuds,
      this.handleGrowthBud,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.objects.enemies,
      this.handleEnemy,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.objects.hazards,
      this.handleHazard,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.objects.checkpoints,
      this.handleCheckpoint,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.objects.finishGate,
      this.handleFinish,
      undefined,
      this
    );
  }

  private setupPlayerEvents(): void {
    this.events.on('player:jump', this.handlePlayerJump, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off('player:jump', this.handlePlayerJump, this);
    });
  }

  private handlePlayerJump(x: number, y: number): void {
    this.audio.play('jump');
    this.particles.jumpDust(x, y);
  }

  private handlePointerPause(pointer: Phaser.Input.Pointer): void {
    if (this.resolved || pointer.x < this.scale.width - 140 || pointer.y > 96) {
      return;
    }

    if (this.testPlay) {
      this.returnToEditor();
      return;
    }

    this.pauseGame();
  }

  private handleResume(): void {
    this.ignorePauseUntil = this.time.now + 180;
  }

  private updateMovingPlatforms(): void {
    for (const child of this.objects.movingPlatforms.getChildren()) {
      if (child instanceof MovingPlatform) {
        child.updatePlatform();
      }
    }
  }

  private updateGrowthBuds(): void {
    for (const child of this.growthBuds.getChildren()) {
      if (child instanceof GrowthBud) {
        child.updateBud();
      }
    }
  }

  private updateEnemies(time: number, delta: number): void {
    for (const child of this.objects.enemies.getChildren()) {
      if (child instanceof BaseEnemy && child.active) {
        child.updateEnemy(time, delta);
      }
    }
  }

  private resolveCrouchInput(input: ReturnType<InputSystem['read']>): ReturnType<InputSystem['read']> {
    if (
      input.down ||
      !this.player.isCrouching() ||
      this.player.hasRoomToStand([this.objects.terrain, this.objects.movingPlatforms])
    ) {
      return input;
    }

    return { ...input, down: true };
  }

  private handleCollectible(_playerObject: ArcadeObject, collectibleObject: ArcadeObject): void {
    if (!(collectibleObject instanceof Collectible) || !collectibleObject.active) {
      return;
    }

    collectibleObject.collect();
    this.scoreSystem.addShard();
    this.audio.play('collect');
    this.particles.collectSpark(collectibleObject.x, collectibleObject.y);
    this.emitHud(true);
  }

  private handleTerrainCollision(_playerObject: ArcadeObject, terrainObject: ArcadeObject): void {
    if (!(terrainObject instanceof Phaser.GameObjects.Image)) {
      return;
    }

    if (terrainObject.getData('terrainKind') !== 'runeBox' || terrainObject.getData('spent')) {
      return;
    }

    const playerBody = getArcadeBody(this.player);
    const blockBody = terrainObject.body;
    const hitFromBelow =
      blockBody instanceof Phaser.Physics.Arcade.StaticBody &&
      this.player.y > terrainObject.y &&
      didHitBlockFromBelow(playerBody, blockBody);

    if (!hitFromBelow) {
      return;
    }

    terrainObject.setData('spent', true);
    terrainObject.setTexture('terrain-rune-box-used');
    this.audio.play('power');
    this.tweens.add({
      targets: terrainObject,
      y: terrainObject.y - 8,
      duration: 70,
      yoyo: true,
      ease: 'Sine.easeOut',
      onUpdate: () => this.updateStaticBlockBody(terrainObject),
      onComplete: () => this.updateStaticBlockBody(terrainObject)
    });
    this.spawnGrowthBud(terrainObject.x, terrainObject.y - 6);
  }

  private updateStaticBlockBody(block: Phaser.GameObjects.Image): void {
    if (block.body instanceof Phaser.Physics.Arcade.StaticBody) {
      block.body.updateFromGameObject();
    }
  }

  private spawnGrowthBud(x: number, y: number): void {
    const bud = new GrowthBud(this, x, y);
    this.growthBuds.add(bud);
    this.particles.collectSpark(x, y - 24);
  }

  private handlePowerUp(_playerObject: ArcadeObject, powerObject: ArcadeObject): void {
    if (!(powerObject instanceof PowerUp) || !powerObject.active) {
      return;
    }

    powerObject.collect();
    this.player.applyBreeze(powerObject.durationMs, this.time.now);
    this.scoreSystem.addPowerUp();
    this.audio.play('power');
    this.particles.collectSpark(powerObject.x, powerObject.y);
    this.emitHud(true);
  }

  private handleGrowthBud(_playerObject: ArcadeObject, budObject: ArcadeObject): void {
    if (!(budObject instanceof GrowthBud) || !budObject.active) {
      return;
    }

    budObject.collect();
    this.player.grow();
    this.scoreSystem.addPowerUp();
    this.audio.play('power');
    this.particles.collectSpark(this.player.x, this.player.y - 24);
    this.emitHud(true);
  }

  private handleEnemy(_playerObject: ArcadeObject, enemyObject: ArcadeObject): void {
    if (!(enemyObject instanceof BaseEnemy) || enemyObject.isDefeated()) {
      return;
    }

    if (CollisionSystem.isStomp(this.player, enemyObject)) {
      enemyObject.defeat();
      this.player.bounce();
      this.scoreSystem.addEnemyDefeat();
      this.audio.play('enemy');
      this.particles.enemyBurst(enemyObject.x, enemyObject.y);
      this.emitHud(true);
      return;
    }

    this.damagePlayer(enemyObject.x);
  }

  private handleHazard(_playerObject: ArcadeObject, hazardObject: ArcadeObject): void {
    if (!(hazardObject instanceof Hazard)) {
      return;
    }

    this.damagePlayer(hazardObject.x);
  }

  private handleCheckpoint(_playerObject: ArcadeObject, checkpointObject: ArcadeObject): void {
    if (!(checkpointObject instanceof Checkpoint)) {
      return;
    }

    if (checkpointObject.activate()) {
      this.player.setCheckpoint({ x: checkpointObject.x + 26, y: checkpointObject.y - 48 }, checkpointObject.label);
      this.audio.play('checkpoint');
      this.particles.collectSpark(checkpointObject.x, checkpointObject.y - 12);
      this.emitHud(true);
    }
  }

  private handleFinish(_playerObject: ArcadeObject, finishObject: ArcadeObject): void {
    if (!(finishObject instanceof FinishGate)) {
      return;
    }

    this.completeLevel();
  }

  private damagePlayer(sourceX: number): void {
    const direction = CollisionSystem.knockbackDirection(this.player, sourceX);

    if (!this.player.takeHit(this.time.now, direction)) {
      return;
    }

    this.audio.play('hit');
    this.cameras.main.shake(110, 0.003);
    this.emitHud(true);

    if (this.player.health <= 0) {
      this.showGameOver();
    }
  }

  private checkFall(time: number): void {
    if (this.player.y <= this.level.world.fallY) {
      return;
    }

    if (this.player.loseLifeForFall(time)) {
      this.audio.play('hit');
      this.restartCurrentCheckpoint();
      this.emitHud(true);
      return;
    }

    this.showGameOver();
  }

  private detectLanding(): void {
    const body = getArcadeBody(this.player);
    const onGround = body.blocked.down || body.touching.down;

    if (onGround && !this.wasOnGround) {
      this.audio.play('land');
      this.particles.landDust(this.player.x, this.player.y);
    }

    this.wasOnGround = onGround;
  }

  private pauseGame(): void {
    this.inputSystem.clearPausePress();
    this.scene.launch('PauseScene');
    this.scene.pause();
  }

  private createTestPlayHud(): void {
    this.add
      .text(480, 18, 'Test Play', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#102c31',
        stroke: '#ffffff',
        strokeThickness: 4
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTHS.ui);

    const button = this.add
      .rectangle(820, 38, 180, 44, 0xf4fff7, 0.94)
      .setStrokeStyle(2, 0x52b6c7, 1)
      .setScrollFactor(0)
      .setDepth(DEPTHS.ui)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(820, 38, 'Return to Editor', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#123237'
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTHS.ui + 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.returnToEditor());
    button.on('pointerdown', () => this.returnToEditor());
  }

  private returnToEditor(): void {
    if (this.resolved) {
      return;
    }

    this.resolved = true;
    this.scene.stop('HudScene');
    window.dispatchEvent(new CustomEvent('sky-sprout:return-editor'));
  }

  private showGameOver(): void {
    if (this.resolved) {
      return;
    }

    this.resolved = true;
    publishGameState('gameOver');
    this.scene.launch('GameOverScene', {
      score: this.scoreSystem.getScore(),
      bestScore: this.scoreSystem.getBestScore()
    });
    this.scene.pause();
  }

  private completeLevel(): void {
    if (this.resolved) {
      return;
    }

    this.resolved = true;
    const elapsedSeconds = secondsFromMs(this.time.now - this.startedAt);
    this.scoreSystem.addClearBonus(this.level.world.timeLimitSeconds, elapsedSeconds);
    const bestScore = this.scoreSystem.commitBestScore();
    this.audio.play('clear');
    this.cameras.main.shake(160, 0.002);
    publishGameState('levelComplete');
    this.emitHud(true);
    window.dispatchEvent(
      new CustomEvent('sky-sprout:level-complete', {
        detail: {
          levelId: this.level.id,
          score: this.scoreSystem.getScore(),
          elapsedSeconds
        }
      })
    );
    this.scene.launch('LevelCompleteScene', {
      score: this.scoreSystem.getScore(),
      shards: this.scoreSystem.getShards(),
      totalShards: this.level.collectibles.length,
      elapsedSeconds,
      bestScore
    });
    this.scene.pause();
  }

  private emitHud(force: boolean): void {
    if (!force && this.time.now - this.lastHudAt < 120) {
      return;
    }

    this.lastHudAt = this.time.now;
    const payload: HudPayload = {
      health: this.player.health,
      shards: this.scoreSystem.getShards(),
      totalShards: this.level.collectibles.length,
      score: this.scoreSystem.getScore(),
      elapsedSeconds: secondsFromMs(this.time.now - this.startedAt),
      checkpointLabel: this.player.getCheckpointLabel(),
      powerActive: this.player.hasBreeze(this.time.now),
      highScore: this.scoreSystem.getBestScore()
    };

    this.game.events.emit(EVENTS.hudUpdate, payload);
  }
}

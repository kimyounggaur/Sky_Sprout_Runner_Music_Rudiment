import Phaser from 'phaser';
import { DEPTHS, PLAYER } from '../config/constants';
import type { PlayerInput, Point } from '../types';
import { approach } from '../utils/math';
import { getArcadeBody } from '../utils/assertions';
import { hasStandingRoom, type Bounds } from '../systems/standingRoom';

type PlayerVisualState = 'idle' | 'run' | 'jump' | 'fall' | 'hurt' | 'wall' | 'crouch';
type ObstacleGroup = Phaser.Physics.Arcade.Group | Phaser.Physics.Arcade.StaticGroup;

export class Player extends Phaser.Physics.Arcade.Sprite {
  health: number = PLAYER.maxHealth;
  facing: -1 | 1 = 1;
  private respawnPoint: Point;
  private checkpointLabel = 'Start';
  private lastGroundedAt = Number.NEGATIVE_INFINITY;
  private jumpBufferedUntil = Number.NEGATIVE_INFINITY;
  private invulnerableUntil = 0;
  private breezeUntil = 0;
  private visualState: PlayerVisualState = 'idle';
  private airJumpsRemaining = PLAYER.maxAirJumps;
  private wallDirection: -1 | 0 | 1 = 0;
  private wallClinging = false;
  private grown = false;
  private crouching = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'sprout-idle');
    this.respawnPoint = { x, y };

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setName('Sprout');
    this.setDepth(DEPTHS.player);
    this.setOrigin(0.5, 0.5);
    this.setCollideWorldBounds(false);

    const body = getArcadeBody(this);
    body.setSize(22, 34);
    body.setOffset(5, 8);
    body.setMaxVelocity(PLAYER.runSpeed + 80, PLAYER.maxFallSpeed);
  }

  updateFromInput(input: PlayerInput, time: number, delta: number): void {
    const body = getArcadeBody(this);
    const dt = delta / 1000;
    const onGround = body.blocked.down || body.touching.down;

    if (onGround) {
      this.lastGroundedAt = time;
      this.airJumpsRemaining = PLAYER.maxAirJumps;
    }

    if (input.jumpPressed) {
      this.jumpBufferedUntil = time + PLAYER.jumpBufferMs;
    }

    this.setCrouching(input.down && onGround);
    this.updateWallState(input, onGround, body);
    this.applyHorizontalMovement(input, dt, onGround, body);
    this.applyJumping(input, time, onGround, body);
    this.applyWallSlide(body);

    body.setGravityY(body.velocity.y > 20 ? PLAYER.extraFallGravity : 0);
    body.velocity.y = Math.min(body.velocity.y, PLAYER.maxFallSpeed);

    this.updateVisualState(time, body, onGround);
  }

  bounce(): void {
    getArcadeBody(this).setVelocityY(PLAYER.bounceVelocity);
    this.lastGroundedAt = Number.NEGATIVE_INFINITY;
  }

  takeHit(time: number, knockbackDirection: -1 | 1): boolean {
    if (this.isInvulnerable(time)) {
      return false;
    }

    this.health = Math.max(0, this.health - 1);
    this.invulnerableUntil = time + PLAYER.invulnerableMs;
    this.setTexture('sprout-hurt');
    getArcadeBody(this).setVelocity(
      knockbackDirection * PLAYER.hurtKnockbackX,
      PLAYER.hurtKnockbackY
    );

    return true;
  }

  loseLifeForFall(time: number): boolean {
    if (!this.isInvulnerable(time)) {
      this.health = Math.max(0, this.health - 1);
      this.invulnerableUntil = time + PLAYER.invulnerableMs;
    }

    return this.health > 0;
  }

  respawn(): void {
    this.setPosition(this.respawnPoint.x, this.respawnPoint.y);
    const body = getArcadeBody(this);
    body.reset(this.respawnPoint.x, this.respawnPoint.y);
    body.setVelocity(0, 0);
    body.setGravityY(0);
  }

  setCheckpoint(point: Point, label: string): void {
    this.respawnPoint = { ...point };
    this.checkpointLabel = label;
  }

  getCheckpointLabel(): string {
    return this.checkpointLabel;
  }

  applyBreeze(durationMs: number, time: number): void {
    this.breezeUntil = Math.max(this.breezeUntil, time + durationMs);
  }

  hasBreeze(time: number): boolean {
    return time < this.breezeUntil;
  }

  isCrouching(): boolean {
    return this.crouching;
  }

  hasRoomToStand(obstacleGroups: ObstacleGroup[]): boolean {
    const body = getArcadeBody(this);
    const standingBounds = this.getStandingBounds(body);
    const overheadObstacles = obstacleGroups.flatMap((group) =>
      group
        .getChildren()
        .map((child) => this.getObstacleBounds(child))
        .filter((bounds): bounds is Bounds => Boolean(bounds))
        .filter((bounds) => bounds.top < body.bottom - 2)
    );

    return hasStandingRoom(standingBounds, overheadObstacles);
  }

  isInvulnerable(time: number): boolean {
    return time < this.invulnerableUntil;
  }

  resetForNewRun(): void {
    this.health = PLAYER.maxHealth;
    this.invulnerableUntil = 0;
    this.breezeUntil = 0;
    this.airJumpsRemaining = PLAYER.maxAirJumps;
    this.resetGrowth();
  }

  grow(): boolean {
    if (this.grown) {
      return false;
    }

    this.grown = true;
    const body = getArcadeBody(this);
    const bottom = body.bottom;
    this.setScale(1, 2);
    this.syncBodyForPosture(body);
    this.y -= Math.max(0, body.bottom - bottom);
    body.updateFromGameObject();
    return true;
  }

  private resetGrowth(): void {
    this.grown = false;
    this.crouching = false;
    this.setScale(1, 1);
    this.syncBodyForPosture(getArcadeBody(this));
  }

  private setCrouching(crouching: boolean): void {
    if (this.crouching === crouching) {
      return;
    }

    this.crouching = crouching;
    this.syncBodyForPosture(getArcadeBody(this));
  }

  private syncBodyForPosture(body: Phaser.Physics.Arcade.Body): void {
    const bottom = body.bottom;
    body.setSize(this.crouching ? 24 : 22, this.crouching ? 20 : 34, false);
    body.setOffset(this.crouching ? 4 : 5, this.crouching ? 22 : 8);
    body.updateFromGameObject();
    this.y -= Math.max(0, body.bottom - bottom);
    body.updateFromGameObject();
  }

  private getStandingBounds(body: Phaser.Physics.Arcade.Body): Bounds {
    const width = 22 * this.scaleX;
    const height = 34 * this.scaleY;
    const centerX = body.center.x;

    return {
      left: centerX - width / 2,
      right: centerX + width / 2,
      top: body.bottom - height,
      bottom: body.bottom
    };
  }

  private getObstacleBounds(child: Phaser.GameObjects.GameObject): Bounds | null {
    if (!child.active) {
      return null;
    }

    const body = (child as Phaser.GameObjects.GameObject & { body?: unknown }).body;

    if (
      body instanceof Phaser.Physics.Arcade.Body ||
      body instanceof Phaser.Physics.Arcade.StaticBody
    ) {
      return {
        left: body.left,
        right: body.right,
        top: body.top,
        bottom: body.bottom
      };
    }

    return null;
  }

  private applyHorizontalMovement(
    input: PlayerInput,
    dt: number,
    onGround: boolean,
    body: Phaser.Physics.Arcade.Body
  ): void {
    const axis = Number(input.right) - Number(input.left);
    const speedBase = input.run ? PLAYER.runSpeed : PLAYER.walkSpeed;
    const maxSpeed = this.hasBreeze(this.scene.time.now)
      ? speedBase * PLAYER.breezeAirControlMultiplier
      : speedBase;

    if (axis !== 0) {
      this.facing = axis < 0 ? -1 : 1;
      const acceleration =
        (!onGround && this.hasBreeze(this.scene.time.now)
          ? PLAYER.airAcceleration * PLAYER.breezeAirControlMultiplier
          : onGround
            ? PLAYER.acceleration
            : PLAYER.airAcceleration) * dt;
      body.velocity.x = approach(body.velocity.x, axis * maxSpeed, acceleration);
    } else {
      const drag = (onGround ? PLAYER.groundDrag : PLAYER.airDrag) * dt;
      body.velocity.x = approach(body.velocity.x, 0, drag);
    }

    body.velocity.x = Phaser.Math.Clamp(body.velocity.x, -maxSpeed, maxSpeed);
    this.setFlipX(this.facing < 0);
  }

  private applyJumping(
    input: PlayerInput,
    time: number,
    onGround: boolean,
    body: Phaser.Physics.Arcade.Body
  ): void {
    const canUseCoyote = time - this.lastGroundedAt <= PLAYER.coyoteMs;
    const hasBufferedJump = time <= this.jumpBufferedUntil;

    if (hasBufferedJump && this.wallClinging) {
      body.setVelocity(-this.wallDirection * PLAYER.wallJumpVelocityX, PLAYER.wallJumpVelocityY);
      this.facing = this.wallDirection < 0 ? 1 : -1;
      this.airJumpsRemaining = PLAYER.maxAirJumps;
      this.jumpBufferedUntil = Number.NEGATIVE_INFINITY;
      this.lastGroundedAt = Number.NEGATIVE_INFINITY;
      this.wallClinging = false;
      this.scene.events.emit('player:jump', this.x, this.y);
    } else if (hasBufferedJump && (onGround || canUseCoyote)) {
      const jumpVelocity = this.hasBreeze(time) ? PLAYER.poweredJumpVelocity : PLAYER.jumpVelocity;
      body.setVelocityY(jumpVelocity);
      this.airJumpsRemaining = PLAYER.maxAirJumps;
      this.jumpBufferedUntil = Number.NEGATIVE_INFINITY;
      this.lastGroundedAt = Number.NEGATIVE_INFINITY;
      this.scene.events.emit('player:jump', this.x, this.y);
    } else if (hasBufferedJump && this.airJumpsRemaining > 0) {
      body.setVelocityY(
        this.hasBreeze(time) ? PLAYER.doubleJumpVelocity - 35 : PLAYER.doubleJumpVelocity
      );
      this.airJumpsRemaining -= 1;
      this.jumpBufferedUntil = Number.NEGATIVE_INFINITY;
      this.scene.events.emit('player:jump', this.x, this.y);
    }

    if (input.jumpReleased && body.velocity.y < PLAYER.shortJumpVelocity) {
      body.setVelocityY(PLAYER.shortJumpVelocity);
    }
  }

  private updateWallState(
    input: PlayerInput,
    onGround: boolean,
    body: Phaser.Physics.Arcade.Body
  ): void {
    const wallDirection = body.blocked.left || body.touching.left ? -1 : body.blocked.right || body.touching.right ? 1 : 0;
    const pressingIntoWall =
      (wallDirection < 0 && input.left) || (wallDirection > 0 && input.right);

    this.wallDirection = wallDirection;
    this.wallClinging = !onGround && pressingIntoWall && wallDirection !== 0 && body.velocity.y >= -40;

    if (this.wallClinging) {
      this.airJumpsRemaining = PLAYER.maxAirJumps;
    }
  }

  private applyWallSlide(body: Phaser.Physics.Arcade.Body): void {
    if (!this.wallClinging || body.velocity.y <= PLAYER.wallSlideMaxFallSpeed) {
      return;
    }

    body.setVelocityY(PLAYER.wallSlideMaxFallSpeed);
  }

  private updateVisualState(
    time: number,
    body: Phaser.Physics.Arcade.Body,
    onGround: boolean
  ): void {
    const nextState: PlayerVisualState = this.isInvulnerable(time)
      ? 'hurt'
      : this.wallClinging
        ? 'wall'
        : this.crouching && onGround
          ? 'crouch'
        : !onGround && body.velocity.y < -20
        ? 'jump'
        : !onGround && body.velocity.y > 30
          ? 'fall'
          : Math.abs(body.velocity.x) > 20
            ? 'run'
            : 'idle';

    if (nextState !== this.visualState) {
      this.visualState = nextState;
      this.setTexture(`sprout-${nextState}`);
    }

    this.setAlpha(this.isInvulnerable(time) && Math.floor(time / 90) % 2 === 0 ? 0.55 : 1);
  }
}

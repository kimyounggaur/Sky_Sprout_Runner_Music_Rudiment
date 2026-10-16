import Phaser from 'phaser';
import type { EnemyDef, LevelData, LevelObjects } from '../types';
import { Collectible } from '../entities/Collectible';
import { Checkpoint } from '../entities/Checkpoint';
import { DriftBug } from '../entities/DriftBug';
import { FinishGate } from '../entities/FinishGate';
import { Hazard } from '../entities/Hazard';
import { MovingPlatform } from '../entities/MovingPlatform';
import { PowerUp } from '../entities/PowerUp';
import { PuffHopper } from '../entities/PuffHopper';
import { WindWisp } from '../entities/WindWisp';
import { BaseEnemy } from '../entities/BaseEnemy';
import { DEPTHS } from '../config/constants';
import { getArcadeBody, getStaticBody } from '../utils/assertions';

export class LevelLoader {
  constructor(private readonly scene: Phaser.Scene) {}

  load(level: LevelData): LevelObjects {
    const terrain = this.scene.physics.add.staticGroup();
    const movingPlatforms = this.scene.physics.add.group({ allowGravity: false, immovable: true });
    const collectibles = this.scene.physics.add.group({ allowGravity: false, immovable: true });
    const powerUps = this.scene.physics.add.group({ allowGravity: false, immovable: true });
    const enemies = this.scene.physics.add.group();
    const hazards = this.scene.physics.add.group({ allowGravity: false, immovable: true });
    const checkpoints = this.scene.physics.add.group({ allowGravity: false, immovable: true });
    const finishGate = this.scene.physics.add.group({ allowGravity: false, immovable: true });

    for (const rect of level.terrain) {
      const texture = this.textureForTerrain(rect.kind);
      const tile = this.scene.add
        .image(rect.x, rect.y, texture)
        .setDepth(DEPTHS.terrain)
        .setDisplaySize(rect.width, rect.height);
      tile.setName(rect.id);
      tile.setData('terrainKind', rect.kind);
      tile.setData('spent', false);
      terrain.add(tile);
      getStaticBody(tile).setSize(rect.width, rect.height).updateFromGameObject();
    }

    for (const platformDef of level.movingPlatforms) {
      movingPlatforms.add(
        new MovingPlatform(
          this.scene,
          platformDef.x,
          platformDef.y,
          platformDef.width,
          platformDef.height,
          platformDef.from,
          platformDef.to,
          platformDef.speed,
          platformDef.waypoints,
          platformDef.mode
        )
      );
    }

    for (const collectible of level.collectibles) {
      collectibles.add(new Collectible(this.scene, collectible.x, collectible.y, collectible.id));
    }

    for (const powerUp of level.powerUps) {
      powerUps.add(new PowerUp(this.scene, powerUp.x, powerUp.y, powerUp.id, powerUp.durationMs));
    }

    for (const enemy of level.enemies) {
      enemies.add(this.createEnemy(enemy));
    }

    for (const hazard of level.hazards) {
      hazards.add(new Hazard(this.scene, hazard.x, hazard.y, hazard.width, hazard.height));
    }

    for (const checkpoint of level.checkpoints) {
      checkpoints.add(
        new Checkpoint(this.scene, checkpoint.x, checkpoint.y, checkpoint.id, checkpoint.label)
      );
    }

    finishGate.add(
      new FinishGate(this.scene, level.finishGate.x, level.finishGate.y, level.finishGate.id)
    );

    for (const group of [movingPlatforms, collectibles, powerUps, hazards, checkpoints, finishGate]) {
      for (const child of group.getChildren()) {
        if (child instanceof Phaser.Physics.Arcade.Image || child instanceof Phaser.Physics.Arcade.Sprite) {
          const body = getArcadeBody(child);
          body.setAllowGravity(false);
          body.setImmovable(true);
        }
      }
    }

    return { terrain, movingPlatforms, collectibles, powerUps, enemies, hazards, checkpoints, finishGate };
  }

  private createEnemy(definition: EnemyDef): BaseEnemy {
    switch (definition.kind) {
      case 'driftBug':
        return new DriftBug(
          this.scene,
          definition.x,
          definition.y,
          definition.patrolDistance,
          definition.speed
        );
      case 'puffHopper':
        return new PuffHopper(
          this.scene,
          definition.x,
          definition.y,
          definition.patrolDistance,
          definition.speed
        );
      case 'windWisp':
        return new WindWisp(
          this.scene,
          definition.x,
          definition.y,
          definition.patrolDistance,
          definition.speed
        );
    }
  }

  private textureForTerrain(kind: LevelData['terrain'][number]['kind']): string {
    switch (kind) {
      case 'grass':
        return 'terrain-grass';
      case 'stone':
        return 'terrain-stone';
      case 'cloud':
        return 'terrain-cloud';
      case 'skyBrick':
        return 'terrain-sky-brick';
      case 'runeBox':
        return 'terrain-rune-box';
    }
  }
}

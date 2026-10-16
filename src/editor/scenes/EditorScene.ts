import Phaser from 'phaser';
import { getLevelObjects, type LevelObject } from '../../game/data/LevelData';
import type { EditorEventBus } from '../EditorEventBus';
import type { EditorState } from '../schemas/levelDefaults';
import { isObjectEditable } from '../systems/EditorAdvancedTools';
import { snapToGrid } from '../utils/gridMath';

type DragState = {
  ids: string[];
  startX: number;
  startY: number;
};

export class EditorScene extends Phaser.Scene {
  private bus!: EditorEventBus;
  private state!: EditorState;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private objectGraphics!: Phaser.GameObjects.Graphics;
  private overlayGraphics!: Phaser.GameObjects.Graphics;
  private dragState: DragState | null = null;
  private isPanning = false;

  constructor() {
    super('EditorScene');
  }

  init(data: { bus: EditorEventBus; state: EditorState }): void {
    this.bus = data.bus;
    this.state = data.state;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#c9f3ff');
    this.gridGraphics = this.add.graphics();
    this.objectGraphics = this.add.graphics();
    this.overlayGraphics = this.add.graphics();
    this.input.mouse?.disableContextMenu();

    const unsubscribeState = this.bus.on('state:changed', (state) => {
      this.state = state;
      const camera = this.cameras?.main;
      if (!camera) {
        return;
      }

      camera.setBounds(
        0,
        0,
        state.level.world.widthTiles * state.level.world.tileSize,
        state.level.world.heightTiles * state.level.world.tileSize
      );
      camera.setZoom(state.camera.zoom);
      this.render();
    });
    const unsubscribeFocus = this.bus.on('focus', ({ x, y }) => {
      const camera = this.cameras?.main;
      if (!camera) {
        return;
      }

      camera.centerOn(x, y);
      this.emitCamera();
    });

    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.input.on('wheel', this.handleWheel, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unsubscribeState();
      unsubscribeFocus();
      this.input.off('pointerdown', this.handlePointerDown, this);
      this.input.off('pointermove', this.handlePointerMove, this);
      this.input.off('pointerup', this.handlePointerUp, this);
      this.input.off('wheel', this.handleWheel, this);
    });

    this.render();
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (pointer.rightButtonDown() || this.state.activeTool === 'pan') {
      this.isPanning = true;
      return;
    }

    const world = this.worldPoint(pointer);
    const hit = this.hitTest(world.x, world.y);
    if (this.state.activeTool === 'brush' || this.state.activeTool === 'rectangle') {
      this.bus.emit('place', world);
      return;
    }

    if (this.state.activeTool === 'path') {
      this.bus.emit('path:addWaypoint', world);
      return;
    }

    if (this.state.activeTool === 'erase') {
      if (hit) {
        this.bus.emit('delete', { ids: [hit.id] });
      }
      return;
    }

    if (hit) {
      const additive = Boolean(pointer.event instanceof MouseEvent && pointer.event.shiftKey);
      const ids = additive ? [...new Set([...this.state.selectedIds, hit.id])] : [hit.id];
      this.bus.emit('select', { ids, additive });
      this.dragState = { ids, startX: world.x, startY: world.y };
      return;
    }

    this.bus.emit('select', { ids: [], additive: false });
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    const world = this.worldPoint(pointer);
    this.bus.emit('cursor', world);

    if (this.isPanning && pointer.isDown) {
      const camera = this.cameras.main;
      camera.scrollX -= pointer.velocity.x / camera.zoom / 16;
      camera.scrollY -= pointer.velocity.y / camera.zoom / 16;
      this.emitCamera();
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.isPanning) {
      this.isPanning = false;
      return;
    }

    if (!this.dragState || this.state.activeTool !== 'select') {
      this.dragState = null;
      return;
    }

    const world = this.worldPoint(pointer);
    const snappedStart = this.state.grid.snap
      ? snapToGrid({ x: this.dragState.startX, y: this.dragState.startY }, this.state.grid.tileSize)
      : { x: this.dragState.startX, y: this.dragState.startY };
    const snappedEnd = this.state.grid.snap
      ? snapToGrid(world, this.state.grid.tileSize)
      : world;
    const delta = { x: snappedEnd.x - snappedStart.x, y: snappedEnd.y - snappedStart.y };

    if (Math.abs(delta.x) > 0 || Math.abs(delta.y) > 0) {
      this.bus.emit('move', { ids: this.dragState.ids, delta });
    }

    this.dragState = null;
  }

  private handleWheel(
    _pointer: Phaser.Input.Pointer,
    _objects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ): void {
    const camera = this.cameras.main;
    const nextZoom = Phaser.Math.Clamp(camera.zoom + (deltaY < 0 ? 0.1 : -0.1), 0.35, 2.6);
    camera.setZoom(nextZoom);
    this.emitCamera();
    this.render();
  }

  private worldPoint(pointer: Phaser.Input.Pointer): { x: number; y: number } {
    const point = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
    if (!this.state.grid.snap) {
      return { x: point.x, y: point.y };
    }

    return snapToGrid(point, this.state.grid.tileSize);
  }

  private emitCamera(): void {
    const camera = this.cameras?.main;
    if (!camera) {
      return;
    }

    this.bus.emit('camera', { x: camera.scrollX, y: camera.scrollY, zoom: camera.zoom });
  }

  private hitTest(x: number, y: number): LevelObject | null {
    const objects = getLevelObjects(this.state.level)
      .filter((object) => isObjectEditable(object, this.state.layers))
      .reverse();
    return (
      objects.find(
        (object) =>
          x >= object.x - object.width / 2 &&
          x <= object.x + object.width / 2 &&
          y >= object.y - object.height / 2 &&
          y <= object.y + object.height / 2
      ) ?? null
    );
  }

  private render(): void {
    if (!this.gridGraphics || !this.objectGraphics || !this.overlayGraphics) {
      return;
    }

    const width = this.state.level.world.widthTiles * this.state.level.world.tileSize;
    const height = this.state.level.world.heightTiles * this.state.level.world.tileSize;
    this.gridGraphics.clear();
    this.objectGraphics.clear();
    this.overlayGraphics.clear();

    this.gridGraphics.fillStyle(0xe7fbff, 1);
    this.gridGraphics.fillRect(0, 0, width, height);
    this.gridGraphics.lineStyle(4, 0x278b9d, 0.5);
    this.gridGraphics.strokeRect(0, 0, width, height);

    if (this.state.grid.visible) {
      const step = this.state.grid.tileSize * (this.cameras.main.zoom < 0.6 ? 2 : 1);
      this.gridGraphics.lineStyle(1, 0x6fb8c9, 0.28);
      for (let x = 0; x <= width; x += step) {
        this.gridGraphics.lineBetween(x, 0, x, height);
      }
      for (let y = 0; y <= height; y += step) {
        this.gridGraphics.lineBetween(0, y, width, y);
      }
    }

    for (const object of getLevelObjects(this.state.level)) {
      if (!object.visible || !this.state.layers[object.layer].visible) {
        continue;
      }
      this.drawObject(object);
    }

    this.drawSelectedPaths();

    for (const id of this.state.selectedIds) {
      const object = getLevelObjects(this.state.level).find((item) => item.id === id);
      if (object) {
        this.overlayGraphics.lineStyle(3, 0x1b5768, 0.95);
        this.overlayGraphics.strokeRect(
          object.x - object.width / 2 - 4,
          object.y - object.height / 2 - 4,
          object.width + 8,
          object.height + 8
        );
      }
    }
  }

  private drawObject(object: LevelObject): void {
    const color = colorForObject(object);
    const alpha = object.locked ? 0.38 : 0.92;
    if (object.layer === 'items' || object.layer === 'enemies' || object.type === 'playerSpawn') {
      this.objectGraphics.fillStyle(color, alpha);
      this.objectGraphics.fillCircle(object.x, object.y, Math.max(object.width, object.height) / 2);
      this.objectGraphics.lineStyle(2, 0xffffff, 0.75);
      this.objectGraphics.strokeCircle(object.x, object.y, Math.max(object.width, object.height) / 2);
      return;
    }

    if (object.type === 'windGateFinish') {
      this.objectGraphics.lineStyle(6, 0x69d2e7, alpha);
      this.objectGraphics.strokeRoundedRect(
        object.x - object.width / 2,
        object.y - object.height / 2,
        object.width,
        object.height,
        18
      );
      return;
    }

    this.objectGraphics.fillStyle(color, alpha);
    this.objectGraphics.fillRoundedRect(
      object.x - object.width / 2,
      object.y - object.height / 2,
      object.width,
      object.height,
      Math.min(8, object.height / 3)
    );
    this.objectGraphics.lineStyle(2, 0xffffff, 0.55);
    this.objectGraphics.strokeRoundedRect(
      object.x - object.width / 2,
      object.y - object.height / 2,
      object.width,
      object.height,
      Math.min(8, object.height / 3)
    );
  }

  private drawSelectedPaths(): void {
    for (const id of this.state.selectedIds) {
      const object = getLevelObjects(this.state.level).find((item) => item.id === id);
      if (!object || object.type !== 'movingBreezePlatform' || object.waypoints.length < 2) {
        continue;
      }

      this.overlayGraphics.lineStyle(3, object.mode === 'loop' ? 0x48c78e : 0x247ba0, 0.95);
      object.waypoints.forEach((waypoint, index) => {
        const next = object.waypoints[index + 1] ?? (object.mode === 'loop' ? object.waypoints[0] : null);
        this.overlayGraphics.fillStyle(0xffffff, 1);
        this.overlayGraphics.fillCircle(waypoint.x, waypoint.y, 6);
        this.overlayGraphics.lineStyle(2, 0x1b5768, 1);
        this.overlayGraphics.strokeCircle(waypoint.x, waypoint.y, 6);
        if (next) {
          this.overlayGraphics.lineBetween(waypoint.x, waypoint.y, next.x, next.y);
        }
      });
    }
  }
}

export function createEditorGame(
  parent: HTMLElement,
  bus: EditorEventBus,
  state: EditorState,
  size: { width: number; height: number }
): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    width: size.width,
    height: size.height,
    backgroundColor: '#c9f3ff',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: []
  });
  game.scene.add('EditorScene', new EditorScene(), true, { bus, state });
  return game;
}

function colorForObject(object: LevelObject): number {
  switch (object.layer) {
    case 'terrain':
      if (object.type === 'stoneRootBlock') return 0x8a9aa0;
      if (object.type === 'softCloudBlock' || object.type === 'oneWayCloudPlatform') return 0xf3fbff;
      return 0x66bd63;
    case 'platforms':
      return object.type === 'movingBreezePlatform' ? 0x7bd9e6 : 0xc9f6ff;
    case 'items':
      return object.type === 'breezeOrb' ? 0x50d9de : 0xffcd46;
    case 'enemies':
      return object.type === 'puffHopper' ? 0xdaf8ff : object.type === 'windWisp' ? 0x8de0f2 : 0x9dad58;
    case 'hazards':
      return object.type === 'gustVent' ? 0x79e1f0 : object.type === 'voidZone' ? 0x38485e : 0xaa72d3;
    case 'utilities':
      return object.type === 'playerSpawn' ? 0x4fc36e : object.type === 'windGateFinish' ? 0x70d4e8 : 0xffe17a;
    case 'decorations':
      return 0xb9e891;
  }
}

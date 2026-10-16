import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { physicsConfig } from '../config/physicsConfig';
import { didHitBlockFromBelow } from '../systems/headHit';
import { getArcadeBody } from '../utils/assertions';
import type { PlayerInput } from '../types';
import { MusicContactEpisodes, type MusicContactCandidate } from './contactEpisodes';

export interface MusicWorldChoice {
  id: string;
  label: string;
  midi?: number;
}

export interface MusicWorldState {
  choices: MusicWorldChoice[];
  selectedIds?: string[];
  completed: boolean;
  paused?: boolean;
  reducedMotion?: boolean;
}

export interface MusicWorldOptions {
  getState: () => MusicWorldState;
  onSelect: (id: string, episodeId: string) => void;
  onSafeReturn: () => void;
  onGate: () => void;
  onStatus: (message: string) => void;
  onInteraction: (type: 'fall' | 'invalid_contact' | 'ambiguous_contact') => void;
}

export type MusicControl = 'left' | 'right' | 'jump' | 'run';

interface MusicBlock {
  choice: MusicWorldChoice;
  object: Phaser.GameObjects.Rectangle;
  art: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  badge: Phaser.GameObjects.Text;
}

const EMPTY_INPUT: PlayerInput = {
  left: false, right: false, down: false, jumpDown: false, jumpPressed: false,
  jumpReleased: false, run: false, pausePressed: false, restartPressed: false
};
const MUSIC_ASSET_ROOT = `${(import.meta as ImportMeta & { env: { BASE_URL: string } }).env.BASE_URL}music-assets/raster/`;

export class MusicWorldScene extends Phaser.Scene {
  private player!: Player;
  private playerArt!: Phaser.GameObjects.Sprite;
  private blocks: MusicBlock[] = [];
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private blockGroup!: Phaser.Physics.Arcade.StaticGroup;
  private decor: Phaser.GameObjects.GameObject[] = [];
  private sky!: Phaser.GameObjects.Image;
  private islands!: Phaser.GameObjects.Image;
  private gate!: Phaser.GameObjects.Container;
  private gateLabel!: Phaser.GameObjects.Text;
  private gateLight!: Phaser.GameObjects.Graphics;
  private worldWidth = 960;
  private readonly groundY = 358;
  private readonly blockY = 244;
  private gateX = 820;
  private controls = new Set<MusicControl>();
  private jumpPressed = false;
  private jumpReleased = false;
  private candidates: MusicContactCandidate[] = [];
  private invalidCandidates = new Set<string>();
  private invalidEpisodes = new Set<string>();
  private interactions = { fall: 0, invalid_contact: 0, ambiguous_contact: 0 };
  private readonly episodes = new MusicContactEpisodes(`world-${Date.now().toString(36)}`);
  private choicesKey = '';
  private selectionKey = '';
  private wasPaused = false;
  private gateWasOpen = false;
  private enteredGate = false;
  private ready = false;
  private contactCount = 0;
  private lastContact: { id: string; episodeId: string } | null = null;

  constructor(private readonly options: MusicWorldOptions) {
    super({ key: 'MusicWorldScene' });
  }

  preload(): void {
    this.load.spritesheet('music-art-sprout', `${MUSIC_ASSET_ROOT}sprout-keyposes-strip.png`, {
      frameWidth: 256, frameHeight: 256
    });
    for (const name of ['platform-meadow', 'platform-cloud', 'tile-rune', 'tile-meadow',
      'light-seed', 'checkpoint-lantern', 'background-sky', 'background-islands']) {
      this.load.image(`music-art-${name}`, `${MUSIC_ASSET_ROOT}${name}.png`);
    }
  }

  create(): void {
    // Invisible, original-size textures keep Player's body/offset/pose contract intact.
    // The art is an independent follower, so PNG padding never becomes a collision body.
    const graphics = this.add.graphics();
    for (const state of ['idle', 'run', 'jump', 'fall', 'hurt', 'wall', 'crouch']) {
      graphics.clear().fillStyle(0x69ba60).fillRoundedRect(5, 8, 22, 34, 6);
      graphics.generateTexture(`sprout-${state}`, 32, 44);
    }
    graphics.destroy();

    this.sky = this.add.image(0, 0, 'music-art-background-sky').setScrollFactor(0).setDepth(-30);
    this.islands = this.add.image(0, 0, 'music-art-background-islands').setScrollFactor(0).setDepth(-25).setAlpha(0.34);
    this.ground = this.physics.add.staticGroup();
    this.blockGroup = this.physics.add.staticGroup();
    this.player = new Player(this, 132, this.groundY - 20);
    this.player.setVisible(false);
    this.player.setCheckpoint({ x: 132, y: this.groundY - 20 }, 'Glow Lantern');
    this.playerArt = this.add.sprite(132, this.groundY, 'music-art-sprout', 0)
      .setOrigin(0.5, 244 / 256).setDisplaySize(62, 62).setDepth(20);
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.blockGroup, (_player, object) => {
      const block = this.blocks.find((entry) => entry.object === object);
      if (!block) return;
      const playerBody = getArcadeBody(this.player);
      const blockBody = block.object.body as Phaser.Physics.Arcade.StaticBody;
      if (didHitBlockFromBelow(playerBody, blockBody)) {
        this.candidates.push({ id: block.choice.id,
          overlap: Math.min(playerBody.right, blockBody.right) - Math.max(playerBody.left, blockBody.left) });
      } else this.invalidCandidates.add(block.choice.id);
    });
    this.rebuildChoices();
    this.cameras.main.setBounds(0, 0, this.worldWidth, 480);
    this.cameras.main.startFollow(this.player, true, 1, 1);
    this.cameras.main.setDeadzone(Math.max(50, this.scale.width * 0.2), 480);
    this.resize();
    this.scale.on('resize', this.resize, this);
    this.events.once('shutdown', () => {
      this.clearInput();
      this.scale.off('resize', this.resize, this);
    });
    this.ready = true;
    this.options.onStatus('블록 아래에서 점프해 머리로 선택하세요. 떨어지면 등불로 돌아와 계속할 수 있어요.');
  }

  setControl(control: MusicControl, held: boolean): void {
    if (this.options.getState().paused) return;
    if (control === 'jump') {
      if (held && !this.controls.has(control)) {
        this.jumpPressed = true;
        // A release followed by a new press between frames starts a new jump.
        // A later release in that frame still cuts this new jump normally.
        this.jumpReleased = false;
      }
      if (!held && this.controls.has(control)) this.jumpReleased = true;
    }
    if (held) this.controls.add(control);
    else this.controls.delete(control);
  }

  clearInput(): void {
    this.controls.clear();
    this.jumpPressed = false;
    this.jumpReleased = false;
    this.candidates = [];
    this.invalidCandidates.clear();
    if (this.ready) getArcadeBody(this.player).setVelocityX(0);
  }

  safeReturn(reason: 'fall' | 'manual' = 'manual'): void {
    if (!this.ready) return;
    this.clearInput();
    this.episodes.clear();
    this.invalidEpisodes.clear();
    this.player.respawn();
    if (reason === 'fall') this.recordInteraction('fall');
    this.options.onSafeReturn();
    this.options.onStatus('Glow Lantern으로 돌아왔어요. 선택한 음과 진행은 그대로예요.');
  }

  getSnapshot() {
    const body = this.ready ? getArcadeBody(this.player) : null;
    return {
      ready: this.ready,
      player: body ? { x: this.player.x, y: this.player.y, left: body.left, right: body.right,
        top: body.top, bottom: body.bottom, velocityY: body.velocity.y, health: this.player.health,
        grounded: body.blocked.down || body.touching.down, width: body.width, height: body.height } : null,
      blocks: this.blocks.map(({ choice, object }) => ({ id: choice.id, label: choice.label,
        x: object.x, y: object.y, width: object.width, height: object.height })),
      gate: { x: this.gateX, open: this.options.getState().completed },
      worldWidth: this.worldWidth,
      paused: Boolean(this.options.getState().paused),
      camera: { x: this.cameras?.main?.scrollX ?? 0, width: this.scale?.width ?? 0 },
      physics: { gravityY: physicsConfig.gravityY },
      contacts: { count: this.contactCount, last: this.lastContact ? { ...this.lastContact } : null },
      interactions: { ...this.interactions }
    };
  }

  update(time: number, delta: number): void {
    if (!this.ready) return;
    const state = this.options.getState();
    if (this.getChoicesKey(state) !== this.choicesKey) this.rebuildChoices();
    const paused = Boolean(state.paused);
    if (paused !== this.wasPaused) {
      if (paused) {
        this.clearInput();
        this.physics.world.pause();
      } else {
        // React may deliver an intentional new keydown before this next frame.
        // Entry already flushed the old input; preserve fresh input on resume.
        this.physics.world.resume();
      }
      this.wasPaused = paused;
    }
    this.updateSelection(state);
    this.updateGate(state.completed);
    if (paused) return;

    const body = getArcadeBody(this.player);
    const touching = new Set(this.blocks.filter(({ object }) => {
      const blockBody = object.body as Phaser.Physics.Arcade.StaticBody;
      return body.right >= blockBody.left - 4 && body.left <= blockBody.right + 4 &&
        body.top <= blockBody.bottom + 4 && body.bottom >= blockBody.top - 4;
    }).map(({ choice }) => choice.id));
    this.episodes.releaseSeparated(touching);
    for (const id of this.invalidEpisodes) if (!touching.has(id)) this.invalidEpisodes.delete(id);
    const headIds = new Set(this.candidates.map(candidate => candidate.id));
    for (const id of this.invalidCandidates) {
      if (!headIds.has(id) && !this.episodes.isActive(id) && !this.invalidEpisodes.has(id)) {
        this.invalidEpisodes.add(id);
        this.recordInteraction('invalid_contact');
      }
    }
    this.invalidCandidates.clear();
    const resolution = this.episodes.acceptDetailed(this.candidates);
    if (resolution.ambiguous) this.recordInteraction('ambiguous_contact');
    const contact = resolution.contact;
    this.candidates = [];
    if (contact) {
      this.contactCount += 1;
      this.lastContact = { ...contact };
      this.options.onSelect(contact.id, contact.episodeId);
      const block = this.blocks.find(({ choice }) => choice.id === contact.id);
      if (block && !state.reducedMotion) {
        this.tweens.add({ targets: [block.art, block.label], y: '-=6', duration: 85, yoyo: true });
      }
    }

    this.player.updateFromInput({ ...EMPTY_INPUT,
      left: this.controls.has('left'), right: this.controls.has('right'), run: this.controls.has('run'),
      jumpDown: this.controls.has('jump'), jumpPressed: this.jumpPressed, jumpReleased: this.jumpReleased
    }, time, Math.min(delta, 50));
    this.jumpPressed = false;
    this.jumpReleased = false;
    const onGround = body.blocked.down || body.touching.down;
    const frame = !onGround ? (body.velocity.y < -20 ? 3 : 4) : Math.abs(body.velocity.x) > 20 ?
      (state.reducedMotion ? 1 : 1 + (Math.floor(time / 140) % 2)) : 0;
    this.playerArt.setPosition(body.center.x, body.bottom + 2).setFrame(frame).setFlipX(this.player.facing < 0)
      .setDisplaySize(62 * this.player.scaleX, 62 * this.player.scaleY);
    if (body.top > 520 || this.player.x < -100 || this.player.x > this.worldWidth + 100) this.safeReturn('fall');
    if (state.completed && !this.enteredGate && Math.abs(this.player.x - this.gateX) < 34 && body.bottom > this.groundY - 55) {
      this.enteredGate = true;
      this.clearInput();
      this.options.onGate();
    }
  }

  private getChoicesKey(state: MusicWorldState): string {
    return JSON.stringify(state.choices.map(({ id, label, midi }) => [id, label, midi]));
  }

  private recordInteraction(type: 'fall' | 'invalid_contact' | 'ambiguous_contact'): void {
    this.interactions[type] += 1;
    this.options.onInteraction(type);
  }

  private rebuildChoices(): void {
    const state = this.options.getState();
    this.choicesKey = this.getChoicesKey(state);
    this.selectionKey = '';
    this.ground.clear(true, true);
    this.blockGroup.clear(true, true);
    for (const item of this.decor) item.destroy();
    for (const block of this.blocks) { block.art.destroy(); block.label.destroy(); block.badge.destroy(); }
    this.blocks = [];
    this.decor = [];
    this.gate?.destroy(true);
    this.episodes.clear();
    this.invalidEpisodes.clear();
    this.clearInput();
    this.worldWidth = Math.max(960, state.choices.length * 148 + 440);
    this.gateX = Math.max(800, state.choices.length * 148 + 310);
    this.enteredGate = false;
    this.gateWasOpen = !state.completed;

    const ground = this.add.rectangle(this.worldWidth / 2, this.groundY + 12, this.worldWidth - 112, 24, 0x6b9751, 0);
    this.ground.add(ground);
    for (let x = 300; x < this.worldWidth + 180; x += 460) {
      const island = this.add.image(x, this.groundY - 1, 'music-art-platform-meadow')
        .setOrigin(0.5, 0.24).setDisplaySize(560, 560 * 448 / 960).setDepth(2);
      this.decor.push(island);
    }
    const lantern = this.add.image(100, this.groundY + 5, 'music-art-checkpoint-lantern')
      .setOrigin(0.5, 0.9).setDisplaySize(64, 64).setDepth(8);
    const lanternLabel = this.add.text(100, this.groundY + 24, '안전 등불', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#174b50', backgroundColor: '#fffef5', padding: { x: 6, y: 4 }
    }).setOrigin(0.5).setDepth(8);
    this.decor.push(lantern, lanternLabel);

    for (const [index, choice] of state.choices.entries()) {
      const x = 260 + index * 148;
      const object = this.add.rectangle(x, this.blockY, 64, 48, 0xfff0af, 1).setStrokeStyle(2, 0x756029).setDepth(4);
      this.blockGroup.add(object);
      object.setData('musicBlockId', choice.id);
      const art = this.add.image(x, this.blockY, 'music-art-tile-rune').setDisplaySize(78, 78).setDepth(5);
      const label = this.add.text(x, this.blockY - 52, choice.label, {
        fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: choice.label.length > 20 ? '13px' : '16px',
        color: '#174b50', backgroundColor: '#fffef5', align: 'center',
        padding: { x: 9, y: 7 }, wordWrap: { width: 125 }
      }).setOrigin(0.5, 1).setDepth(8);
      const badge = this.add.text(x, this.blockY + 1, String(index + 1), {
        fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#174b50',
        backgroundColor: '#fff9db', padding: { x: 6, y: 1 }
      }).setOrigin(0.5).setDepth(8);
      this.blocks.push({ choice, object, art, label, badge });
    }
    this.gateLight = this.add.graphics();
    this.gateLabel = this.add.text(0, -115, '', { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold',
      color: '#174b50', backgroundColor: '#fffef5', padding: { x: 9, y: 6 } }).setOrigin(0.5);
    const seed = this.add.image(0, -53, 'music-art-light-seed').setDisplaySize(42, 42);
    this.gate = this.add.container(this.gateX, this.groundY, [this.gateLight, seed, this.gateLabel]).setDepth(7);
    this.player.respawn();
    this.cameras.main.setBounds(0, 0, this.worldWidth, 480);
    this.updateSelection(state);
    this.updateGate(state.completed);
  }

  private updateSelection(state: MusicWorldState): void {
    const key = JSON.stringify(state.selectedIds ?? []);
    if (key === this.selectionKey) return;
    this.selectionKey = key;
    for (const [index, block] of this.blocks.entries()) {
      const selected = state.selectedIds?.includes(block.choice.id);
      block.badge.setText(selected ? '✓' : String(index + 1));
      block.object.setStrokeStyle(selected ? 4 : 2, selected ? 0x347652 : 0x756029);
    }
  }

  private updateGate(open: boolean): void {
    if (open === this.gateWasOpen) return;
    this.gateWasOpen = open;
    this.gateLight.clear();
    this.gateLight.lineStyle(7, open ? 0x4bba94 : 0x94a3a0, 1).strokeRoundedRect(-31, -100, 62, 100, 27);
    this.gateLight.lineStyle(3, 0xffffff, 0.9).strokeRoundedRect(-23, -92, 46, 90, 22);
    if (!open) this.gateLight.lineStyle(3, 0x64766c, 0.85).lineBetween(-20, -57, 20, -57);
    this.gateLabel.setText(open ? '✓ 바람문 열림' : '목표를 완성하면 열려요');
  }

  private resize(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const coverWidth = Math.max(width, height * 1.5);
    this.sky.setPosition(width / 2, height / 2).setDisplaySize(coverWidth, coverWidth / 1.5);
    this.islands.setPosition(width / 2, height / 2 + 45).setDisplaySize(coverWidth, coverWidth / 1.5);
    this.cameras.main.setDeadzone(Math.max(50, width * 0.2), 480);
  }
}

export function createMusicWorldGame(host: HTMLElement, scene: MusicWorldScene): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.CANVAS, parent: host, width: host.clientWidth || 960, height: host.clientHeight || 440,
    backgroundColor: '#bfe8ef', roundPixels: true,
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { keyboard: false },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: physicsConfig.gravityY }, debug: false } },
    scene: [scene],
    audio: { noAudio: true }
  });
}

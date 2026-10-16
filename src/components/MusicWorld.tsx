import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { MusicControl, MusicWorldChoice, MusicWorldScene } from '../game/music/MusicWorldScene';
import './MusicWorld.css';

export interface MusicWorldProps {
  choices: MusicWorldChoice[];
  selectedIds?: string[];
  completed: boolean;
  paused?: boolean;
  pauseLabel?: string;
  reducedMotion?: boolean;
  onSelect: (id: string, episodeId: string) => void;
  onSafeReturn?: () => void;
  onGate?: () => void;
  onInteraction?: (type: 'fall' | 'invalid_contact' | 'ambiguous_contact') => void;
}

declare global {
  interface Window {
    __MUSIC_WORLD__?: { game: Phaser.Game; scene: MusicWorldScene; getSnapshot: () => ReturnType<MusicWorldScene['getSnapshot']> };
  }
}

const KEY_CONTROLS: Record<string, MusicControl> = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', ShiftLeft: 'run', ShiftRight: 'run'
};

export function MusicWorld(props: MusicWorldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MusicWorldScene | null>(null);
  const latest = useRef(props);
  latest.current = props;
  const [status, setStatus] = useState('하늘 정원을 준비하고 있어요…');

  useEffect(() => {
    const host = hostRef.current;
    const region = regionRef.current;
    if (!host || !region) return;
    let disposed = false;
    let game: Phaser.Game | undefined;
    const pressedKeys = new Set<string>();
    const release = () => { pressedKeys.clear(); sceneRef.current?.clearInput(); };
    const ownsKeyboard = (target: EventTarget | null) => target === region || target === host || target === game?.canvas;
    const keydown = (event: KeyboardEvent) => {
      const control = KEY_CONTROLS[event.code];
      if (!control || !ownsKeyboard(event.target) || latest.current.paused) return;
      event.preventDefault();
      if (event.repeat || pressedKeys.has(event.code)) return;
      pressedKeys.add(event.code);
      sceneRef.current?.setControl(control, true);
    };
    const keyup = (event: KeyboardEvent) => {
      const control = KEY_CONTROLS[event.code];
      if (!control || !pressedKeys.delete(event.code)) return;
      event.preventDefault();
      const stillHeld = [...pressedKeys].some((code) => KEY_CONTROLS[code] === control);
      if (!stillHeld) sceneRef.current?.setControl(control, false);
    };
    const focusout = (event: FocusEvent) => {
      if (!ownsKeyboard(event.relatedTarget)) release();
    };
    const visibility = () => { if (document.hidden) release(); };
    region.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    region.addEventListener('focusout', focusout);
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', visibility);
    void import('../game/music/MusicWorldScene').then(({ MusicWorldScene, createMusicWorldGame }) => {
      if (disposed) return;
      const scene = new MusicWorldScene({
        getState: () => latest.current,
        onSelect: (id, episode) => latest.current.onSelect(id, episode),
        onSafeReturn: () => latest.current.onSafeReturn?.(),
        onGate: () => latest.current.onGate?.(),
        onInteraction: type => latest.current.onInteraction?.(type),
        onStatus: setStatus
      });
      sceneRef.current = scene;
      game = createMusicWorldGame(host, scene);
      game.canvas.setAttribute('aria-hidden', 'true');
      if ((import.meta as ImportMeta & { env: { DEV: boolean } }).env.DEV || new URLSearchParams(window.location.search).has('music-test')) {
        window.__MUSIC_WORLD__ = { game, scene, getSnapshot: () => scene.getSnapshot() };
      }
    });
    return () => {
      disposed = true;
      release();
      region.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      region.removeEventListener('focusout', focusout);
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', visibility);
      if (window.__MUSIC_WORLD__?.game === game) delete window.__MUSIC_WORLD__;
      game?.destroy(true);
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => { if (props.paused) sceneRef.current?.clearInput(); }, [props.paused]);

  const press = (event: PointerEvent<HTMLButtonElement>, control: MusicControl) => {
    if (props.paused) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    sceneRef.current?.setControl(control, true);
  };
  const release = (event: PointerEvent<HTMLButtonElement>, control: MusicControl) => {
    sceneRef.current?.setControl(control, false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const controlButton = (control: MusicControl, label: string, content: string, className = '') => (
    <button type="button" className={`music-move ${className}`} aria-label={label} disabled={props.paused}
      onPointerDown={(event) => press(event, control)}
      onPointerUp={(event) => release(event, control)}
      onPointerCancel={(event) => release(event, control)}
      onLostPointerCapture={() => sceneRef.current?.setControl(control, false)}
      onKeyDown={(event) => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          if (!event.repeat) sceneRef.current?.setControl(control, true);
        }
      }}
      onKeyUp={(event) => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); sceneRef.current?.setControl(control, false); } }}
      onBlur={() => sceneRef.current?.setControl(control, false)}>{content}</button>
  );

  return <section className="music-world" aria-label="새싹 음악 연습 섬">
    <div className="music-world-topline"><span>✦ 머리로 톡, 음악으로 한 걸음</span><span>{props.completed ? '✓ 바람문 열림' : '시간 제한 없는 연습'}</span></div>
    <div ref={regionRef} className="music-world-stage" tabIndex={0} role="group"
      aria-label="점프 연습 영역. 좌우 방향키로 이동, 스페이스나 위 방향키로 점프합니다."
      aria-describedby="music-world-instructions" data-testid="music-world-focus"
      onPointerDown={(event) => { if ((event.target as HTMLElement).tagName === 'CANVAS') regionRef.current?.focus(); }}>
      <div className="music-world-canvas" ref={hostRef} data-testid="music-world" />
      {props.paused && <div className="music-world-paused">{props.pauseLabel ?? '일시정지 · 진행은 그대로예요'}</div>}
    </div>
    <div className="music-world-controls" aria-label="새싹 이동 조작">
      <div className="music-direction-controls">{controlButton('left', '왼쪽으로 이동', '←')}{controlButton('right', '오른쪽으로 이동', '→')}</div>
      <button className="music-return" type="button" onClick={() => sceneRef.current?.safeReturn()} disabled={props.paused}>등불로 돌아오기</button>
      {controlButton('jump', '점프', '↑ 점프', 'music-jump')}
    </div>
    <p id="music-world-instructions" className="music-world-instructions">영역을 선택한 뒤 ← → 이동 · Space 점프 · Shift 달리기. 블록은 여러 번 칠 수 있어요.</p>
    <p className="music-world-status" role="status" aria-live="polite">{status}</p>
  </section>;
}

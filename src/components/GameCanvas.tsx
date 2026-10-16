import { useEffect, useRef } from 'react';
import type { LevelData as EditorLevelData } from '../game/data/LevelData';
import type { LevelData as RuntimeLevelData } from '../game/types';

interface GameCanvasProps {
  level?: EditorLevelData | RuntimeLevelData;
  skipMenu?: boolean;
  testPlay?: boolean;
  onReturnToEditor?: () => void;
}

export function GameCanvas({ level, skipMenu = false, testPlay = false, onReturnToEditor }: GameCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!hostRef.current || gameRef.current) {
      return;
    }

    let cancelled = false;
    const host = hostRef.current;
    window.__SKY_SPROUT_LAUNCH = { level, skipMenu, testPlay };
    const handleReturn = () => onReturnToEditor?.();
    const handleTestPlayKeyDown = (event: KeyboardEvent) => {
      if (!testPlay) {
        return;
      }

      if (event.key === 'Escape' || event.key.toLowerCase() === 'p') {
        event.preventDefault();
        handleReturn();
      }
    };
    window.addEventListener('sky-sprout:return-editor', handleReturn);
    window.addEventListener('keydown', handleTestPlayKeyDown);

    void import('../game/GameRoot').then(({ createGame }) => {
      if (cancelled || gameRef.current) {
        return;
      }

      gameRef.current = createGame(host);
    });

    return () => {
      cancelled = true;
      window.removeEventListener('sky-sprout:return-editor', handleReturn);
      window.removeEventListener('keydown', handleTestPlayKeyDown);
      delete window.__SKY_SPROUT_LAUNCH;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [level, onReturnToEditor, skipMenu, testPlay]);

  return <div className="game-canvas-host" ref={hostRef} data-testid="game-host" />;
}

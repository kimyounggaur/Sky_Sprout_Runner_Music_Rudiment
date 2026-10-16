import { useEffect, useMemo, useState } from 'react';
import { ControlsHelp } from './components/ControlsHelp';
import { GameCanvas } from './components/GameCanvas';
import { LandingPanel } from './components/LandingPanel';
import { EditorRoot } from './editor/EditorRoot';
import { LevelListPanel } from './editor/components/LevelListPanel';
import { createLevelFromTemplate } from './editor/data/levelTemplates';
import { EditorPersistenceSystem } from './editor/systems/EditorPersistenceSystem';
import { safeLevelFileName } from './editor/systems/EditorSerializationSystem';
import type { LevelData } from './game/data/LevelData';
import { MusicApp } from './components/MusicApp';
import type { Exercise } from './game/music/domain';
import { MUSIC_ENABLED } from './game/music/feature';

type AppMode = 'menu' | 'story' | 'editor' | 'levels' | 'music';
type MenuPanel = 'controls' | 'credits' | null;

export default function App() {
  const persistence = useMemo(() => new EditorPersistenceSystem(), []);
  const [mode, setMode] = useState<AppMode>('menu');
  const [currentLevel, setCurrentLevel] = useState<LevelData | undefined>();
  const [playtestLevel, setPlaytestLevel] = useState<LevelData | null>(null);
  const [levelsVersion, setLevelsVersion] = useState(0);
  const [menuPanel, setMenuPanel] = useState<MenuPanel>(null);
  const [musicEditorOpen, setMusicEditorOpen] = useState(false);
  const [musicPlaytest, setMusicPlaytest] = useState<Exercise | null>(null);
  const savedLevels = useMemo(() => persistence.listLevels(), [persistence, levelsVersion]);

  useEffect(() => {
    const handleComplete = (event: Event) => {
      const detail = (event as CustomEvent<{ levelId?: string; score?: number; elapsedSeconds?: number }>).detail;
      if (!detail?.levelId || typeof detail.score !== 'number' || typeof detail.elapsedSeconds !== 'number') {
        return;
      }

      persistence.recordPlayResult(detail.levelId, {
        cleared: true,
        elapsedSeconds: detail.elapsedSeconds,
        score: detail.score
      });
      setLevelsVersion((version) => version + 1);
    };

    window.addEventListener('sky-sprout:level-complete', handleComplete);
    return () => window.removeEventListener('sky-sprout:level-complete', handleComplete);
  }, [persistence]);

  const exportSavedLevel = (levelId: string) => {
    const json = persistence.exportLevel(levelId);
    const level = persistence.loadLevel(levelId);
    if (!json || !level) {
      return;
    }

    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = safeLevelFileName(level.name);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <main className="app-shell" aria-label="Sky Sprout Runner game">
      <LandingPanel />
      {mode === 'menu' ? (
        <section className="main-menu" aria-label="Main menu">
          <img className="menu-sprout" src={`${import.meta.env.BASE_URL}music-assets/raster/sprout-idle.png`} alt="작은 새싹 Sprout" />
          <h1>Sky Sprout Runner</h1>
          <p className="menu-subtitle">구름길을 뛰어넘고, 나만의 음악을 키워 보세요.</p>
          <div className="main-menu__actions">
            {MUSIC_ENABLED && <button type="button" className="menu-music-start" onClick={() => setMode('music')}>음악 정원 시작 <span>♪</span></button>}
            <button
              type="button"
              onClick={() => {
                setCurrentLevel(undefined);
                setMode('story');
              }}
            >
              Play Story
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentLevel(createLevelFromTemplate('emptyIsland'));
                setMode('editor');
              }}
            >
              Create Level
            </button>
            <button
              type="button"
              onClick={() => {
                setLevelsVersion((version) => version + 1);
                setMode('levels');
              }}
            >
              My Levels
            </button>
            <button type="button" onClick={() => setMenuPanel('controls')}>
              Controls
            </button>
            <button type="button" onClick={() => setMenuPanel('credits')}>
              Credits
            </button>
          </div>
          {menuPanel ? (
            <div
              className="menu-modal"
              role="dialog"
              aria-modal="true"
              aria-label={menuPanel === 'controls' ? 'Controls' : 'Credits'}
            >
              <div className="menu-modal__body">
                {menuPanel === 'controls' ? (
                  <>
                    <h2>Controls</h2>
                    <p>Move with arrow keys or A and D. Jump with Space, W, or Up.</p>
                    <p>Hold Shift to run. Press P or Escape to pause. Press R to restart.</p>
                  </>
                ) : (
                  <>
                    <h2>Credits</h2>
                    <p>Sky Sprout Runner is an original cloud-island platformer prototype.</p>
                    <p>Built with React, Phaser, and the Sky Forge level editor.</p>
                  </>
                )}
                <button type="button" onClick={() => setMenuPanel(null)}>
                  Close
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {mode === 'story' ? currentLevel?.music?.exercises[0] ? MUSIC_ENABLED ? <MusicApp initialExercises={currentLevel.music.exercises} onBack={() => setMode('menu')} /> : <section className="main-menu"><h2>음악 기능이 꺼져 있어요</h2><p>이 레벨의 음악 활동과 학습 기록은 그대로 보존했습니다.</p><button type="button" onClick={() => setMode('menu')}>메뉴로</button></section> : <GameCanvas skipMenu level={currentLevel} /> : null}

      {mode === 'music' ? <MusicApp onBack={() => setMode('menu')} onEditor={() => { setCurrentLevel(createLevelFromTemplate('emptyIsland')); setMusicEditorOpen(true); setMode('editor'); }} /> : null}

      {mode === 'editor' ? (
        <EditorRoot
          initialLevel={currentLevel}
          initialMusicOpen={musicEditorOpen}
          onMusicTest={setMusicPlaytest}
          onBack={() => {
            setLevelsVersion((version) => version + 1);
            setMode('menu');
            setMusicEditorOpen(false);
          }}
          onTestPlay={(level) => {
            setCurrentLevel(level);
            if (MUSIC_ENABLED && level.music?.exercises[0]) setMusicPlaytest(level.music.exercises[0]);
            else setPlaytestLevel(level);
          }}
          onStateChange={(editorState) => setCurrentLevel(editorState.level)}
        />
      ) : null}

      {musicPlaytest ? <div className="playtest-layer"><MusicApp previewOnly initialExercise={musicPlaytest} onBack={() => setMusicPlaytest(null)} /></div> : null}

      {playtestLevel ? (
        <div className="playtest-layer">
          <GameCanvas
            skipMenu
            testPlay
            level={playtestLevel}
            onReturnToEditor={() => setPlaytestLevel(null)}
          />
        </div>
      ) : null}

      {mode === 'levels' ? (
        <LevelListPanel
          levels={savedLevels}
          onBack={() => setMode('menu')}
          onEdit={(levelId) => {
            const level = persistence.loadLevel(levelId);
            if (level) {
              setCurrentLevel(level);
              setMode('editor');
            }
          }}
          onPlay={(levelId) => {
            const level = persistence.loadLevel(levelId);
            if (level) {
              setCurrentLevel(level);
              setMode('story');
            }
          }}
          onDuplicate={(levelId) => {
            persistence.duplicateLevel(levelId);
            setLevelsVersion((version) => version + 1);
          }}
          onExport={exportSavedLevel}
          onDelete={(levelId) => {
            persistence.deleteLevel(levelId);
            setLevelsVersion((version) => version + 1);
          }}
          onImport={(file) => {
            void file.text().then((json) => {
              persistence.importLevel(json);
              setLevelsVersion((version) => version + 1);
            });
          }}
        />
      ) : null}

      {mode === 'menu' ? <ControlsHelp /> : null}
    </main>
  );
}

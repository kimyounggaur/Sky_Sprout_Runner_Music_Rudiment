import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type Phaser from 'phaser';
import type { EditorLayer, LevelData, LevelObject, PlatformData } from '../game/data/LevelData';
import { getLevelObjects } from '../game/data/LevelData';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/config/constants';
import { DeleteObjectCommand } from './commands/DeleteObjectCommand';
import { DuplicateObjectCommand } from './commands/DuplicateObjectCommand';
import { ApplyLevelCommand } from './commands/ApplyLevelCommand';
import type { EditorCommand } from './commands/EditorCommand';
import { MoveObjectCommand } from './commands/MoveObjectCommand';
import { PlaceObjectCommand } from './commands/PlaceObjectCommand';
import { UpdateObjectCommand } from './commands/UpdateObjectCommand';
import { EditorEventBus } from './EditorEventBus';
import { EditorShell } from './components/EditorShell';
import { LevelSettingsDialog } from './components/LevelSettingsDialog';
import { ShortcutHelpDialog } from './components/ShortcutHelpDialog';
import type { CatalogCategory } from './data/objectCatalog';
import { getCatalogItem } from './data/objectCatalog';
import { createLevelFromTemplate } from './data/levelTemplates';
import type { EditorState, EditorTool, ValidationResult } from './schemas/levelDefaults';
import { createEditorState, markDirty } from './schemas/levelDefaults';
import {
  addWaypoint,
  alignObjects,
  distributeObjects,
  updateLayerState,
  updateManyObjects,
  type Alignment,
  type DistributionAxis
} from './systems/EditorAdvancedTools';
import { EditorCommandStack } from './systems/EditorCommandStack';
import { EditorPersistenceSystem } from './systems/EditorPersistenceSystem';
import { safeLevelFileName, serializeLevel } from './systems/EditorSerializationSystem';
import { validateEditorLevel } from './systems/EditorValidationSystem';
import { findLevelObject } from './utils/levelObjects';
import { MusicEditor } from './components/MusicEditor';
import type { Exercise } from '../game/music/domain';

interface EditorRootProps {
  initialLevel?: LevelData;
  onBack: () => void;
  onTestPlay: (level: LevelData) => void;
  onStateChange?: (state: EditorState) => void;
  initialMusicOpen?: boolean;
  onMusicTest?: (exercise: Exercise) => void;
}

export function EditorRoot({ initialLevel, onBack, onTestPlay, onStateChange, initialMusicOpen = false, onMusicTest }: EditorRootProps) {
  const [state, setState] = useState(() =>
    createEditorState(initialLevel ?? createLevelFromTemplate('emptyIsland'))
  );
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Unsaved' | 'Autosaved'>('Unsaved');
  const [activeCategory, setActiveCategory] = useState<CatalogCategory>('terrain');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(initialMusicOpen);
  const busRef = useRef(new EditorEventBus());
  const stackRef = useRef(new EditorCommandStack());
  const gameRef = useRef<Phaser.Game | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const initialSceneStateRef = useRef(state);
  const onStateChangeRef = useRef(onStateChange);
  const persistence = useMemo(() => new EditorPersistenceSystem(), []);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  const publishState = useCallback((next: EditorState) => {
    busRef.current.emit('state:changed', next);
    onStateChangeRef.current?.(next);
  }, []);

  const setAndPublish = useCallback(
    (updater: (previous: EditorState) => EditorState) => {
      setState((previous) => {
        return updater(previous);
      });
    },
    []
  );

  const execute = useCallback(
    (command: EditorCommand) => {
      setAndPublish((previous) => {
        return stackRef.current.execute(previous, command);
      });
      setSaveStatus('Unsaved');
    },
    [setAndPublish]
  );

  const saveLevel = useCallback(() => {
    setAndPublish((previous) => {
      const saved = persistence.saveLevel(previous.level);
      persistence.saveThumbnail(saved.id, `thumb://generated/${saved.id}`);
      const next = { ...previous, level: saved, dirty: false };
      return next;
    });
    setSaveStatus('Saved');
  }, [persistence, setAndPublish]);

  useEffect(() => {
    if (!hostRef.current || gameRef.current) {
      return;
    }

    let cancelled = false;
    const host = hostRef.current;
    void import('./scenes/EditorScene').then(
      ({ createEditorGame }) => {
        if (cancelled || gameRef.current) {
          return;
        }

        const game = createEditorGame(host, busRef.current, initialSceneStateRef.current, {
          width: GAME_WIDTH,
          height: GAME_HEIGHT
        });
        gameRef.current = game;
        publishState(initialSceneStateRef.current);
      }
    );

    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [publishState]);

  useEffect(() => {
    const bus = busRef.current;
    const unsubscribers = [
      bus.on('place', ({ x, y }) => {
        const item = getCatalogItem(state.activePaletteItemId ?? 'skyGrassBlock');
        if (!item) {
          return;
        }
        if (state.layers[item.category].locked || !state.layers[item.category].visible) {
          return;
        }

        const object = item.createObject(x, y, state.grid.tileSize);
        const duplicate = getLevelObjects(state.level).some(
          (existing) =>
            existing.type === object.type &&
            existing.layer === object.layer &&
            Math.abs(existing.x - object.x) < 1 &&
            Math.abs(existing.y - object.y) < 1
        );
        if (duplicate && object.type !== 'playerSpawn' && object.type !== 'windGateFinish') {
          return;
        }

        execute(new PlaceObjectCommand(object));
      }),
      bus.on('select', ({ ids }) => {
        setAndPublish((previous) => ({ ...previous, selectedIds: ids }));
      }),
      bus.on('move', ({ ids, delta }) => execute(new MoveObjectCommand(ids, delta))),
      bus.on('delete', ({ ids }) => execute(new DeleteObjectCommand(ids))),
      bus.on('path:addWaypoint', ({ x, y }) => {
        const object =
          state.selectedIds.length === 1 ? findLevelObject(state.level, state.selectedIds[0]) : null;
        if (!object || object.type !== 'movingBreezePlatform') {
          return;
        }

        const nextPlatform = addWaypoint(object as PlatformData, { x, y });
        execute(new UpdateObjectCommand(object.id, { waypoints: nextPlatform.waypoints } as Partial<LevelObject>));
      }),
      bus.on('cursor', () => undefined),
      bus.on('camera', (camera) => {
        setState((previous) => ({ ...previous, camera }));
      })
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [
    execute,
    setAndPublish,
    state.activePaletteItemId,
    state.grid.tileSize,
    state.layers,
    state.level,
    state.selectedIds
  ]);

  useEffect(() => {
    publishState(state);
  }, [publishState, state]);

  useEffect(() => {
    if (!state.dirty) {
      return;
    }

    const id = window.setInterval(() => {
      persistence.autosaveDraft(state.level);
      setSaveStatus('Autosaved');
    }, 30_000);

    return () => window.clearInterval(id);
  }, [persistence, state.dirty, state.level]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (musicOpen || settingsOpen || helpOpen || (event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)))) return;
      const meta = event.ctrlKey || event.metaKey;
      if (meta && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveLevel();
        return;
      }
      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        setAndPublish((previous) =>
          event.shiftKey ? stackRef.current.redo(previous) : stackRef.current.undo(previous)
        );
        return;
      }
      if (meta && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        setAndPublish((previous) => stackRef.current.redo(previous));
        return;
      }
      if (meta && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        duplicateSelection();
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        deleteSelection();
        return;
      }
      const toolByKey: Record<string, EditorTool> = {
        v: 'select',
        b: 'brush',
        e: 'erase',
        r: 'rectangle',
        h: 'pan',
        p: 'path'
      };
      const key = event.key.toLowerCase();
      if (toolByKey[key]) {
        setTool(toolByKey[key]);
      } else if (key === 't') {
        onTestPlay(state.level);
      } else if (key === 'g') {
        setAndPublish((previous) => ({
          ...previous,
          grid: { ...previous.grid, visible: !previous.grid.visible }
        }));
      } else if (key === 's' && !meta) {
        setAndPublish((previous) => ({
          ...previous,
          grid: { ...previous.grid, snap: !previous.grid.snap }
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const setTool = (tool: EditorTool) => {
    setAndPublish((previous) => ({ ...previous, activeTool: tool }));
  };

  const applyLevelEdit = (label: string, level: LevelData, selectedIds = state.selectedIds) => {
    execute(new ApplyLevelCommand(label, level, selectedIds));
  };

  const validate = () => {
    setAndPublish((previous) => ({
      ...previous,
      validationResults: validateEditorLevel(previous.level)
    }));
  };

  const selectedObject =
    state.selectedIds.length === 1 ? findLevelObject(state.level, state.selectedIds[0]) : null;

  const duplicateSelection = () => {
    if (state.selectedIds.length > 0) {
      execute(new DuplicateObjectCommand(state.selectedIds, { x: state.grid.tileSize, y: 0 }));
    }
  };

  const deleteSelection = () => {
    if (state.selectedIds.length > 0) {
      execute(new DeleteObjectCommand(state.selectedIds));
    }
  };

  const exportLevel = () => {
    const blob = new Blob([serializeLevel(state.level)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = safeLevelFileName(state.level.name);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const updateLevel = (level: LevelData) => {
    setAndPublish((previous) => markDirty({ ...previous, level }));
    setSaveStatus('Unsaved');
  };

  const updateLayers = (
    layerId: EditorLayer,
    changes: Partial<{ visible: boolean; locked: boolean; active: boolean }>
  ) => {
    setAndPublish((previous) => ({
      ...previous,
      layers: updateLayerState(previous.layers, layerId, changes),
      selectedIds:
        changes.visible === false || changes.locked === true
          ? previous.selectedIds.filter((id) => findLevelObject(previous.level, id)?.layer !== layerId)
          : previous.selectedIds
    }));
  };

  const updateManySelected = (changes: Partial<LevelObject>) => {
    if (state.selectedIds.length < 2) {
      return;
    }
    applyLevelEdit('Update selection', updateManyObjects(state.level, state.selectedIds, changes));
  };

  const alignSelection = (alignment: Alignment) => {
    applyLevelEdit('Align selection', alignObjects(state.level, state.selectedIds, alignment));
  };

  const distributeSelection = (axis: DistributionAxis) => {
    applyLevelEdit('Distribute selection', distributeObjects(state.level, state.selectedIds, axis));
  };

  return (
    <>
      <EditorShell
        state={state}
        saveStatus={saveStatus}
        activeCategory={activeCategory}
        selectedObject={selectedObject}
        canUndo={stackRef.current.canUndo()}
        canRedo={stackRef.current.canRedo()}
        canvasRef={(node) => {
          hostRef.current = node;
        }}
        onBack={() => {
          if (!state.dirty || window.confirm('Leave Sky Forge Editor with unsaved changes?')) {
            onBack();
          }
        }}
        onSave={saveLevel}
        onUndo={() => setAndPublish((previous) => stackRef.current.undo(previous))}
        onRedo={() => setAndPublish((previous) => stackRef.current.redo(previous))}
        onTest={() => onTestPlay(state.level)}
        onValidate={validate}
        onExport={exportLevel}
        onSettings={() => setSettingsOpen(true)}
        onHelp={() => setHelpOpen(true)}
        onMusic={() => setMusicOpen(true)}
        onCategoryChange={(category) => {
          setActiveCategory(category);
          updateLayers(category, { active: true });
        }}
        onLayerChange={updateLayers}
        onFocusPoint={(point) => busRef.current.emit('focus', point)}
        onPaletteItem={(itemId) => {
          const item = getCatalogItem(itemId);
          setAndPublish((previous) => ({
            ...previous,
            activePaletteItemId: itemId,
            activeTool: 'brush',
            layers: item
              ? updateLayerState(previous.layers, item.category, { active: true })
              : previous.layers
          }));
        }}
        onPropertyChange={(id, changes) => execute(new UpdateObjectCommand(id, changes))}
        onMultiPropertyChange={updateManySelected}
        onAlign={alignSelection}
        onDistribute={distributeSelection}
        onDuplicate={duplicateSelection}
        onDelete={deleteSelection}
        onFocusResult={(result: ValidationResult) => {
          if (typeof result.x === 'number' && typeof result.y === 'number') {
            busRef.current.emit('focus', { x: result.x, y: result.y });
          }
        }}
      />
      <LevelSettingsDialog
        level={state.level}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onChange={updateLevel}
        onTemplate={(templateId) => {
          updateLevel(createLevelFromTemplate(templateId));
          stackRef.current.clear();
        }}
      />
      <ShortcutHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      <MusicEditor open={musicOpen} lesson={state.level.music} onClose={() => setMusicOpen(false)} onApply={(music) => applyLevelEdit('Update music lesson', { ...state.level, music })} onTest={(exercise) => onMusicTest?.(exercise)} />
    </>
  );
}

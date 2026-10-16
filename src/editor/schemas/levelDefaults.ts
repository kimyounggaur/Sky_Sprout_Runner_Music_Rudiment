import type { LevelData, LevelObject } from '../../game/data/LevelData';
import { createLevelFromTemplate } from '../data/levelTemplates';
import { getDefaultLayerStates, type LayerStateMap } from '../systems/EditorAdvancedTools';

export type EditorTool = 'select' | 'brush' | 'erase' | 'rectangle' | 'pan' | 'path';

export interface ValidationResult {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  objectId?: string;
  x?: number;
  y?: number;
}

export interface EditorState {
  level: LevelData;
  selectedIds: string[];
  activeTool: EditorTool;
  activePaletteItemId: string | null;
  camera: {
    x: number;
    y: number;
    zoom: number;
  };
  grid: {
    visible: boolean;
    snap: boolean;
    tileSize: number;
  };
  layers: LayerStateMap;
  dirty: boolean;
  validationResults: ValidationResult[];
  clipboard: LevelObject[];
}

export function createEditorState(level = createLevelFromTemplate('emptyIsland')): EditorState {
  return {
    level,
    selectedIds: [],
    activeTool: 'brush',
    activePaletteItemId: 'skyGrassBlock',
    camera: { x: 0, y: 0, zoom: 1 },
    grid: { visible: true, snap: true, tileSize: level.world.tileSize },
    layers: getDefaultLayerStates(),
    dirty: false,
    validationResults: [],
    clipboard: []
  };
}

export function markDirty(state: EditorState, dirty = true): EditorState {
  return {
    ...state,
    dirty,
    level: {
      ...state.level,
      updatedAt: new Date().toISOString()
    }
  };
}

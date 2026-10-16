import type { LevelData } from '../../game/data/LevelData';
import type { EditorState } from '../schemas/levelDefaults';
import type { EditorCommand } from './EditorCommand';

export class ApplyLevelCommand implements EditorCommand {
  readonly id: string;
  private previousLevel: LevelData | null = null;
  private previousSelectedIds: string[] = [];

  constructor(
    readonly label: string,
    private readonly nextLevel: LevelData,
    private readonly nextSelectedIds?: string[]
  ) {
    this.id = `apply-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  do(state: EditorState): EditorState {
    this.previousLevel = state.level;
    this.previousSelectedIds = state.selectedIds;
    return {
      ...state,
      level: this.nextLevel,
      selectedIds: this.nextSelectedIds ?? state.selectedIds
    };
  }

  undo(state: EditorState): EditorState {
    if (!this.previousLevel) {
      return state;
    }

    return {
      ...state,
      level: this.previousLevel,
      selectedIds: this.previousSelectedIds
    };
  }
}

import type { LevelObject } from '../../game/data/LevelData';
import type { EditorState } from '../schemas/levelDefaults';
import { findLevelObject, updateLevelObject } from '../utils/levelObjects';
import type { EditorCommand } from './EditorCommand';

export class UpdateObjectCommand implements EditorCommand {
  readonly id: string;
  readonly label = 'Update object';
  private previous: Partial<LevelObject> = {};

  constructor(
    private readonly objectId: string,
    private readonly changes: Partial<LevelObject>
  ) {
    this.id = `update-${objectId}`;
  }

  do(state: EditorState): EditorState {
    const object = findLevelObject(state.level, this.objectId);
    if (!object) {
      return state;
    }

    this.previous = Object.fromEntries(
      Object.keys(this.changes).map((key) => [key, object[key as keyof LevelObject]])
    ) as Partial<LevelObject>;

    return {
      ...state,
      level: updateLevelObject(state.level, this.objectId, this.changes),
      selectedIds: [this.objectId]
    };
  }

  undo(state: EditorState): EditorState {
    return {
      ...state,
      level: updateLevelObject(state.level, this.objectId, this.previous),
      selectedIds: [this.objectId]
    };
  }
}

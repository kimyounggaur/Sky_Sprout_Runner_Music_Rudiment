import type { LevelObject } from '../../game/data/LevelData';
import type { EditorState } from '../schemas/levelDefaults';
import { addLevelObject, cloneObjects, removeLevelObjects } from '../utils/levelObjects';
import type { EditorCommand } from './EditorCommand';

export class DeleteObjectCommand implements EditorCommand {
  readonly id: string;
  readonly label = 'Delete object';
  private deleted: LevelObject[] = [];

  constructor(private readonly ids: string[]) {
    this.id = `delete-${ids.join('-')}`;
  }

  do(state: EditorState): EditorState {
    this.deleted = cloneObjects(state.level, this.ids);
    return {
      ...state,
      level: removeLevelObjects(state.level, this.ids),
      selectedIds: state.selectedIds.filter((id) => !this.ids.includes(id))
    };
  }

  undo(state: EditorState): EditorState {
    return {
      ...state,
      level: this.deleted.reduce((level, object) => addLevelObject(level, object), state.level),
      selectedIds: this.deleted.map((object) => object.id)
    };
  }
}

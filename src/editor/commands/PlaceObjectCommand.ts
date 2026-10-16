import type { LevelObject } from '../../game/data/LevelData';
import type { EditorState } from '../schemas/levelDefaults';
import { addLevelObject, removeLevelObjects } from '../utils/levelObjects';
import type { EditorCommand } from './EditorCommand';

export class PlaceObjectCommand implements EditorCommand {
  readonly id: string;
  readonly label = 'Place object';

  constructor(private readonly object: LevelObject) {
    this.id = `place-${object.id}`;
  }

  do(state: EditorState): EditorState {
    return {
      ...state,
      level: addLevelObject(removeLevelObjects(state.level, [this.object.id]), this.object),
      selectedIds: [this.object.id]
    };
  }

  undo(state: EditorState): EditorState {
    return {
      ...state,
      level: removeLevelObjects(state.level, [this.object.id]),
      selectedIds: []
    };
  }
}

import type { LevelObject } from '../../game/data/LevelData';
import type { EditorState } from '../schemas/levelDefaults';
import { addLevelObject, removeLevelObjects } from '../utils/levelObjects';
import type { EditorCommand } from './EditorCommand';

export class BulkPaintCommand implements EditorCommand {
  readonly id: string;
  readonly label = 'Bulk paint';

  constructor(private readonly objects: LevelObject[]) {
    this.id = `bulk-paint-${objects.map((object) => object.id).join('-')}`;
  }

  do(state: EditorState): EditorState {
    const level = this.objects.reduce(
      (current, object) => addLevelObject(removeLevelObjects(current, [object.id]), object),
      state.level
    );

    return {
      ...state,
      level,
      selectedIds: this.objects.map((object) => object.id)
    };
  }

  undo(state: EditorState): EditorState {
    return {
      ...state,
      level: removeLevelObjects(
        state.level,
        this.objects.map((object) => object.id)
      ),
      selectedIds: []
    };
  }
}

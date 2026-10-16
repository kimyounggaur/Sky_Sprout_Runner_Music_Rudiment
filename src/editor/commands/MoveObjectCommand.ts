import type { EditorState } from '../schemas/levelDefaults';
import { moveLevelObjects } from '../utils/levelObjects';
import type { EditorCommand } from './EditorCommand';

export class MoveObjectCommand implements EditorCommand {
  readonly id: string;
  readonly label = 'Move object';

  constructor(
    private readonly ids: string[],
    private readonly delta: { x: number; y: number }
  ) {
    this.id = `move-${ids.join('-')}-${delta.x}-${delta.y}`;
  }

  do(state: EditorState): EditorState {
    return {
      ...state,
      level: moveLevelObjects(state.level, this.ids, this.delta),
      selectedIds: this.ids
    };
  }

  undo(state: EditorState): EditorState {
    return {
      ...state,
      level: moveLevelObjects(state.level, this.ids, { x: -this.delta.x, y: -this.delta.y }),
      selectedIds: this.ids
    };
  }

  mergeWith(next: EditorCommand): EditorCommand | null {
    if (!(next instanceof MoveObjectCommand) || next.ids.join('|') !== this.ids.join('|')) {
      return null;
    }

    return new MoveObjectCommand(this.ids, {
      x: this.delta.x + next.delta.x,
      y: this.delta.y + next.delta.y
    });
  }
}

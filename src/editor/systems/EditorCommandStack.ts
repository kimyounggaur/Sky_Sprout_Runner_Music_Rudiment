import type { EditorState } from '../schemas/levelDefaults';
import { markDirty } from '../schemas/levelDefaults';
import type { EditorCommand } from '../commands/EditorCommand';

export class EditorCommandStack {
  private readonly undoStack: EditorCommand[] = [];
  private readonly redoStack: EditorCommand[] = [];

  constructor(private readonly maxHistory = 100) {}

  execute(state: EditorState, command: EditorCommand): EditorState {
    const previous = this.undoStack.at(-1);
    const merged = previous?.mergeWith?.(command) ?? null;
    const next = markDirty(command.do(state));

    if (merged && previous) {
      this.undoStack[this.undoStack.length - 1] = merged;
    } else {
      this.undoStack.push(command);
    }

    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }

    this.redoStack.length = 0;
    return next;
  }

  undo(state: EditorState): EditorState {
    const command = this.undoStack.pop();
    if (!command) {
      return state;
    }

    this.redoStack.push(command);
    return markDirty(command.undo(state));
  }

  redo(state: EditorState): EditorState {
    const command = this.redoStack.pop();
    if (!command) {
      return state;
    }

    this.undoStack.push(command);
    return markDirty(command.do(state));
  }

  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}

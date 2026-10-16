import type { EditorState } from '../schemas/levelDefaults';

export interface EditorCommand {
  id: string;
  label: string;
  do(state: EditorState): EditorState;
  undo(state: EditorState): EditorState;
  mergeWith?(next: EditorCommand): EditorCommand | null;
}

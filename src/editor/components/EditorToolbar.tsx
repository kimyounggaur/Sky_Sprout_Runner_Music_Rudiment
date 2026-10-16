import type { EditorState } from '../schemas/levelDefaults';
import { MUSIC_ENABLED } from '../../game/music/feature';

interface EditorToolbarProps {
  state: EditorState;
  saveStatus: 'Saved' | 'Unsaved' | 'Autosaved';
  canUndo: boolean;
  canRedo: boolean;
  onBack: () => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onTest: () => void;
  onValidate: () => void;
  onExport: () => void;
  onSettings: () => void;
  onHelp: () => void;
  onMusic: () => void;
}

export function EditorToolbar({
  state,
  saveStatus,
  canUndo,
  canRedo,
  onBack,
  onSave,
  onUndo,
  onRedo,
  onTest,
  onValidate,
  onExport,
  onSettings,
  onHelp,
  onMusic
}: EditorToolbarProps) {
  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Editor toolbar">
      <button type="button" aria-label="Back to menu" onClick={onBack}>
        Back
      </button>
      <button type="button" aria-label="Save level" onClick={onSave}>
        Save
      </button>
      <button type="button" aria-label="Undo edit" onClick={onUndo} disabled={!canUndo}>
        Undo
      </button>
      <button type="button" aria-label="Redo edit" onClick={onRedo} disabled={!canRedo}>
        Redo
      </button>
      <button type="button" aria-label="Test play level" onClick={onTest}>
        Test
      </button>
      <button type="button" aria-label="Validate level" onClick={onValidate}>
        Validate
      </button>
      <button type="button" aria-label="Export level" onClick={onExport}>
        Export
      </button>
      <button type="button" aria-label="Open level settings" onClick={onSettings}>
        Settings
      </button>
      <button type="button" aria-label="Open shortcut help" onClick={onHelp}>
        Help
      </button>
      {MUSIC_ENABLED && <button type="button" aria-label="음악 편집기 열기" onClick={onMusic}>Music ♪</button>}
      <div className="editor-toolbar__title">
        <strong>{state.level.name}</strong>
        <span>{saveStatus}</span>
      </div>
    </div>
  );
}

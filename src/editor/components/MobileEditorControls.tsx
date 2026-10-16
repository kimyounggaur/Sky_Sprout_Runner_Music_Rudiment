interface MobileEditorControlsProps {
  onCopy: () => void;
  onDelete: () => void;
  onSave: () => void;
  onTest: () => void;
}

export function MobileEditorControls({ onCopy, onDelete, onSave, onTest }: MobileEditorControlsProps) {
  return (
    <div className="mobile-editor-controls" aria-label="Mobile editor actions">
      <button type="button" onClick={onCopy}>
        Copy
      </button>
      <button type="button" onClick={onDelete}>
        Delete
      </button>
      <button type="button" onClick={onSave}>
        Save
      </button>
      <button type="button" onClick={onTest}>
        Test
      </button>
    </div>
  );
}

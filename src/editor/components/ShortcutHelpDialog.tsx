interface ShortcutHelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutHelpDialog({ open, onClose }: ShortcutHelpDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="editor-modal" role="dialog" aria-modal="true" aria-label="Shortcut help">
      <div className="editor-modal__body shortcut-grid">
        <h2>Shortcuts</h2>
        <span>V Select</span>
        <span>B Brush</span>
        <span>E Erase</span>
        <span>R Rectangle</span>
        <span>T Test</span>
        <span>Ctrl S Save</span>
        <span>Ctrl Z Undo</span>
        <span>Delete Remove</span>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

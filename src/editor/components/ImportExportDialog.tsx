interface ImportExportDialogProps {
  onImport: (file: File) => void;
}

export function ImportExportDialog({ onImport }: ImportExportDialogProps) {
  return (
    <label className="import-button">
      Import JSON
      <input
        type="file"
        accept="application/json,.json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onImport(file);
            event.target.value = '';
          }
        }}
      />
    </label>
  );
}

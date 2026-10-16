import type { SavedLevelSummary } from '../systems/EditorPersistenceSystem';
import { ImportExportDialog } from './ImportExportDialog';

interface LevelListPanelProps {
  levels: SavedLevelSummary[];
  onBack: () => void;
  onEdit: (levelId: string) => void;
  onPlay: (levelId: string) => void;
  onDuplicate: (levelId: string) => void;
  onExport: (levelId: string) => void;
  onDelete: (levelId: string) => void;
  onImport: (file: File) => void;
}

export function LevelListPanel({
  levels,
  onBack,
  onEdit,
  onPlay,
  onDuplicate,
  onExport,
  onDelete,
  onImport
}: LevelListPanelProps) {
  return (
    <section className="level-list-screen">
      <div className="level-list-header">
        <button type="button" onClick={onBack}>
          Back
        </button>
        <h1>My Levels</h1>
        <ImportExportDialog onImport={onImport} />
      </div>
      <div className="level-list">
        {levels.length === 0 ? (
          <p>No saved levels yet.</p>
        ) : (
          levels.map((level) => (
            <article key={level.id} className="level-card">
              <div className="level-card__thumb" aria-hidden="true">
                {level.thumbnail?.startsWith('data:') ? <img src={level.thumbnail} alt="" /> : <span />}
              </div>
              <h2>{level.name}</h2>
              <p>
                {level.widthTiles} x {level.heightTiles}
              </p>
              <p>
                Best time {level.bestTimeSeconds ? `${level.bestTimeSeconds}s` : '-'} / Best score{' '}
                {level.bestScore ?? '-'}
              </p>
              <div className="level-card-actions">
                <button type="button" aria-label={`Edit ${level.name}`} onClick={() => onEdit(level.id)}>
                  Edit
                </button>
                <button type="button" aria-label={`Play ${level.name}`} onClick={() => onPlay(level.id)}>
                  Play
                </button>
                <button
                  type="button"
                  aria-label={`Duplicate ${level.name}`}
                  onClick={() => onDuplicate(level.id)}
                >
                  Duplicate
                </button>
                <button type="button" aria-label={`Export ${level.name}`} onClick={() => onExport(level.id)}>
                  Export
                </button>
                <button type="button" aria-label={`Delete ${level.name}`} onClick={() => onDelete(level.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

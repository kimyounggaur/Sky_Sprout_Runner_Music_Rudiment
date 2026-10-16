import type { LevelData } from '../../game/data/LevelData';
import type { LevelTemplateId } from '../data/levelTemplates';

interface LevelSettingsDialogProps {
  level: LevelData;
  open: boolean;
  onClose: () => void;
  onChange: (level: LevelData) => void;
  onTemplate: (templateId: LevelTemplateId) => void;
}

export function LevelSettingsDialog({ level, open, onClose, onChange, onTemplate }: LevelSettingsDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="editor-modal" role="dialog" aria-modal="true" aria-label="Level settings">
      <form className="editor-modal__body" onSubmit={(event) => event.preventDefault()}>
        <h2>Level Settings</h2>
        <label>
          Template
          <select
            aria-label="Template"
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) {
                onTemplate(event.target.value as LevelTemplateId);
                event.target.value = '';
              }
            }}
          >
            <option value="">Choose template</option>
            <option value="emptyIsland">Empty Island</option>
            <option value="starterPlains">Starter Plains</option>
            <option value="floatingChallenge">Floating Challenge</option>
            <option value="enemyPractice">Enemy Practice</option>
            <option value="speedRunStrip">Speed Run Strip</option>
          </select>
        </label>
        <label>
          Name
          <input value={level.name} onChange={(event) => onChange({ ...level, name: event.target.value })} />
        </label>
        <label>
          Description
          <textarea
            aria-label="Description"
            value={level.description}
            onChange={(event) => onChange({ ...level, description: event.target.value })}
          />
        </label>
        <label>
          Width
          <input
            type="number"
            min={20}
            max={300}
            value={level.world.widthTiles}
            onChange={(event) =>
              onChange({
                ...level,
                world: { ...level.world, widthTiles: Number(event.target.value) }
              })
            }
          />
        </label>
        <label>
          Height
          <input
            type="number"
            min={12}
            max={80}
            value={level.world.heightTiles}
            onChange={(event) =>
              onChange({
                ...level,
                world: { ...level.world, heightTiles: Number(event.target.value) }
              })
            }
          />
        </label>
        <label>
          Theme
          <select
            aria-label="Theme"
            value={level.world.theme}
            onChange={(event) =>
              onChange({
                ...level,
                world: { ...level.world, theme: event.target.value as LevelData['world']['theme'] }
              })
            }
          >
            <option value="windIsland">Wind Island</option>
            <option value="cloudDawn">Cloud Dawn</option>
            <option value="starCavern">Star Cavern</option>
          </select>
        </label>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </form>
    </div>
  );
}

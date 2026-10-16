import type { LevelObject, PlatformData } from '../../game/data/LevelData';
import type { EditorState } from '../schemas/levelDefaults';
import type { Alignment, DistributionAxis } from '../systems/EditorAdvancedTools';

interface PropertiesPanelProps {
  state: EditorState;
  selectedObject: LevelObject | null;
  onChange: (id: string, changes: Partial<LevelObject>) => void;
  onMultiChange: (changes: Partial<LevelObject>) => void;
  onAlign: (alignment: Alignment) => void;
  onDistribute: (axis: DistributionAxis) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function PropertiesPanel({
  state,
  selectedObject,
  onChange,
  onMultiChange,
  onAlign,
  onDistribute,
  onDuplicate,
  onDelete
}: PropertiesPanelProps) {
  const selectedPlatform =
    selectedObject && selectedObject.type === 'movingBreezePlatform'
      ? (selectedObject as PlatformData)
      : null;

  return (
    <aside className="properties-panel" role="region" aria-label="Properties panel">
      <h2>Properties</h2>
      {!selectedObject ? (
        <div className="empty-panel">
          <span>{state.selectedIds.length} selected</span>
          {state.selectedIds.length > 1 ? (
            <div className="multi-inspector">
              <label className="property-check">
                <input
                  type="checkbox"
                  onChange={(event) => onMultiChange({ visible: event.target.checked })}
                />
                Set visible
              </label>
              <label className="property-check">
                <input
                  type="checkbox"
                  onChange={(event) => onMultiChange({ locked: event.target.checked })}
                />
                Set locked
              </label>
              <div className="property-actions property-actions--grid">
                <button type="button" onClick={() => onAlign('left')}>Left</button>
                <button type="button" onClick={() => onAlign('right')}>Right</button>
                <button type="button" onClick={() => onAlign('top')}>Top</button>
                <button type="button" onClick={() => onAlign('bottom')}>Bottom</button>
                <button type="button" onClick={() => onDistribute('horizontal')}>Distribute H</button>
                <button type="button" onClick={() => onDistribute('vertical')}>Distribute V</button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <form className="property-form" onSubmit={(event) => event.preventDefault()}>
          <label>
            ID
            <input value={selectedObject.id} readOnly />
          </label>
          <label>
            Type
            <input value={selectedObject.type} readOnly />
          </label>
          <label>
            X
            <input
              type="number"
              value={Math.round(selectedObject.x)}
              onChange={(event) => onChange(selectedObject.id, { x: Number(event.target.value) })}
            />
          </label>
          <label>
            Y
            <input
              type="number"
              value={Math.round(selectedObject.y)}
              onChange={(event) => onChange(selectedObject.id, { y: Number(event.target.value) })}
            />
          </label>
          <label>
            Width
            <input
              type="number"
              min={1}
              value={Math.round(selectedObject.width)}
              onChange={(event) => onChange(selectedObject.id, { width: Number(event.target.value) })}
            />
          </label>
          <label>
            Height
            <input
              type="number"
              min={1}
              value={Math.round(selectedObject.height)}
              onChange={(event) => onChange(selectedObject.id, { height: Number(event.target.value) })}
            />
          </label>
          {'speed' in selectedObject ? (
            <label>
              Speed
              <input
                type="number"
                value={selectedObject.speed}
                onChange={(event) => onChange(selectedObject.id, { speed: Number(event.target.value) })}
              />
            </label>
          ) : null}
          {selectedPlatform ? (
            <div className="path-editor">
              <h3>Path</h3>
              <label>
                Mode
                <select
                  aria-label="Mode"
                  value={selectedPlatform.mode}
                  onChange={(event) =>
                    onChange(selectedPlatform.id, { mode: event.target.value as PlatformData['mode'] })
                  }
                >
                  <option value="pingPong">Ping Pong</option>
                  <option value="loop">Loop</option>
                </select>
              </label>
              {selectedPlatform.waypoints.map((waypoint, index) => (
                <div className="waypoint-row" key={`${selectedPlatform.id}-${index}`}>
                  <span>#{index + 1}</span>
                  <input
                    aria-label={`Waypoint ${index + 1} x`}
                    type="number"
                    value={Math.round(waypoint.x)}
                    onChange={(event) => {
                      const waypoints = selectedPlatform.waypoints.map((current, currentIndex) =>
                        currentIndex === index ? { ...current, x: Number(event.target.value) } : current
                      );
                      onChange(selectedPlatform.id, { waypoints } as Partial<LevelObject>);
                    }}
                  />
                  <input
                    aria-label={`Waypoint ${index + 1} y`}
                    type="number"
                    value={Math.round(waypoint.y)}
                    onChange={(event) => {
                      const waypoints = selectedPlatform.waypoints.map((current, currentIndex) =>
                        currentIndex === index ? { ...current, y: Number(event.target.value) } : current
                      );
                      onChange(selectedPlatform.id, { waypoints } as Partial<LevelObject>);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onChange(selectedPlatform.id, {
                        waypoints: selectedPlatform.waypoints.filter((_, currentIndex) => currentIndex !== index)
                      } as Partial<LevelObject>)
                    }
                    disabled={selectedPlatform.waypoints.length <= 2}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const last = selectedPlatform.waypoints.at(-1) ?? {
                    x: selectedPlatform.x,
                    y: selectedPlatform.y
                  };
                  onChange(selectedPlatform.id, {
                    waypoints: [...selectedPlatform.waypoints, { x: last.x + state.grid.tileSize * 3, y: last.y }]
                  } as Partial<LevelObject>);
                }}
              >
                Add Waypoint
              </button>
            </div>
          ) : null}
          {'patrolDistance' in selectedObject ? (
            <label>
              Patrol
              <input
                type="number"
                value={selectedObject.patrolDistance}
                onChange={(event) =>
                  onChange(selectedObject.id, { patrolDistance: Number(event.target.value) })
                }
              />
            </label>
          ) : null}
          <label className="property-check">
            <input
              type="checkbox"
              checked={selectedObject.visible}
              onChange={(event) => onChange(selectedObject.id, { visible: event.target.checked })}
            />
            Visible
          </label>
          <label className="property-check">
            <input
              type="checkbox"
              checked={selectedObject.locked}
              onChange={(event) => onChange(selectedObject.id, { locked: event.target.checked })}
            />
            Locked
          </label>
          <label>
            Notes
            <textarea
              aria-label="Notes"
              value={selectedObject.notes}
              onChange={(event) => onChange(selectedObject.id, { notes: event.target.value })}
            />
          </label>
          <div className="property-actions">
            <button type="button" onClick={onDuplicate}>
              Copy
            </button>
            <button type="button" onClick={onDelete}>
              Delete
            </button>
          </div>
        </form>
      )}
    </aside>
  );
}

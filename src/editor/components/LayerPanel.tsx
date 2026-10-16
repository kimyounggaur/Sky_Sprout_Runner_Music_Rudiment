import type { EditorLayer } from '../../game/data/LevelData';
import type { LayerStateMap } from '../systems/EditorAdvancedTools';
import { editorLayerOrder } from '../systems/EditorAdvancedTools';

interface LayerPanelProps {
  layers: LayerStateMap;
  onChange: (
    layerId: EditorLayer,
    changes: Partial<{ visible: boolean; locked: boolean; active: boolean }>
  ) => void;
}

export function LayerPanel({ layers, onChange }: LayerPanelProps) {
  return (
    <section className="layer-panel" role="region" aria-label="Layer panel">
      <h2>Layers</h2>
      <div className="layer-list">
        {editorLayerOrder.map((layerId) => {
          const layer = layers[layerId];
          return (
            <div className={layer.active ? 'layer-row layer-row--active' : 'layer-row'} key={layerId}>
              <button
                type="button"
                className="icon-button"
                title={layer.visible ? `Hide ${layer.label}` : `Show ${layer.label}`}
                aria-label={layer.visible ? `Hide ${layer.label}` : `Show ${layer.label}`}
                onClick={() => onChange(layerId, { visible: !layer.visible })}
              >
                {layer.visible ? 'on' : 'off'}
              </button>
              <button
                type="button"
                className="layer-name"
                aria-label={`Set active layer ${layer.label}`}
                onClick={() => onChange(layerId, { active: true })}
              >
                {layer.label}
              </button>
              <button
                type="button"
                className="icon-button"
                title={layer.locked ? `Unlock ${layer.label}` : `Lock ${layer.label}`}
                aria-label={layer.locked ? `Unlock ${layer.label}` : `Lock ${layer.label}`}
                onClick={() => onChange(layerId, { locked: !layer.locked })}
              >
                {layer.locked ? 'lock' : 'open'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

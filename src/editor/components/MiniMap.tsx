import type { EditorState } from '../schemas/levelDefaults';
import { getLevelObjects } from '../../game/data/LevelData';

interface MiniMapProps {
  state: EditorState;
  onFocus: (point: { x: number; y: number }) => void;
}

export function MiniMap({ state, onFocus }: MiniMapProps) {
  const width = state.level.world.widthTiles * state.level.world.tileSize;
  const height = state.level.world.heightTiles * state.level.world.tileSize;
  const objects = getLevelObjects(state.level).filter((object) => object.visible);
  const viewWidth = 960 / state.camera.zoom;
  const viewHeight = 540 / state.camera.zoom;

  return (
    <button
      type="button"
      className="mini-map"
      aria-label="Mini map"
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * width;
        const y = ((event.clientY - rect.top) / rect.height) * height;
        onFocus({ x, y });
      }}
    >
      {objects.map((object) => (
        <span
          className={`mini-map__dot mini-map__dot--${object.layer}`}
          key={object.id}
          style={{
            left: `${(object.x / width) * 100}%`,
            top: `${(object.y / height) * 100}%`,
            width: `${Math.max(2, (object.width / width) * 100)}%`
          }}
        />
      ))}
      <span
        className="mini-map__viewport"
        style={{
          left: `${(state.camera.x / width) * 100}%`,
          top: `${(state.camera.y / height) * 100}%`,
          width: `${Math.min(100, (viewWidth / width) * 100)}%`,
          height: `${Math.min(100, (viewHeight / height) * 100)}%`
        }}
      />
      <strong>{state.level.world.widthTiles} x {state.level.world.heightTiles}</strong>
    </button>
  );
}

import type { LevelData } from '../../game/data/LevelData';
import { estimateDifficulty } from '../systems/EditorAdvancedTools';

interface DifficultyEstimatorPanelProps {
  level: LevelData;
}

export function DifficultyEstimatorPanel({ level }: DifficultyEstimatorPanelProps) {
  const estimate = estimateDifficulty(level);

  return (
    <section className="difficulty-panel" role="region" aria-label="Difficulty estimator">
      <h2>Difficulty</h2>
      <strong className={`difficulty-badge difficulty-badge--${estimate.rating}`}>
        {estimate.rating}
      </strong>
      <dl>
        <div>
          <dt>Enemies</dt>
          <dd>{estimate.enemyCount}</dd>
        </div>
        <div>
          <dt>Hazards</dt>
          <dd>{estimate.hazardCount}</dd>
        </div>
        <div>
          <dt>Jump gaps</dt>
          <dd>{estimate.jumpGapEstimate}</dd>
        </div>
        <div>
          <dt>Checkpoint span</dt>
          <dd>{estimate.checkpointSpacing} tiles</dd>
        </div>
        <div>
          <dt>Length</dt>
          <dd>{estimate.levelLengthTiles} tiles</dd>
        </div>
      </dl>
    </section>
  );
}

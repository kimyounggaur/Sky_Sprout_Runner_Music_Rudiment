import { SCORE_VALUES } from '../config/constants';
import { SaveSystem } from './SaveSystem';

export class ScoreSystem {
  private score = 0;
  private shards = 0;

  constructor(private readonly saveSystem = new SaveSystem()) {}

  addShard(): number {
    this.shards += 1;
    this.score += SCORE_VALUES.shard;
    return this.score;
  }

  addEnemyDefeat(): number {
    this.score += SCORE_VALUES.enemy;
    return this.score;
  }

  addPowerUp(): number {
    this.score += SCORE_VALUES.powerUp;
    return this.score;
  }

  addClearBonus(timeLimitSeconds: number, elapsedSeconds: number): number {
    const remaining = Math.max(0, timeLimitSeconds - elapsedSeconds);
    this.score += SCORE_VALUES.clearBase + remaining * SCORE_VALUES.timeBonusPerSecond;
    return this.score;
  }

  getScore(): number {
    return this.score;
  }

  getShards(): number {
    return this.shards;
  }

  getBestScore(): number {
    return this.saveSystem.getBestScore();
  }

  commitBestScore(): number {
    const best = Math.max(this.getBestScore(), this.score);
    this.saveSystem.setBestScore(best);
    return best;
  }
}

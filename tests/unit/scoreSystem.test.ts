import { describe, expect, it } from 'vitest';
import { ScoreSystem } from '../../src/game/systems/ScoreSystem';
import { MemoryStorage, SaveSystem } from '../../src/game/systems/SaveSystem';

describe('score system', () => {
  it('adds shard, enemy, power-up, and clear bonus values', () => {
    const score = new ScoreSystem(new SaveSystem(new MemoryStorage()));

    expect(score.addShard()).toBe(100);
    expect(score.addEnemyDefeat()).toBe(300);
    expect(score.addPowerUp()).toBe(600);
    expect(score.addClearBonus(100, 80)).toBe(2000);
  });

  it('persists the best score without lowering it', () => {
    const storage = new MemoryStorage();
    const save = new SaveSystem(storage);
    const first = new ScoreSystem(save);

    first.addShard();
    first.addClearBonus(10, 5);
    const best = first.commitBestScore();

    const second = new ScoreSystem(save);
    second.addShard();

    expect(second.commitBestScore()).toBe(best);
    expect(save.getBestScore()).toBe(best);
  });
});

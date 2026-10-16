import { describe, expect, it } from 'vitest';
import { MusicContactEpisodes } from '../../src/game/music/contactEpisodes';

describe('music block contact episodes', () => {
  it('accepts a continuous 60-frame contact once, then a new hit after separation', () => {
    const contacts = new MusicContactEpisodes('test');
    const results = [];
    for (let frame = 0; frame < 60; frame += 1) {
      contacts.releaseSeparated(new Set(['C4']));
      results.push(contacts.accept([{ id: 'C4', overlap: 22 }]));
    }
    expect(results.filter(Boolean)).toHaveLength(1);
    contacts.releaseSeparated(new Set());
    const second = contacts.accept([{ id: 'C4', overlap: 22 }]);
    expect(second?.id).toBe('C4');
    expect(second?.episodeId).not.toBe(results[0]?.episodeId);
  });

  it('selects one strongest contact independent of array order', () => {
    const first = new MusicContactEpisodes('a').accept([{ id: 'C4', overlap: 14 }, { id: 'E4', overlap: 20 }]);
    const second = new MusicContactEpisodes('b').accept([{ id: 'E4', overlap: 20 }, { id: 'C4', overlap: 14 }]);
    expect(first?.id).toBe('E4');
    expect(second?.id).toBe('E4');
  });

  it('does not accept an ambiguous pair or replay it while still in contact', () => {
    const contacts = new MusicContactEpisodes('test');
    expect(contacts.accept([{ id: 'C4', overlap: 15 }, { id: 'E4', overlap: 15 }])).toBeNull();
    expect(contacts.accept([{ id: 'E4', overlap: 20 }])).toBeNull();
    contacts.releaseSeparated(new Set());
    expect(contacts.accept([{ id: 'E4', overlap: 20 }])?.id).toBe('E4');
  });

  it('reports an ambiguous contact once, and again only after separation', () => {
    const contacts = new MusicContactEpisodes('test');
    const pair = [{ id: 'C4', overlap: 15 }, { id: 'E4', overlap: 15 }];
    expect(contacts.acceptDetailed(pair)).toEqual({ contact: null, ambiguous: true });
    for (let frame = 0; frame < 60; frame += 1) expect(contacts.acceptDetailed(pair)).toEqual({ contact: null, ambiguous: false });
    contacts.releaseSeparated(new Set());
    expect(contacts.acceptDetailed(pair).ambiguous).toBe(true);
  });
});

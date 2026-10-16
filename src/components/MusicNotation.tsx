import { accessiblePitchName, accidentalSymbol, type Pitch } from '../game/music/domain';

/** Semantic SVG uses spelled diatonic positions, never MIDI pitch class as staff position. */
export function MusicNotation({ pitch, clef = 'treble' }: { pitch: Pitch; clef?: 'treble' | 'bass' }) {
  const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const bottom = clef === 'treble' ? 4 * 7 + 2 : 2 * 7 + 4; // E4 / G2
  const offset = pitch.octave * 7 + letters.indexOf(pitch.letter) - bottom;
  const y = 100 - offset * 7;
  const ledger: number[] = [];
  for (let step = -2; step >= offset; step -= 2) ledger.push(100 - step * 7);
  for (let step = 10; step <= offset; step += 2) ledger.push(100 - step * 7);
  return <figure className="music-notation">
    <svg viewBox={`0 ${Math.min(0, y - 25)} 240 ${Math.max(155, 125 - y)}`} role="img" aria-label={`${clef === 'treble' ? '높은' : '낮은'}음자리표, ${accessiblePitchName(pitch)}`}>
      {[0, 1, 2, 3, 4].map(line => <line key={line} x1="20" x2="220" y1={100 - line * 14} y2={100 - line * 14} stroke="currentColor" strokeWidth="1.4" />)}
      <text x="25" y="94" fontSize="64">{clef === 'treble' ? '𝄞' : '𝄢'}</text>
      {ledger.map(ly => <line key={ly} x1="132" x2="169" y1={ly} y2={ly} stroke="currentColor" strokeWidth="1.5" />)}
      <text x="115" y={y + 5} fontSize="24">{accidentalSymbol(pitch.accidental)}</text>
      <ellipse cx="150" cy={y} rx="10" ry="7" transform={`rotate(-20 150 ${y})`} fill="currentColor" />
      <line x1="159" x2="159" y1={y} y2={y - 35} stroke="currentColor" strokeWidth="2" />
    </svg>
    <figcaption>{clef === 'treble' ? '높은음자리표' : '낮은음자리표'} · 가운데 도 = C4</figcaption>
  </figure>;
}

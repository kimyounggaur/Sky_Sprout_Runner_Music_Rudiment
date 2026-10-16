import { useEffect, useMemo, useRef, useState } from 'react';
import { accessiblePitchName, optionLabel, pitchLabel, rationalValue, resolvePitches, type Exercise } from '../game/music/domain';
import { MusicSession, type AttemptRecord, type RewardLedger, type SessionSnapshot } from '../game/music/session';
import { MusicAudio, type ScheduledSound } from '../game/music/audio';
import { MusicWorld } from './MusicWorld';
import { MusicNotation } from './MusicNotation';
import { MusicRhythmPad } from './MusicRhythmPad';

interface Props {
  session: MusicSession; ledger: RewardLedger;
  onRecord: (ledger: RewardLedger, record: AttemptRecord) => void;
  onBack: () => void; onNext?: () => void;
}

export function MusicPractice({ session, ledger, onRecord, onBack, onNext }: Props) {
  const [snapshot, setSnapshot] = useState(() => session.getSnapshot());
  const [sound, setSound] = useState(false);
  const [audioStatus, setAudioStatus] = useState('무음으로도 완주할 수 있어요.');
  const [hint, setHint] = useState(false);
  const [safeOpen, setSafeOpen] = useState(snapshot.settings.safeSelection);
  const [details, setDetails] = useState(false);
  const [heardReady, setHeardReady] = useState(false);
  const audio = useRef<MusicAudio | null>(null);
  const heardTimer = useRef<number | undefined>(undefined);
  const live = useRef(false);
  const playback = useRef(0);
  const currentLedger = useRef(ledger); currentLedger.current = ledger;
  const exercise = snapshot.exercise;
  const isOrdered = exercise.kind === 'ordered_pitch';
  const isListening = exercise.kind === 'listen_identify';
  const isRhythm = exercise.kind === 'rhythm_grid' || exercise.kind === 'rhythm_perform';
  const isComplete = snapshot.state === 'completed';
  const paused = snapshot.state === 'paused';
  const selected = isOrdered ? snapshot.accepted : snapshot.selected;
  const profile = snapshot.notationProfile;

  const act = (action: () => SessionSnapshot) => {
    session.syncLedger(currentLedger.current);
    const next = action(); setSnapshot(next); onRecord(session.getLedger(), session.getRecord());
  };
  useEffect(() => {
    const player = new MusicAudio(); audio.current = player;
    live.current = true;
    setSnapshot(session.resume());
    const stop = () => { playback.current++; window.clearTimeout(heardTimer.current); setHeardReady(false); player.stop(); session.setEnvironment({ audioAvailable: false }); setSnapshot(session.pause()); setAudioStatus('재생을 멈췄어요. 새로 재생하면 처음부터 들을 수 있어요.'); };
    const hidden = () => { if (document.hidden) stop(); };
    player.onInterrupted = stop;
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('blur', stop);
    return () => { live.current = false; playback.current++; window.clearTimeout(heardTimer.current); player.dispose(); audio.current = null; session.pause(); document.removeEventListener('visibilitychange', hidden); window.removeEventListener('blur', stop); };
  }, [session]);

  const choices = useMemo(() => exercise.options?.length
    ? exercise.options.map(o => ({ id: o.id, label: o.label, midi: resolvePitches(exercise as Exercise, o.id)[0]?.midi }))
    : exercise.notes.map(n => ({ id: n.id, label: pitchLabel(n, profile), midi: n.midi })), [exercise, profile]);

  const select = (id: string, episode?: string) => act(() => session.select(id, episode
    ? { source: 'head_contact', contactEpisodeId: episode, inputTimestamp: performance.now() }
    : { source: 'safe_selection', inputTimestamp: performance.now() }));

  const play = async (ids: readonly string[], chord = false, backing = false, listening = false) => {
    if (!ids.length || paused) return;
    const player = audio.current;
    if (!player) return;
    const generation = ++playback.current;
    window.clearTimeout(heardTimer.current); setHeardReady(false);
    if (isListening) act(() => session.setEnvironment({ audioAvailable: false }));
    const events: ScheduledSound[] = [];
    if (chord) events.push({ notes: ids.flatMap(id => resolvePitches(exercise as Exercise, id)), onsetBeats: 0, durationBeats: 2 });
    else {
      let onsetBeats = 0;
      for (const id of ids) {
        const option = exercise.options?.find(o => o.id === id);
        const durationBeats = listening ? (exercise.listeningSeconds ?? 0.7) * 1.5 : option?.beats ? rationalValue(option.beats) : exercise.beatUnit ? rationalValue(exercise.beatUnit) : 1;
        const notes = option?.rest ? [] : resolvePitches(exercise as Exercise, id);
        events.push({ notes: notes.length || option?.rest ? notes : isRhythm ? [{ midi: 76 }] : [], onsetBeats, durationBeats: Math.max(0.08, durationBeats * 0.9) });
        onsetBeats += durationBeats + (listening ? (exercise.listeningGapSeconds ?? 0.4) * 1.5 : 0);
      }
    }
    if (backing) {
      for (const harmony of exercise.harmony ?? []) events.push({ notes: harmony.noteIds.flatMap(id => resolvePitches(exercise as Exercise, id)), onsetBeats: harmony.atBeat, durationBeats: harmony.beats * 0.94, velocity: 0.32 });
      for (const [i, id] of (exercise.lockedMelody ?? []).entries()) events.push({ notes: resolvePitches(exercise as Exercise, id), onsetBeats: i * 4, durationBeats: 3.5, velocity: 0.5 });
    }
    if (!events.some(event => event.notes.length)) { setAudioStatus('이 활동은 기호를 비교해요. 재생할 음높이가 지정되어 있지 않습니다.'); return; }
    if (!listening && ids === exercise.target) act(() => session.useDemonstration());
    try {
      const result = await player.play(events);
      if (!live.current || generation !== playback.current) return;
      if (result) {
        setSound(true); setAudioStatus('음악 재생 · A4 = 440 Hz. 기기 음량도 확인하세요.');
        act(() => session.setEnvironment({ audioAvailable: !isListening, muted: false, interrupted: false }));
        if (isListening && listening) heardTimer.current = window.setTimeout(() => { if (live.current && generation === playback.current && session.getSnapshot().state !== 'paused') setHeardReady(true); }, result.durationMs + 150);
      } else {
        setSound(false); setAudioStatus('재생할 수 없어 청음은 미측정입니다. 기호를 보고 풀기는 계속할 수 있어요.');
        act(() => session.setEnvironment({ audioAvailable: false, muted: true }));
      }
    } catch { setSound(false); act(() => session.setEnvironment({ audioAvailable: false })); setAudioStatus('이 구절의 재생 데이터를 확인해야 합니다. 입력한 답은 보존했어요.'); }
  };
  const stopSound = () => { playback.current++; window.clearTimeout(heardTimer.current); setHeardReady(false); audio.current?.stop(); setSound(false); setAudioStatus('무음 · 청음은 미측정으로 남겨요.'); act(() => session.setEnvironment({ muted: true, audioAvailable: false })); };
  const togglePause = () => {
    if (paused) { act(() => session.resume()); return; }
    playback.current++; window.clearTimeout(heardTimer.current); setHeardReady(false);
    audio.current?.stop(); setSound(false);
    session.setEnvironment({ audioAvailable: false, interrupted: true });
    setAudioStatus('재생을 멈췄어요. 계속하기 뒤 처음부터 다시 들어 주세요.');
    act(() => session.pause());
  };

  const targetLabels = exercise.target.map(id => optionLabel(exercise as Exercise, id, profile));
  const showTarget = snapshot.settings.mode === 'guided' || hint || exercise.answerDisplay === 'visible';
  const targetNote = exercise.notation ? exercise.notes.find(n => n.id === exercise.notation?.noteId) : undefined;
  const status = snapshot.lastResult?.message ?? (isOrdered ? '새싹을 움직여 블록 아래에서 점프하세요. 순서가 달라도 맞힌 음은 남아 있어요.' : '블록이나 길을 선택해 트레이를 채우고, 조건 확인을 눌러 주세요.');

  return <div className="music-practice" data-testid="music-practice" data-content-id={exercise.id} onKeyDownCapture={e => { if (e.repeat && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); } }}>
    <div className="practice-heading">
      <button type="button" className="music-back" onClick={onBack}>← 연습 지도</button>
      <div className="practice-breadcrumb">{exercise.moduleId} <span> / </span>{exercise.worldMetaphor ?? '음악 구름길'}</div>
      <button type="button" onClick={togglePause}>{paused ? '▶ 계속하기' : 'Ⅱ 일시정지'}</button>
    </div>
    <div className="practice-intro"><div><span className="music-eyebrow">{snapshot.settings.mode === 'guided' ? '안내와 함께 연습' : '스스로 적용'} · {profile.solfege === 'fixed_do' ? '고정도' : '이동도'}</span><h1>{exercise.title}</h1><p>{exercise.objective}</p></div><span className="practice-badge">{isComplete ? '✓ 조건 충족' : '✦ 안전한 연습 섬'}</span></div>
    <div className="practice-layout">
      <div className="practice-play">
        <MusicWorld choices={choices} selectedIds={[...selected]} completed={isComplete} paused={paused || safeOpen} pauseLabel={safeOpen ? '안전 선택 중 · 아래 버튼으로 음악을 골라요' : undefined} reducedMotion={snapshot.settings.reducedMotion} onSelect={select} onInteraction={kind => act(() => session.recordInteraction(kind))} onGate={onNext ?? onBack} />
        <section className="music-tray" aria-label="선택한 음악 트레이">
          <div className="tray-heading"><h2>{exercise.kind === 'voice_assignment' ? '성부 연결 다리' : exercise.kind === 'creative_phrase' ? '나의 구절' : '선택한 음악'}</h2><span>{selected.length}{exercise.constraints?.length ? ` / ${exercise.constraints.length}` : isOrdered ? ` / ${exercise.target.length}` : ''}칸</span></div>
          <ol className="note-tray">{selected.length ? selected.map((id, i) => <li key={`${id}-${i}`}><small>{i + 1}</small><span>{optionLabel(exercise as Exercise, id, profile)}</span><b aria-label="선택됨">✓</b></li>) : <li className="tray-empty">첫 블록을 선택하면 여기에 쌓여요.</li>}</ol>
          <p className={`music-feedback ${isComplete ? 'is-complete' : ''}`} role="status" aria-live="polite">{status}</p>
          {snapshot.lastResult?.remainingConditions.length ? <p>남은 조건: {snapshot.lastResult.remainingConditions.join(' · ')}</p> : null}
          <div className="music-actions">
            {!isOrdered && <button className="music-primary" type="button" disabled={paused || isComplete || selected.length === 0} onClick={() => act(() => session.submit())}>조건 확인</button>}
            <button type="button" disabled={paused || isComplete || selected.length === 0} onClick={() => act(() => session.undo())}>한 칸 되돌리기</button>
            <button type="button" disabled={paused || isComplete || selected.length === 0} onClick={() => act(() => session.clear())}>트레이 비우기</button>
            <button type="button" disabled={paused} onClick={() => { setHint(true); act(() => session.useHint()); }}>도움 보기</button>
          </div>
        </section>
        <section className="safe-selection">
          <button type="button" className="disclosure-button" aria-expanded={safeOpen} aria-controls="safe-options" onClick={() => setSafeOpen(!safeOpen)}><span>⌨ 점프 없이 안전하게 선택</span><span>{safeOpen ? '−' : '+'}</span></button>
          {safeOpen && <div id="safe-options"><p>같은 음악 조건을 키보드와 터치로 연습해요. Tab으로 이동하고 Enter로 선택하세요.</p><div className="safe-option-grid">{choices.map((choice, i) => {
            const pitch = exercise.notes.find(n => n.id === choice.id);
            return <button type="button" key={choice.id} disabled={paused || isComplete} aria-label={pitch ? accessiblePitchName(pitch, profile) : exercise.options?.find(o => o.id === choice.id)?.accessibleLabel ?? choice.label} onClick={() => select(choice.id)}><small>{String(i + 1).padStart(2, '0')}</small><span>{choice.label}</span><b>＋</b></button>;
          })}</div></div>}
        </section>
        {isRhythm && <MusicRhythmPad paused={paused} />}
      </div>
      <aside className="music-guide" aria-label="음악 활동 안내">
        <section className="guide-card"><span className="music-eyebrow">이번 섬의 목표</span><h2>{exercise.worldMetaphor ?? '음악을 한 걸음씩'}</h2><p>{exercise.prompt ?? exercise.objective}</p>
          {targetNote && <MusicNotation pitch={targetNote} clef={exercise.notation?.clef} />}
          {showTarget && exercise.target.length > 0 && <div className="target-sequence"><span>{isOrdered ? '목표 순서' : '살펴볼 예시'}</span><p>{targetLabels.join(' → ')}</p></div>}
          {isOrdered && !isComplete && showTarget && <p className="next-note">다음 음 <strong>{targetLabels[selected.length]}</strong></p>}
          <p className="guide-footnote">{isOrdered ? '구성음의 지정 순서를 연습해요. 다른 순서도 같은 화음의 음일 수 있어요.' : exercise.kind === 'creative_phrase' ? '공개된 조건을 확인해요. 예술적 우열이나 재즈다움을 점수로 매기지 않아요.' : '설명한 범위의 조건만 확인해요. 다른 음악적 해석은 검토가 필요할 수 있어요.'}</p>
        </section>
        {(exercise.harmony?.length || exercise.voiceSource || exercise.lockedMelody?.length) ? <section className="guide-card music-context"><h2>함께 흐르는 음악</h2>
          {exercise.voiceSource && <ul>{Object.entries(exercise.voiceSource).map(([voice, id]) => <li key={voice}>{voice}: {optionLabel(exercise as Exercise, id, profile)}에서 출발</li>)}</ul>}
          {exercise.harmony?.length ? <ol>{exercise.harmony.map((h, i) => <li key={i}><b>{h.symbol}</b><span>{h.atBeat + 1}박부터 {h.beats}박</span></li>)}</ol> : null}
          {exercise.lockedMelody?.length ? <p>고정 선율: {exercise.lockedMelody.map(id => optionLabel(exercise as Exercise, id, profile)).join(' → ')}<br />이 선율을 유지하며 화성을 비교해요.</p> : null}
          <button type="button" disabled={paused || !selected.length} onClick={() => void play(selected, exercise.kind === 'pitch_collection', true)}>내 답 + 배경 함께 듣기</button>
        </section> : null}
        <section className="guide-card music-audio"><div className="tray-heading"><h2>음악 들어보기</h2><span>{sound ? '♪ 소리 켬' : '무음'}</span></div>
          <button type="button" disabled={paused || !exercise.target.length} onClick={() => void play(isListening ? exercise.listeningSequence ?? [] : exercise.target, false, false, isListening)}>▷ {isListening ? '문제 소리 듣기' : '예시 들어보기'}</button>
          {isListening && <button type="button" disabled={!heardReady || paused} onClick={() => { act(() => session.setEnvironment({ audioAvailable: true, muted: false })); setAudioStatus('소리가 들렸음을 확인했어요. 이제 소리 관계를 골라 조건 확인을 눌러 보세요.'); }}>소리가 들렸어요</button>}
          <button type="button" disabled={paused || !selected.length} onClick={() => void play(selected, exercise.kind === 'pitch_collection')}>▷ 내가 고른 음악 듣기</button>
          {exercise.kind === 'ordered_pitch' && <button type="button" disabled={paused} onClick={() => void play(exercise.target, true)}>♫ 화음으로 듣기</button>}
          <button type="button" onClick={stopSound}>소리 끄기 / 재생 중단</button><p role="status">{audioStatus}</p>
          {isListening && <p>{snapshot.settings.mode === 'guided' ? '안내 모드에서는 답이 표시되어 청음이 미측정입니다. 지도 → 연습 설정에서 「적용」을 선택하면 듣기에 도전할 수 있어요.' : '문제 소리를 듣고, 들렸음을 확인해 주세요. 도움을 펼치거나 무음이면 청음은 미측정입니다.'}</p>}
        </section>
        <section className="guide-card"><button type="button" className="disclosure-button" aria-expanded={details} onClick={() => { setDetails(!details); if (!details) act(() => session.useHint()); }}>왜 이런 음악일까요? <span>{details ? '−' : '+'}</span></button>{details && <p>{exercise.explanation}</p>}<p className="guide-footnote">{exercise.reviewStatus === 'fixture_checked' ? '음높이·순서 회귀 예시 확인' : exercise.reviewStatus === 'experimental' ? '실험 활동 · 정규 숙달과 별도' : '설계 카드의 한정 예시 · 음악 전문가 검토 전'}</p></section>
        {isComplete && <section className="completion-card" aria-label="연습 완료"><img src={`${import.meta.env.BASE_URL}music-assets/raster/light-seed.png`} alt="" /><h2>바람문이 열렸어요!</h2><p>{snapshot.rewardEarned ? '수업용 Light Seed 1개를 얻었어요.' : '다시 완성했어요. 같은 활동의 보상은 한 번만 지급해요.'}</p><p>안내·안전 선택 여부를 포함해 이번 연습을 기록했어요.</p><button type="button" className="music-primary" onClick={onNext ?? onBack}>{onNext ? '다음 연습으로 →' : '연습 지도 보기'}</button><button type="button" onClick={() => { setHint(false); act(() => session.retry()); }}>이 방 다시 연습</button></section>}
      </aside>
    </div>
  </div>;
}

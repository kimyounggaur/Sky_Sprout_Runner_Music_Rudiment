import { useCallback, useEffect, useRef, useState } from 'react';
import { MusicAudio } from '../game/music/audio';
import { CALIBRATION_POLICY, applicableResponseOffset, createRhythmReplay, estimateResponseCalibration, invalidateResponseCalibration, observeRhythmTake, type ReplayMode, type ResponseCalibration, type RhythmObservation, type RhythmTakeEvidence } from '../game/music/timing';

interface ActiveTake extends RhythmTakeEvidence { active: boolean; purpose: 'practice' | 'calibration'; windowMs: number }
const evidenceCopy = (take: RhythmTakeEvidence): RhythmTakeEvidence => ({ targets: [...take.targets], inputs: [...take.inputs], bpm: take.bpm, outputClockValid: take.outputClockValid, interrupted: take.interrupted, routeRevision: take.routeRevision, responseOffsetMs: take.responseOffsetMs });

export function MusicRhythmPad({ paused }: { paused: boolean }) {
  const audio = useRef<MusicAudio | null>(null), timer = useRef<number | undefined>(undefined);
  const take = useRef<ActiveTake | null>(null), generation = useRef(0), routeRevision = useRef(0), mounted = useRef(false);
  const heldKeys = useRef(new Set<string>()), calibrationRef = useRef<ResponseCalibration | null>(null);
  const [calibration, setCalibration] = useState<ResponseCalibration | null>(null);
  const [useCorrection, setUseCorrection] = useState(true), [bpm, setBpm] = useState(80);
  const [status, setStatus] = useState('4박을 듣고, 다음 4박에 패드를 눌러 보세요.');
  const [active, setActive] = useState(false), [count, setCount] = useState(0);
  const [observation, setObservation] = useState<RhythmObservation | null>(null);
  const [lastTake, setLastTake] = useState<RhythmTakeEvidence | null>(null), [playbackStatus, setPlaybackStatus] = useState('');

  const interrupt = useCallback((reason = '테이크를 중단했어요.', invalidateCalibration = false) => {
    generation.current++; window.clearTimeout(timer.current); heldKeys.current.clear(); audio.current?.stop();
    const current = take.current;
    if (current?.active) {
      current.active = false; current.interrupted = true;
      const evidence = evidenceCopy(current); setLastTake(evidence); setObservation(observeRhythmTake(evidence, current.windowMs));
    }
    if (invalidateCalibration) {
      routeRevision.current++;
      if (calibrationRef.current) { const invalidated = invalidateResponseCalibration(calibrationRef.current, routeRevision.current); calibrationRef.current = invalidated; setCalibration(invalidated); }
    }
    setActive(false); setPlaybackStatus(''); setStatus(`${reason} 진행 중인 테이크는 미측정이며 새 카운트인으로 시작하세요.`);
  }, []);

  useEffect(() => {
    mounted.current = true;
    const player = new MusicAudio(); audio.current = player;
    const outputChanged = () => interrupt('출력 장치 변경을 감지했어요. 이전 반응 보정을 해제했습니다.', true);
    const hidden = () => { if (document.hidden) interrupt('화면이 숨겨져 연주를 멈췄어요.', true); };
    const blurred = () => interrupt('창의 포커스를 잃어 연주를 멈췄어요.', true);
    player.onInterrupted = () => interrupt('오디오가 중단되었어요.', true); player.onOutputDeviceChanged = outputChanged;
    navigator.mediaDevices?.addEventListener('devicechange', outputChanged);
    document.addEventListener('visibilitychange', hidden); window.addEventListener('blur', blurred);
    return () => {
      mounted.current = false; generation.current++; if (take.current) take.current.active = false;
      heldKeys.current.clear(); window.clearTimeout(timer.current); player.onInterrupted = undefined; player.onOutputDeviceChanged = undefined;
      player.dispose(); audio.current = null; navigator.mediaDevices?.removeEventListener('devicechange', outputChanged);
      document.removeEventListener('visibilitychange', hidden); window.removeEventListener('blur', blurred);
    };
  }, [interrupt]);
  useEffect(() => { if (paused) interrupt('활동을 일시정지했어요.'); }, [paused, interrupt]);

  const start = async (purpose: ActiveTake['purpose']) => {
    if (paused) return;
    interrupt(); setObservation(null); setLastTake(null); setCount(0);
    const player = audio.current; if (!player) return;
    const token = generation.current, sampleCount = purpose === 'calibration' ? CALIBRATION_POLICY.sampleCount : 4, periodMs = 60000 / bpm;
    setActive(true); setStatus('오디오 준비 중…');
    const current: ActiveTake = { targets: [], inputs: [], outputClockValid: false, interrupted: false, active: true, purpose, bpm, windowMs: periodMs * 0.45, routeRevision: routeRevision.current, responseOffsetMs: purpose === 'practice' && useCorrection ? applicableResponseOffset(calibrationRef.current, routeRevision.current) : null };
    take.current = current;
    try {
      const schedule = await player.play(Array.from({ length: 4 + sampleCount }, (_, index) => ({ notes: [{ midi: index < 4 ? 76 : 72 }], onsetBeats: index, durationBeats: 0.12 })), bpm);
      if (!mounted.current || token !== generation.current || !current.active) return;
      if (!schedule) { current.active = false; setActive(false); setStatus('소리를 재생할 수 없어 미측정입니다. 리듬 블록 조립은 계속할 수 있어요.'); return; }
      current.outputClockValid = schedule.outputStartMs !== null;
      const outputStart = schedule.outputStartMs ?? performance.now() + 120;
      current.targets = Array.from({ length: sampleCount }, (_, index) => outputStart + (index + 4) * periodMs);
      setStatus(`높은 소리 4번은 준비 박입니다. 낮은 소리 ${sampleCount}번에 맞춰 패드를 누르세요.${purpose === 'calibration' ? ' 이번에는 반응 편향 표본을 모읍니다.' : ''}`);
      timer.current = window.setTimeout(() => {
        if (!mounted.current || token !== generation.current || !current.active) return;
        current.active = false; setActive(false);
        const evidence = evidenceCopy(current), observed = observeRhythmTake(evidence, current.windowMs); setLastTake(evidence); setObservation(observed);
        if (purpose === 'calibration') {
          const estimated = estimateResponseCalibration(observed.matches.map(match => match.rawErrorMs), { outputClockValid: observed.status === 'observed', routeRevision: current.routeRevision, expectedSamples: sampleCount, extraInputs: observed.extraInputIndices.length });
          calibrationRef.current = estimated; setCalibration(estimated); setStatus(estimated.message);
        } else setStatus(observed.message);
      }, Math.max(0, current.targets[current.targets.length - 1] + periodMs * 0.6 - performance.now()));
    } catch { if (mounted.current && token === generation.current) { current.active = false; setActive(false); setStatus('오디오 준비가 실패해 미측정입니다. 답이나 학습 보상에는 영향을 주지 않습니다.'); } }
  };

  const tap = (timestamp: number) => {
    const current = take.current; if (!current?.active || !current.targets.length || paused) return;
    if (Number.isFinite(timestamp) && timestamp < current.targets[0] - current.windowMs) return;
    if (!Number.isFinite(timestamp) || Math.abs(performance.now() - timestamp) > 2000) current.outputClockValid = false;
    if (current.inputs.length >= 128) { current.outputClockValid = false; setStatus('입력 한도를 넘어 시각 측정을 보류합니다. 새 카운트인으로 다시 시작하세요.'); return; }
    current.inputs = [...current.inputs, timestamp]; setCount(current.inputs.length);
  };
  const replay = async (mode: ReplayMode) => {
    if (!lastTake || active || paused || !audio.current) return;
    const player = audio.current, token = ++generation.current;
    try {
      const copy = createRhythmReplay(lastTake, mode), schedule = await player.play(copy.events, lastTake.bpm);
      if (!mounted.current || token !== generation.current) return;
      setPlaybackStatus(schedule ? `${copy.label}. 높은 짧은 소리는 기준 박, 낮은 소리는 내 입력입니다. 기존 결과와 원입력은 바꾸지 않습니다.` : '재생할 수 없습니다. 원입력과 결과는 보존되어 있습니다.');
    } catch { if (mounted.current && token === generation.current) setPlaybackStatus('재생 범위를 확인할 수 없습니다. 원입력과 결과는 보존되어 있습니다.'); }
  };

  const offset = applicableResponseOffset(calibration, routeRevision.current);
  return <section className="rhythm-pad-panel" aria-label="안전 리듬 패드">
    <h3>안전한 자리에서 리듬 연주</h3><p>점프와 별개로 입력 시각을 관찰해요. 이 실험은 숙달 점수나 수업 보상을 지급하지 않아요.</p>
    <div className="music-actions"><label>템포 <input type="number" min={40} max={160} value={bpm} disabled={active} onChange={event => setBpm(Math.max(40, Math.min(160, Number(event.target.value) || 80)))} /> ♩/분</label>
      <button type="button" disabled={active || paused} onClick={() => void start('practice')}>카운트인 시작</button><button type="button" disabled={!active} onClick={() => interrupt()}>연주 중단</button></div>
    <button className="rhythm-pad" type="button" disabled={!active || paused}
      onPointerDown={event => { event.preventDefault(); event.currentTarget.focus(); tap(event.timeStamp); }}
      onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); if (!event.repeat && !heldKeys.current.has(event.code)) { heldKeys.current.add(event.code); tap(event.timeStamp); } } }}
      onKeyUp={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); heldKeys.current.delete(event.code); } }} onBlur={() => heldKeys.current.clear()}
      onClick={event => { if (event.detail === 0) tap(event.timeStamp); }}>리듬 패드 · Space / Enter <span>{count}회 입력</span></button>
    <p role="status" data-testid="rhythm-status">{status}</p>
    <details><summary>반응 편향 보정 · 선택 사항</summary>
      <p>4박을 들은 뒤 8박에 응답해 반응 편향을 추정합니다. 반응·예측·기기 영향이 함께 들어 있으며 순수 장치 지연 측정이 아닙니다.</p>
      <div className="music-actions"><button type="button" disabled={active || paused} onClick={() => void start('calibration')}>8박 보정 표본 시작</button><button type="button" disabled={active} onClick={() => { calibrationRef.current = null; setCalibration(null); }}>반응 보정 지우기</button><label><input type="checkbox" checked={useCorrection} disabled={active} onChange={event => setUseCorrection(event.target.checked)} />안정적인 반응 보정을 다음 테이크에 적용</label></div>
      <p data-testid="rhythm-calibration">{calibration ? `${calibration.message} 표본 ${calibration.rawErrorsMs.length}개${calibration.stdDevMs !== null ? ` · 표준편차 ${calibration.stdDevMs.toFixed(1)} ms · 범위 ${calibration.rangeMs?.toFixed(1)} ms` : ''}${offset !== null ? ` · 반응 편향 ${offset.toFixed(1)} ms` : ' · 적용 보류'}` : '반응 보정 없음 · 원시 시각을 관찰합니다.'}</p>
      {calibration?.rawErrorsMs.length ? <p>보정 원자료: {calibration.rawErrorsMs.map(value => `${value.toFixed(1)} ms`).join(' / ')}</p> : null}
      <p>시제품 보류 기준: {CALIBRATION_POLICY.sampleCount}개 표본, 표준편차 ≤ {CALIBRATION_POLICY.maxStdDevMs} ms, 범위 ≤ {CALIBRATION_POLICY.maxRangeMs} ms, 중앙값 ±{CALIBRATION_POLICY.maxAbsoluteOffsetMs} ms. 교육적 허용 오차나 기기 검증 완료를 뜻하지 않습니다.</p>
    </details>
    <div className="music-actions"><button type="button" onClick={() => interrupt('출력 장치를 바꿨다고 표시했어요. 이전 반응 보정을 해제했습니다.', true)}>출력 장치를 바꿨어요</button></div>
    <p>감지 가능한 장치 변경·창 이탈·오디오 중단은 현재 테이크를 미측정으로 종료합니다. 운영체제의 모든 출력 경로 변경을 감지할 수 없으므로 이어폰을 바꿨다면 위 버튼을 누르세요.</p>
    {observation && <>
      {observation.status === 'observed' ? <><ol className="timing-results">{observation.targets.map((_target, index) => { const match = observation.matches.find(item => item.targetIndex === index); return <li key={index}>{index + 1}박: {match ? `원본 ${Math.round(match.rawErrorMs)} ms${observation.responseOffsetMs !== null ? ` / 반응 보정 ${Math.round(match.correctedErrorMs)} ms` : ''}` : '입력 없음'}</li>; })}</ol><p>추가 입력 {observation.extraInputIndices.length}회 · 한 입력당 한 목표 · 비교창 ±{Math.round(observation.windowMs)} ms (현재 템포의 관찰용 창)</p></> : <p>중단·환경 불확실로 미측정입니다. 누락 박을 오답으로 확정하지 않습니다.</p>}
      <p>{observation.responseOffsetMs === null ? '이번 테이크는 반응 보정 없음' : `이번 테이크 시작 때 고정한 반응 편향 ${observation.responseOffsetMs.toFixed(1)} ms를 한 번만 뺐습니다.`} · 원본 시각 유지</p>
      <details><summary>원입력 시각 확인</summary><p>같은 performance 시계, 단위 ms: {observation.rawInputs.length ? observation.rawInputs.map(value => Number.isFinite(value) ? value.toFixed(1) : '유효하지 않은 시각').join(' / ') : '입력 없음'}</p></details>
    </>}
    {lastTake?.inputs.length ? <div><div className="music-actions"><button type="button" disabled={active || paused} onClick={() => void replay('raw')}>원입력 그대로 재생</button><button type="button" disabled={active || paused} onClick={() => void replay('quantized')}>양자화한 사본 재생</button></div><p>양자화는 가까운 박에 옮긴 비교 재생입니다. 위의 원본 결과나 보정 표본을 바꾸지 않으며 실제 연주 성공으로 기록하지 않습니다.</p><p role="status">{playbackStatus}</p></div> : null}
  </section>;
}

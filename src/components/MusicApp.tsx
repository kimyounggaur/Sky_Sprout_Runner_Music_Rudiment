import { useEffect, useRef, useState } from 'react';
import { DEFAULT_EXERCISE_ID, MUSIC_EXERCISES, MUSIC_MODULES, getExercise } from '../game/music/curriculum';
import type { Exercise } from '../game/music/domain';
import { createRewardLedger, MusicSession, type AttemptRecord, type MusicSettings, type RewardLedger, type SkipReason } from '../game/music/session';
import { MusicProgressStore, type ProgressResult } from '../game/music/persistence';
import { MusicPractice } from './MusicPractice';
import { MusicEvidenceReport } from './MusicEvidenceReport';
import { MusicPracticeSupport } from './MusicPracticeSupport';
import '../styles/music.css';

const ASSETS = `${import.meta.env.BASE_URL}music-assets/raster/`;
const GROUPS = [
  { id: 'foundation', title: '음악의 첫걸음', subtitle: '음높이 · 리듬 · 화음', icon: '01' },
  { id: 'jazz', title: '재즈 화성의 길', subtitle: '보이싱 · 진행 · 모드', icon: '02' },
  { id: 'creative', title: '나만의 음악', subtitle: '즉흥 · 합주 · 작품', icon: '03' },
  { id: 'experimental', title: '실험 온실', subtitle: '다른 가능성 탐색', icon: '04' }
] as const;

export function MusicApp({ onBack, onEditor, initialExercise, initialExercises, previewOnly = false }: { onBack: () => void; onEditor?: () => void; initialExercise?: Exercise; initialExercises?: readonly Exercise[]; previewOnly?: boolean }) {
  const [store] = useState(() => new MusicProgressStore());
  const suppliedExercises = initialExercises ?? (initialExercise ? [initialExercise] : undefined);
  const [initial] = useState<ProgressResult>(() => {
    const saved = store.load();
    return previewOnly ? { ...saved, message: '교사 테스트 플레이 · 기록과 보상은 이 미리보기에서만 유지됩니다.', envelope: { ...saved.envelope, ledger: createRewardLedger('teacher-preview'), attempts: [] } } : saved;
  });
  const [saveResult, setSaveResult] = useState<ProgressResult>(initial);
  const [settings, setSettings] = useState<MusicSettings>(() => ({ ...initial.envelope.settings, reducedMotion: initial.envelope.settings.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches }));
  const [ledger, setLedger] = useState(initial.envelope.ledger);
  const [attempts, setAttempts] = useState<readonly AttemptRecord[]>(initial.envelope.attempts);
  const [current, setCurrent] = useState<MusicSession | null>(() => suppliedExercises?.[0] ? new MusicSession(suppliedExercises[0], initial.envelope.ledger, initial.envelope.settings) : null);
  const [group, setGroup] = useState<(typeof GROUPS)[number]['id']>('foundation');
  const [query, setQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const sessions = useRef(new Map<string, MusicSession>());
  const ledgerRef = useRef(ledger);
  const attemptsRef = useRef(attempts);
  const settingsRef = useRef(settings); settingsRef.current = settings;
  const saveQueue = useRef(Promise.resolve());
  const mounted = useRef(true);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const groupTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const save = (newLedger = ledgerRef.current, newAttempts = attemptsRef.current, newSettings = settingsRef.current) => {
    if (previewOnly) return;
    const payload = { ledger: newLedger, attempts: newAttempts, settings: newSettings };
    saveQueue.current = saveQueue.current.then(async () => { const result = await store.save(payload); if (mounted.current) setSaveResult(result); });
  };
  const record = (newLedger: RewardLedger, attempt: AttemptRecord) => {
    const keys = [...new Set([...ledgerRef.current.keys, ...newLedger.keys])];
    newLedger = { ...ledgerRef.current, keys, balance: keys.length };
    ledgerRef.current = newLedger; setLedger(newLedger);
    const records = [...attemptsRef.current.filter(a => a.attemptId !== attempt.attemptId), attempt].slice(-200);
    attemptsRef.current = records; setAttempts(records); save(newLedger, records);
  };
  const open = (exercise: Exercise) => {
    const key = `${exercise.id}:${exercise.contentVersion}:${JSON.stringify(settings)}`;
    let session = sessions.current.get(key);
    if (!session) { session = new MusicSession(exercise, ledgerRef.current, settings); sessions.current.set(key, session); }
    session.syncLedger(ledgerRef.current); session.resume();
    setCurrent(session); setShowReport(false); setShowSettings(false);
  };
  const backToMap = () => { if (suppliedExercises) { onBack(); return; } setCurrent(null); requestAnimationFrame(() => titleRef.current?.focus()); };
  const completed = new Set(attempts.filter(a => a.completed).map(a => a.contentId));
  const routeExercises = suppliedExercises ?? MUSIC_EXERCISES;
  const currentIndex = current ? routeExercises.findIndex(e => e.id === current.getSnapshot().contentId) : -1;
  const nextExercise = currentIndex >= 0 ? routeExercises[currentIndex + 1] : undefined;
  const currentAttempt = current ? attempts.find(attempt => attempt.attemptId === current.getSnapshot().attemptId) ?? current.getRecord() : undefined;
  const reflect = (text: string) => { if (current) { current.setReflection(text); record(current.getLedger(), current.getRecord()); } };
  const skip = (reason: SkipReason, targetId?: string) => {
    if (current) { current.recordSkip(reason, targetId); record(current.getLedger(), current.getRecord()); }
    const destination = targetId ? routeExercises.find(item => item.id === targetId) ?? getExercise(targetId) : undefined;
    if (destination) open(destination); else backToMap();
  };
  const updateSettings = (patch: Partial<MusicSettings>) => { const next = { ...settings, ...patch }; setSettings(next); settingsRef.current = next; save(ledgerRef.current, attemptsRef.current, next); };
  const exportReport = () => {
    const blob = new Blob([JSON.stringify({ schemaVersion: 1, description: '최근 200회 로컬 연습 기록. 사용자 직접 작성 자기평가·건너뛰기 이유 포함. 녹음·자동 숙달 판단 없음.', ledger, attempts }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'sky-sprout-learning.json'; link.click(); URL.revokeObjectURL(link.href);
  };

  return <section className={`music-app ${settings.reducedMotion ? 'reduce-motion' : ''}`} aria-label="Sky Sprout 음악 정원">
    <header className="music-header"><button type="button" className="music-brand" onClick={current ? backToMap : onBack}><img src={`${ASSETS}sprout-idle.png`} alt="" /><span>SKY SPROUT<small>음악이 자라는 하늘 정원</small></span></button><nav aria-label="음악 정원 메뉴"><span className="seed-balance"><img src={`${ASSETS}light-seed.png`} alt="" />수업 보상 <strong data-testid="music-balance">{ledger.balance}</strong></span>{!current && <><button type="button" aria-expanded={showReport} onClick={() => { setShowReport(!showReport); setShowSettings(false); }}>학습 기록</button><button type="button" aria-expanded={showSettings} onClick={() => { setShowSettings(!showSettings); setShowReport(false); }}>연습 설정</button></>}<button type="button" onClick={onBack}>{previewOnly ? '편집기로' : '메인 메뉴'}</button></nav></header>
    <div className="music-body">
      {current ? <><MusicPractice key={current.getSnapshot().sessionId} session={current} ledger={ledger} onRecord={record} onBack={backToMap} onNext={nextExercise ? () => open(nextExercise) : undefined} />{currentAttempt && <MusicPracticeSupport key={currentAttempt.attemptId} exercise={current.getSnapshot().exercise} attempt={currentAttempt} nextExercise={nextExercise} onReflection={reflect} onSkip={skip} onRecommendation={id => skip('need_different_input', id)} />}</> : <>
        {showSettings && <section className="music-settings" aria-label="연습 설정"><div className="section-heading"><h2>나에게 맞는 연습</h2><button type="button" onClick={() => setShowSettings(false)}>닫기</button></div><p>설정은 새로 여는 시도에 적용됩니다. 이전 시도의 표기와 도움 기록은 유지돼요.</p><div className="settings-grid"><label>계이름<select value={settings.solfege} onChange={e => updateSettings({ solfege: e.target.value as MusicSettings['solfege'] })}><option value="fixed_do">고정도 · F는 파</option><option value="movable_do">이동도 · 중심음은 도</option></select></label><label>도움 정도<select value={settings.mode} onChange={e => updateSettings({ mode: e.target.value as MusicSettings['mode'] })}><option value="guided">안내 · 다음 목표 표시</option><option value="practice">적용 · 목표 힌트 감추기</option></select></label><label className="music-check"><input type="checkbox" checked={settings.safeSelection} onChange={e => updateSettings({ safeSelection: e.target.checked })} />안전 선택을 펼쳐 시작</label><label className="music-check"><input type="checkbox" checked={settings.reducedMotion} onChange={e => updateSettings({ reducedMotion: e.target.checked })} />반복 움직임 줄이기</label></div></section>}
        {showReport && <MusicEvidenceReport attempts={attempts} balance={ledger.balance} onClose={() => setShowReport(false)} onExport={exportReport} />}
        <section className="music-hero"><div className="hero-copy"><span className="music-eyebrow">PLAY · LISTEN · GROW</span><h1 ref={titleRef} tabIndex={-1}>한 번의 점프,<br /><em>하나의 음악.</em></h1><p>새싹과 함께 구름길을 건너며<br />음이름부터 나만의 재즈까지 만나 보세요.</p><button type="button" className="music-primary" onClick={() => open(getExercise(DEFAULT_EXERCISE_ID)!)}>도–미–솔, 첫 연습 시작 <span>→</span></button><span className="hero-footnote">시간 제한 없이 · 무음으로도 · 나의 속도로</span></div><div className="hero-art" aria-hidden="true"><img className="hero-island" src={`${ASSETS}platform-meadow.png`} alt="" /><img className="hero-sprout" src={`${ASSETS}sprout-jump.png`} alt="" /><span className="floating-note note-one">도 <small>C4</small></span><span className="floating-note note-two">미 <small>E4</small></span><span className="floating-note note-three">솔 <small>G4</small></span><span className="art-caption">작은 씨앗에서 시작하는 음악 여행</span></div></section>
        <div className="section-heading map-heading"><div><span className="music-eyebrow">YOUR LEARNING MAP</span><h2>오늘은 어떤 길을 걸어볼까요?</h2></div><label className="music-search"><span className="sr-only">활동 검색</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="음정, 보이싱, F02…" /></label></div>
        <div className="music-path-tabs" role="tablist" aria-label="학습 영역">{GROUPS.map((item, index) => <button type="button" role="tab" id={`music-area-${item.id}`} ref={element => { groupTabRefs.current[index] = element; }} tabIndex={group === item.id ? 0 : -1} aria-selected={group === item.id} aria-controls="music-module-list" key={item.id} onClick={() => setGroup(item.id)} onKeyDown={event => {
          const next = event.key === 'ArrowRight' ? (index + 1) % GROUPS.length : event.key === 'ArrowLeft' ? (index + GROUPS.length - 1) % GROUPS.length : event.key === 'Home' ? 0 : event.key === 'End' ? GROUPS.length - 1 : undefined;
          if (next === undefined) return;
          event.preventDefault(); setGroup(GROUPS[next].id); groupTabRefs.current[next]?.focus();
        }}><span>{item.icon}</span><div><b>{item.title}</b><small>{item.subtitle}</small></div><i>↗</i></button>)}</div>
        <div id="music-module-list" className="music-module-grid" role="tabpanel" aria-labelledby={`music-area-${group}`}>{MUSIC_MODULES.filter(m => m.group === group && `${m.id} ${m.title}`.toLowerCase().includes(query.toLowerCase())).map((module, i) => {
          const exercises = module.exerciseIds.map(id => getExercise(id)).filter((e): e is Exercise => !!e);
          const done = exercises.filter(e => completed.has(e.id)).length;
          return <article className={`module-card ${module.status === 'deferred' ? 'is-deferred' : ''}`} key={module.id} data-module-id={module.id}><div className="module-top"><span className="module-id">{module.id}</span><span>{done ? `✓ ${done}개 조건 충족` : module.status === 'deferred' ? '준비 중' : group === 'experimental' ? '실험 예시' : '연습 예시'}</span></div><span className="module-illustration" aria-hidden="true">{['♩', '♫', '♬', '♭', '♮', '♯'][i % 6]}</span><h3>{module.title}</h3><p>{module.scopeNote}</p><div className="module-actions">{exercises.map(e => <button type="button" key={e.id} data-exercise-id={e.id} onClick={() => open(e)}><span>{e.id === 'f02-c' ? 'C · 도–미–솔' : e.id === 'f02-f' ? 'F · 파–라–도' : exercises.length === 1 ? '연습 시작' : e.title}</span><b>→</b></button>)}</div></article>;
        })}</div>
        <section className="music-teacher-callout"><span aria-hidden="true">✎</span><div><h2>우리 수업에 맞는 음악 섬</h2><p>Sky Forge에서 목표와 음블록을 편집하고, 검증한 뒤 직접 플레이해 보세요.</p></div>{onEditor && <button type="button" onClick={onEditor}>교사 음악 편집기 →</button>}</section>
      </>}
      <footer className="music-footer"><p role="status" data-testid="music-save-status">{saveResult.message}</p><span>SKY SPROUT · 이 기기의 연습 정원</span></footer>
    </div>
  </section>;
}

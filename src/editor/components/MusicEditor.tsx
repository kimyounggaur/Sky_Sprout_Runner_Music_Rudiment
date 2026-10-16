import { useEffect, useRef, useState } from 'react';
import { getExercise, MUSIC_EXERCISES, MUSIC_MODULES } from '../../game/music/curriculum';
import { validateExercise, isMusicExercise } from '../../game/music/contentValidation';
import { createMusicTemplate, parseLessonPackage, type LessonPackage } from '../../game/music/lessonPackage';
import { evaluateAnswer, optionLabel, type Exercise } from '../../game/music/domain';
import '../../styles/music.css';

interface Props { open: boolean; lesson?: LessonPackage; onClose: () => void; onApply: (lesson: LessonPackage) => void; onTest: (exercise: Exercise) => void }
const json = (value: unknown) => JSON.stringify(value, null, 2);
const fresh = (exercise: Exercise): Exercise => ({ ...JSON.parse(json(exercise)) as Exercise, id: `teacher-${exercise.id}-${Date.now().toString(36)}`, contentVersion: '1.0.0', reviewStatus: 'expert_review_required' });
const bumpVersion = (value: string | undefined) => { const parts = (value ?? '1.0.0').split('.').map(Number); return parts.length === 3 && parts.every(Number.isFinite) ? `${parts[0]}.${parts[1]}.${parts[2] + 1}` : '1.0.1'; };

export function MusicEditor({ open, lesson, onClose, onApply, onTest }: Props) {
  const [draft, setDraft] = useState(() => json(lesson?.exercises[0] ?? fresh(getExercise('f02-c')!)));
  const [template, setTemplate] = useState('f02-c');
  const [seed, setSeed] = useState(1);
  const [message, setMessage] = useState('목표와 음블록을 수정한 뒤 검증해 보세요.');
  const [history, setHistory] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);
  const [witness, setWitness] = useState('');
  const [witnessResult, setWitnessResult] = useState('');
  const panel = useRef<HTMLElement>(null);
  let raw: unknown;
  let parseError = '';
  try { raw = JSON.parse(draft); } catch { parseError = 'JSON 구문을 확인하세요. 입력 원문은 그대로 보존했습니다.'; }
  const issues = parseError ? [{ severity: 'error' as const, path: 'JSON', message: parseError }] : validateExercise(raw);
  const exercise: Exercise | null = !parseError && isMusicExercise(raw) ? raw : null;
  const editable = !parseError && raw && typeof raw === 'object' && !Array.isArray(raw)
    ? raw as Record<string, unknown> : null;
  const showFields = editable && typeof editable.title === 'string' && typeof editable.objective === 'string';
  const errors = issues.filter(i => i.severity === 'error');
  const targetIds = editable && Array.isArray(editable.target) && editable.target.every(id => typeof id === 'string') ? editable.target as string[] : [];

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => previous?.focus();
  }, [open]);
  if (!open) return null;

  const edit = (next: string) => { setHistory(h => [...h.slice(-49), draft]); setFuture([]); setDraft(next); setWitnessResult(''); };
  const setField = (key: 'title' | 'objective', value: string) => {
    if (!editable) return;
    // Keep the form usable while a required field is temporarily empty. A prompt
    // that was customized independently remains independent of the short goal.
    const next = { ...editable, [key]: value };
    if (key === 'objective' && editable.prompt === editable.objective) next.prompt = value;
    edit(json(next));
  };
  const moveTarget = (index: number, direction: -1 | 1) => {
    if (!editable || index + direction < 0 || index + direction >= targetIds.length) return;
    const target = [...targetIds];
    [target[index], target[index + direction]] = [target[index + direction], target[index]];
    edit(json({ ...editable, target }));
  };
  const convertListeningDemo = () => {
    if (!editable) return;
    edit(json({ ...editable, kind: 'contextual_choice', learningPurpose: 'theory_demo', answerDisplay: 'visible', assessmentDomain: 'symbolic_theory', title: `${String(editable.title)} · 기호 이해`, objective: '표시된 예시와 기호의 관계를 살펴보고 선택해요. 청음 숙달은 측정하지 않아요.', prompt: '예시를 보고 기호의 관계를 확인하세요. 이 활동은 듣기 평가가 아닙니다.' }));
    setMessage('명칭·목표·평가 영역을 기호 이해 시범으로 바꿨어요. 활동 설명과 후보 표찰도 수업 의도에 맞게 검토해 주세요.');
  };
  const apply = () => {
    if (!exercise) return;
    const old = lesson?.exercises.find(e => e.id === exercise.id);
    const next = old && json(old) !== json(exercise) ? { ...exercise, contentVersion: bumpVersion(old.contentVersion) } : exercise;
    const exercises = [...(lesson?.exercises ?? []).filter(e => e.id !== next.id), next];
    const validated = parseLessonPackage({ schemaVersion: 1, safeRoom: true, exercises });
    if (!validated.ok) { setMessage(validated.error); return; }
    onApply(validated.value);
    setDraft(json(next)); setMessage('레벨에 반영했어요. 편집기의 Save로 기기에 저장하고, Undo로 적용을 되돌릴 수 있어요.');
  };
  const exportDraft = () => {
    if (!exercise) return;
    const blob = new Blob([json({ schemaVersion: 1, safeRoom: true, exercises: [exercise] })], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'sky-sprout-music-lesson.json'; link.click(); URL.revokeObjectURL(link.href);
    setMessage('목표·음·정답 조건·피드백을 담은 음악 패키지를 내보냈어요. 학습자 기록은 포함하지 않아요.');
  };
  const importFile = async (file: File) => {
    const text = await file.text();
    try { const value: unknown = JSON.parse(text); const result = parseLessonPackage(value); if (result.ok) { edit(json(result.value.exercises[0])); setMessage(`음악 패키지 ${result.value.exercises.length}개 활동을 확인했어요. 첫 활동을 열었고, 전체 패키지를 레벨에 적용했어요.`); onApply(result.value); } else { edit(text); setMessage(result.error); } }
    catch { edit(text); setMessage('읽은 원문을 보존했습니다. JSON 구문을 수정해 주세요.'); }
  };

  return <section className="music-editor" role="dialog" aria-modal="true" aria-label="Sky Forge 음악 편집기" ref={panel} onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
    if (event.key === 'Tab') {
      const focusable = [...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, textarea, [tabindex="0"]') ?? [])];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}><div className="music-editor-body">
    <header><div><span className="music-eyebrow">SKY FORGE · MUSIC WORKSHOP</span><h1>우리 수업의 음악 섬 만들기</h1></div><button type="button" onClick={onClose}>편집기로 돌아가기</button></header>
    <div className="music-editor-layout"><aside className="music-editor-panel"><label>검증된 예시에서 시작<select value={template} onChange={e => setTemplate(e.target.value)}>{MUSIC_EXERCISES.map(e => <option key={e.id} value={e.id}>{e.moduleId} · {e.title}</option>)}</select></label><button type="button" onClick={() => { edit(json(fresh(getExercise(template)!))); setMessage('예시를 새 ID로 복사했어요. 원본 과제와 보상은 분리됩니다.'); }}>새 과제로 복사</button><hr /><h2>조옮김 음블록 생성</h2><p>C 화음의 간격을 유지해 조와 음역을 바꾸는 로컬 템플릿입니다.</p><label>재현 seed<input type="number" value={seed} onChange={e => setSeed(Number(e.target.value))} /></label><button type="button" disabled={!Number.isSafeInteger(seed)} onClick={() => edit(json(createMusicTemplate(seed, getExercise('f02-c')!)))}>음블록 생성</button><div className="music-editor-list"><h2>레벨의 음악 활동</h2>{lesson?.exercises.length ? lesson.exercises.map(e => <button type="button" key={e.id} onClick={() => edit(json(e))}>{e.moduleId} · {e.title}</button>) : <p>아직 레벨에 적용한 활동이 없어요.</p>}</div><p>카탈로그 {MUSIC_MODULES.length}개 개념 · 기기 입력과 문화별 전문 검토가 필요한 X07·X08은 준비 중입니다.</p></aside>
    <div className="music-editor-panel"><div className="music-editor-summary"><span>피해 없음</span><span>시간 제한 없음</span><span>안전 선택 가능</span><span>최초 완료 보상 1개</span></div>
      {showFields && <><label>과제 이름<input value={editable.title as string} onChange={e => setField('title', e.target.value)} /></label><label>학생에게 보이는 목표<input value={editable.objective as string} onChange={e => setField('objective', e.target.value)} /></label></>}
      {editable && <><div className="music-editor-contract"><label>학습 목적<select value={String(editable.learningPurpose ?? '')} onChange={e => { const next = { ...editable }; if (e.target.value) next.learningPurpose = e.target.value; else delete next.learningPurpose; edit(json(next)); }}><option value="">현재 판정에서 추론</option><option value="follow_pattern">지정 패턴 따라 만들기</option><option value="create_phrase">공개 조건으로 자유 구절 창작</option><option value="listen">소리를 듣고 구별</option><option value="theory_demo">기호 이해·시범</option></select></label><label>정답 예시 표시<select value={String(editable.answerDisplay ?? 'hidden')} onChange={e => edit(json({ ...editable, answerDisplay: e.target.value }))}><option value="hidden">적용 모드에서 숨김</option><option value="visible">항상 표시 · 안내/시범용</option></select></label></div>
        {editable.kind === 'listen_identify' && <div className="music-editor-issues"><strong>청음 평가의 답 노출 확인</strong><p>안내 모드나 도움으로 답이 보이면 청음은 미측정입니다. 후보 표찰에 정답 음명을 쓰는 등 소리 없이 풀 수 있는지도 검토하세요.</p><button type="button" onClick={convertListeningDemo}>기호 이해 시범으로 목적·명칭 변경</button></div>}
        {targetIds.length > 0 && <section aria-label="목표 순서 편집"><h2>목표·예시 순서</h2><p>앞으로/뒤로 버튼은 키보드로도 조작할 수 있어요. 창작 활동에서는 이 배열이 가능한 예시이며 유일한 정답이 아닙니다.</p><ol className="music-target-editor">{targetIds.map((id, index) => <li key={`${id}-${index}`}><span>{index + 1}. {exercise ? optionLabel(exercise, id) : id}</span><button type="button" aria-label={`${index + 1}번째 목표 앞으로 이동`} disabled={index === 0} onClick={() => moveTarget(index, -1)}>← 앞으로</button><button type="button" aria-label={`${index + 1}번째 목표 뒤로 이동`} disabled={index === targetIds.length - 1} onClick={() => moveTarget(index, 1)}>뒤로 →</button></li>)}</ol></section>}
      </>}
      <label>음악 과제 JSON · 목표, 문맥, 음, 조건, 피드백<textarea aria-label="음악 과제 JSON" spellCheck={false} value={draft} onChange={e => edit(e.target.value)} /></label>
      <div className="music-actions"><button type="button" disabled={!history.length} onClick={() => { setFuture(f => [draft, ...f]); setDraft(history[history.length - 1]); setHistory(h => h.slice(0, -1)); }}>수정 되돌리기</button><button type="button" disabled={!future.length} onClick={() => { setHistory(h => [...h, draft]); setDraft(future[0]); setFuture(f => f.slice(1)); }}>수정 다시 실행</button></div>
      <div className="music-editor-issues" aria-label="음악 검증 결과"><strong>{errors.length ? `${errors.length}개 오류를 수정하세요` : '기본 음악 계약 검증 통과'}</strong><ul>{issues.map((issue, i) => <li key={i} className={issue.severity}>{issue.severity === 'error' ? '오류' : '검토'} · {issue.path}: {issue.message}</li>)}</ul><p>자동 검증은 음악적 자연스러움과 실제 점프 도달성을 인증하지 않습니다. 안전 선택과 테스트 플레이로 확인하세요.</p></div>
      <label>대안 답 시험 · 선택 ID를 쉼표로 구분<input value={witness} onChange={e => setWitness(e.target.value)} placeholder="C4, E4, G4" /></label><button type="button" disabled={!exercise} onClick={() => { if (exercise) { const result = evaluateAnswer(exercise, witness.split(',').map(s => s.trim()).filter(Boolean)); setWitnessResult(`${result.outcome}: ${result.message}`); } }}>이 답의 조건 확인</button><p role="status">{witnessResult}</p>
      <div className="music-actions"><button type="button" className="music-primary" disabled={!exercise} onClick={apply}>검증 후 레벨에 적용</button><button type="button" disabled={!exercise} onClick={() => exercise && onTest(exercise)}>음악 테스트 플레이</button><button type="button" disabled={!exercise} onClick={exportDraft}>음악 JSON 내보내기</button><label>음악 JSON 가져오기<input type="file" accept=".json,application/json" onChange={e => { if (e.target.files?.[0]) void importFile(e.target.files[0]); e.target.value = ''; }} /></label></div>
      <p className="music-editor-preflight" role="status">{message}</p>
    </div></div>
  </div></section>;
}

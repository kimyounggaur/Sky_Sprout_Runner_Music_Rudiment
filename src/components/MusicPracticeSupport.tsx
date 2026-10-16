import { useState } from 'react';
import type { Exercise } from '../game/music/domain';
import { recommendedExercises, shouldOfferSupport, SKIP_REASONS } from '../game/music/evidence';
import type { AttemptRecord, SkipReason } from '../game/music/session';
import './MusicEvidence.css';

export function MusicPracticeSupport({ exercise, attempt, nextExercise, onReflection, onSkip, onRecommendation }: {
  exercise: Exercise; attempt: AttemptRecord; nextExercise?: Exercise;
  onReflection: (text: string) => void; onSkip: (reason: SkipReason, targetId?: string) => void;
  onRecommendation: (id: string) => void;
}) {
  const [reflection, setReflection] = useState(attempt.reflection?.text ?? '');
  const [saved, setSaved] = useState(false);
  const [reason, setReason] = useState<SkipReason | ''>('');
  const recommendations = recommendedExercises(exercise.moduleId);
  const creative = exercise.kind === 'creative_phrase' || exercise.assessmentDomain === 'constrained_composition';
  const supportSuggested = shouldOfferSupport(attempt);

  return <div className="practice-support">
    {creative && <section className="practice-reflection" aria-label="창작 자기평가">
      <h2>내 작품 돌아보기</h2>
      <p>마음에 드는 선택, 고쳐 보고 싶은 부분, 다음에 시도할 것을 적어 보세요. 적은 내용은 자동 점수와 별개로 이 시도에 보관됩니다.</p>
      <label htmlFor={`reflection-${attempt.attemptId}`}>나의 자기평가</label>
      <textarea id={`reflection-${attempt.attemptId}`} value={reflection} maxLength={1000} rows={4} onChange={event => { setReflection(event.target.value); setSaved(false); }} placeholder="예: 마지막 E로 돌아오는 느낌이 마음에 들어요. 다음에는 쉼을 넣고 싶어요." />
      <div className="music-actions"><button type="button" onClick={() => { onReflection(reflection); setSaved(true); }}>자기평가 저장</button><span>{reflection.length} / 1000자</span></div>
      {saved && <p role="status">자기평가를 현재 시도에 기록했어요. 기기 저장 상태는 아래 표시를 확인하세요.</p>}
    </section>}
    {!attempt.completed && <section className="practice-options" aria-label="나에게 맞는 다음 연습">
      <h2>{supportSuggested ? '다른 방법으로 이어가도 좋아요' : '원하는 순서로 연습하기'}</h2>
      {supportSuggested && <p role="status">같은 활동을 다시 시도했어요. 도움 보기·안전 선택을 이용하거나 아래의 관련 연습으로 이동할 수 있어요. 생명·점수·진도는 줄지 않습니다.</p>}
      {recommendations.length > 0 && <details open={supportSuggested || undefined}><summary>함께 연습하면 좋은 기초</summary><p>추천 경로이며 필수 잠금이나 능력 진단이 아닙니다.</p><div className="music-actions">{recommendations.map(item => <button key={item.id} type="button" onClick={() => onRecommendation(item.id)}>{item.moduleId} · {item.title}</button>)}</div></details>}
      <div className="practice-skip"><label>건너뛰는 이유<select value={reason} onChange={event => setReason(event.target.value as SkipReason | '')}><option value="">이유 선택</option>{Object.entries(SKIP_REASONS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><button type="button" disabled={!reason} onClick={() => reason && onSkip(reason, nextExercise?.id)}>{nextExercise ? '다음 활동으로 직접 건너뛰기' : '지도에서 다른 활동 고르기'}</button></div>
      <p>직접 선택한 이유만 기록합니다. 진단검사를 대신하거나 건너뛴 내용을 숙달했다고 표시하지 않습니다.</p>
    </section>}
  </div>;
}

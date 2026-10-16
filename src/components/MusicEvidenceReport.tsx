import { MUSIC_EXERCISES } from '../game/music/curriculum';
import { SKIP_REASONS, summarizeAttempt } from '../game/music/evidence';
import type { AttemptRecord } from '../game/music/session';
import './MusicEvidence.css';

export function MusicEvidenceReport({ attempts, balance, onClose, onExport }: {
  attempts: readonly AttemptRecord[]; balance: number; onClose: () => void; onExport: () => void;
}) {
  const originalCompleted = new Set(attempts.filter(item => item.completed && item.assessmentDomain !== 'transfer_pitch_order').map(item => item.contentId));
  const transferCompleted = new Set(attempts.filter(item => item.completed && item.assessmentDomain === 'transfer_pitch_order').map(item => item.contentId));
  return <section className="music-report" aria-label="학습 기록">
    <div className="section-heading"><h2>작은 연습의 기록</h2><button type="button" onClick={onClose}>닫기</button></div>
    <p>완료는 각 활동의 공개 조건 충족입니다. 안내·시범·안전 선택과 이동 사건을 함께 보며, 장기 숙달을 추정하지 않습니다. 입력 전의 경로는 시작 설정을 보여줍니다.</p>
    <div className="report-summary"><span>기록한 시도 <b>{attempts.length}</b></span><span>일반 활동 조건 충족 <b>{originalCompleted.size}</b></span><span>위치 변경 조건 충족 <b>{transferCompleted.size}</b></span><span>수업 보상 <b>{balance}</b></span></div>
    {attempts.length ? <div className="evidence-attempts">{[...attempts].reverse().map(attempt => {
      const summary = summarizeAttempt(attempt);
      const exercise = MUSIC_EXERCISES.find(item => item.id === attempt.contentId);
      return <article key={attempt.attemptId} className="evidence-attempt" data-attempt-content-id={attempt.contentId}>
        <div className="section-heading"><h3>{attempt.moduleId} · {exercise?.title ?? attempt.contentId}</h3><span>{summary.result}</span></div>
        <dl className="evidence-metrics">
          <div><dt>관찰한 영역</dt><dd>{summary.domain}</dd></div>
          <div><dt>도움 조건</dt><dd>{summary.supports.length ? summary.supports.join(' · ') : '기록한 안내·힌트·시범 없음'}</dd></div>
          <div><dt>입력 경로</dt><dd>{summary.input}</dd></div>
          <div><dt>낙하 / 미등록 접촉</dt><dd>{attempt.motorEvents}회 / {attempt.invalidEvents}회</dd></div>
          <div><dt>음악 조건 불일치</dt><dd>{attempt.conditionMismatches}회 · 이동 사건 제외</dd></div>
          <div><dt>조건 확인 제출</dt><dd>{attempt.submissionCount === undefined ? '이전 기록에 없음' : `${attempt.submissionCount}회`}</dd></div>
        </dl>
        <p className="evidence-observation">{summary.motorObservation}</p>
        <p><strong>미측정 영역:</strong> {summary.unmeasured.join(' · ')}</p>
        {attempt.assessmentDomain === 'listening' && !summary.listeningValid && <p>청음 환경: {attempt.environmentValidity.muted ? '무음' : !attempt.environmentValidity.audioAvailable ? '소리 확인 없음' : attempt.environmentValidity.answerExposed ? '답 노출' : '중단'}으로 청음 성공을 확정하지 않습니다.</p>}
        {summary.transfer && <p>원본 안내 활동과 별도 기록입니다. 위치만 바꾼 같은 지정 순서의 확인이며 청음·화성 기능의 숙달 증거는 아닙니다.</p>}
        {attempt.navigationDecision && <p>당시 건너뛴 이유: {SKIP_REASONS[attempt.navigationDecision.reason]}{attempt.navigationDecision.targetContentId ? ` · 이동 활동 ${attempt.navigationDecision.targetContentId}` : ' · 지도에서 직접 선택'}. {attempt.completed ? '이후 돌아와 위 활동 조건을 충족했습니다. 당시 건너뛰기는 진단·숙달 증거가 아닙니다.' : '진단검사를 실시하지 않았으며 완료·숙달로 간주하지 않습니다.'}</p>}
        {attempt.reflection?.text && <blockquote className="evidence-reflection"><strong>내가 적은 자기평가</strong><p>{attempt.reflection.text}</p><small>자동 점수나 교사 평가가 아닌 사용자 작성 기록</small></blockquote>}
        <details><summary>답과 기록 조건 보기</summary><p>선택한 답: {attempt.answerSnapshot.length ? attempt.answerSnapshot.join(' → ') : '아직 선택 없음'}</p><p>콘텐츠 {attempt.contentVersion} · {attempt.notationProfile.solfege === 'fixed_do' ? '고정도' : '이동도'} · 시도 {attempt.attemptId}</p></details>
      </article>;
    })}</div> : <p>첫 연습의 기록을 기다리고 있어요.</p>}
    <p>최근 200회만 이 기기에 저장합니다. 내보내기에는 응답·도움·입력·환경·사용자 자기평가가 포함됩니다. 녹음은 포함하지 않습니다.</p>
    <button type="button" onClick={onExport}>기록 JSON 내보내기</button>
  </section>;
}

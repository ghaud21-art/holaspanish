'use client';
import { useApp } from '../AppContext';
import { CURRICULUM, findChapter } from '../../data/curriculum';
import ShareCardButton from '../ShareCardButton';

function Check() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function Lock() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function ChapterList() {
  const { profile, isChapterDone, isChapterCurrent, isChapterLocked, openChapter } = useApp();

  return (
    <div>
      <h1>챕터 학습</h1>
      <p className="text-muted" style={{ marginTop: -8 }}>Prep부터 B2까지, 하나의 커리큘럼으로 이어져요.</p>
      <div className="scroll-panel" style={{ marginTop: 8 }}>
        {CURRICULUM.map((lvl) => (
          <div key={lvl.key} style={{ marginTop: 24 }}>
            <h4 className="text-muted" style={{ marginBottom: 12 }}>{lvl.label}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
              {lvl.chapters.map((ch) => {
                const done = isChapterDone(ch.id);
                const current = isChapterCurrent(ch.id);
                const locked = isChapterLocked(ch.id);
                return (
                  <div
                    key={ch.id}
                    className="card elev-sm"
                    style={{ cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.5 : 1, border: current ? '1px solid var(--color-accent)' : '1px solid transparent' }}
                    onClick={() => openChapter(ch.id)}
                  >
                    <div className="card-kicker">{ch.grammarPoint ? lvl.levelTag : lvl.levelTag}</div>
                    <div className="card-title">{ch.titleEs}</div>
                    <p className="card-body">{ch.titleKr}</p>
                    <div className="card-meta">
                      {done && <><Check /><span>완료</span></>}
                      {current && !done && <><span style={{ color: 'var(--color-accent)' }}><Check /></span><span style={{ color: 'var(--color-accent)' }}>학습 중</span></>}
                      {locked && <><Lock /><span>잠김</span></>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChapterDetail() {
  const {
    openChapterId, closeChapter, chapterUi, flipCard, markCard, setWritingText, submitWriting, profile,
  } = useApp();
  const chapter = findChapter(openChapterId);
  const ui = chapterUi[openChapterId] || { flipped: false, queue: [], writingText: '', gradingStatus: 'idle', gradingResult: null };

  if (!chapter) return null;

  const hasVocab = !!(chapter.keyVocab && chapter.keyVocab.length);
  const queueEmpty = hasVocab && ui.queue.length === 0;
  const card = hasVocab && ui.queue.length ? chapter.keyVocab[ui.queue[0]] : null;
  const doneCount = hasVocab ? chapter.keyVocab.length - ui.queue.length : 0;

  return (
    <div style={{ maxWidth: 720 }}>
      <button type="button" className="btn btn-ghost" onClick={closeChapter} style={{ marginBottom: 12 }}>← 챕터 목록으로</button>
      <span className="tag tag-neutral">{chapter.levelTag}</span>
      <h1 style={{ marginTop: 8 }}>{chapter.titleEs}</h1>
      <p className="text-muted" style={{ marginTop: -8 }}>{chapter.titleKr}</p>

      {hasVocab && (
        <>
          <h3 style={{ marginTop: 28 }}>단어 카드</h3>
          <p className="text-muted" style={{ marginTop: -6, fontSize: 13 }}>{doneCount} / {chapter.keyVocab.length} 완료</p>

          {card && (
            <>
              <div className="card elev-md" onClick={flipCard} style={{ width: '100%', maxWidth: 380, minHeight: 180, justifyContent: 'center', alignItems: 'center', textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ fontSize: 26, fontWeight: 800 }}>{card.es}</div>
                {ui.flipped ? (
                  <div style={{ fontSize: 18, color: 'var(--color-accent)' }}>{card.kr}</div>
                ) : (
                  <div className="text-muted" style={{ fontSize: 11 }}>탭해서 뜻 보기</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => markCard(false)}>아직 몰라요</button>
                <button type="button" className="btn btn-primary" onClick={() => markCard(true)}>알아요</button>
              </div>
            </>
          )}
          {queueEmpty && (
            <div className="card elev-sm" style={{ maxWidth: 380 }}>
              <p className="card-body">이 챕터의 단어를 모두 학습했어요. 아래 예문도 살펴보세요.</p>
            </div>
          )}
        </>
      )}

      {!!(chapter.examples && chapter.examples.length) && (
        <>
          <h3 style={{ marginTop: 28 }}>예문</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {chapter.examples.map((ex) => (
              <div key={ex.es} className="card elev-sm" style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600 }}>{ex.es}</span><span className="text-muted">{ex.kr}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {!!chapter.writingPrompt && (
        <>
          <h3 style={{ marginTop: 28 }}>작문 제출</h3>
          <div className="field">
            <label>오늘의 작문 프롬프트</label>
            <p className="card-body" style={{ opacity: 1, fontSize: 14 }}>{chapter.writingPrompt}</p>
            <textarea
              className="input"
              rows={4}
              placeholder="스페인어로 작문해보세요"
              value={ui.writingText || ''}
              onChange={(e) => setWritingText(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={ui.gradingStatus === 'loading' || !ui.writingText || !ui.writingText.trim()}
            onClick={submitWriting}
          >
            제출하고 첨삭 받기
          </button>

          {ui.gradingStatus === 'loading' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
              <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round"><path d="M12 2a10 10 0 1 0 10 10" /></svg>
              <span className="text-muted">문장을 첨삭하고 있어요...</span>
            </div>
          )}
          {ui.gradingStatus === 'done' && ui.gradingResult && (
            <div className="card elev-md" style={{ marginTop: 16, gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={ui.gradingResult.passed ? 'tag tag-accent' : 'tag tag-neutral'}>{ui.gradingResult.score}점</span>
                <span style={{ fontWeight: 700 }}>{ui.gradingResult.passed ? '통과! 다음 챕터가 열렸어요' : '아쉬워요, 다시 도전해보세요'}</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, display: 'grid', gap: 4 }}>
                {ui.gradingResult.feedback.map((f) => <li key={f}>{f}</li>)}
              </ul>
              {ui.gradingResult.passed && (
                <ShareCardButton
                  label="이 챕터 완료 카드 저장·공유"
                  filename={`hola-${chapter.id}`}
                  eyebrow={chapter.levelTag}
                  title={chapter.titleKr}
                  subtitle={`"${ui.writingText}" · ${ui.gradingResult.score}점 통과`}
                  stats={[
                    { label: '통과 점수', value: `${ui.gradingResult.score}점` },
                    { label: '연속 학습', value: `${profile.streak}일` },
                    { label: '포인트', value: `${profile.points}P` },
                  ]}
                  quote={{ es: chapter.titleEs, kr: chapter.titleKr }}
                />
              )}
            </div>
          )}
        </>
      )}

      {!hasVocab && !(chapter.examples && chapter.examples.length) && !chapter.writingPrompt && (
        <p className="text-muted" style={{ marginTop: 20 }}>이 챕터는 준비 중이에요. 곧 단어와 예문이 채워질 예정이에요.</p>
      )}
    </div>
  );
}

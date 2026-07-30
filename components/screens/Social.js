'use client';
import { useState } from 'react';
import { useApp } from '../AppContext';
import { CURRICULUM } from '../../data/curriculum';

function NoGroupPrompt() {
  const { createGroup, joinGroup, showToast } = useApp();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <div style={{ maxWidth: 480 }}>
      <h1>스터디 그룹</h1>
      <p className="text-muted" style={{ marginTop: -8 }}>아직 가입한 그룹이 없어요. 새로 만들거나 초대 코드로 참여해보세요.</p>

      <div className="card elev-sm" style={{ marginTop: 20, gap: 10 }}>
        <div className="card-kicker">그룹 만들기</div>
        <input className="input" placeholder="그룹 이름 (예: 마드리드 클럽)" value={name} onChange={(e) => setName(e.target.value)} />
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await createGroup(name);
              showToast('그룹을 만들었어요!');
            } catch (err) {
              showToast(err.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          그룹 만들기
        </button>
      </div>

      <div className="card elev-sm" style={{ marginTop: 14, gap: 10 }}>
        <div className="card-kicker">초대 코드로 참여</div>
        <input className="input" placeholder="예: MADRID24" value={code} onChange={(e) => setCode(e.target.value)} />
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await joinGroup(code);
              showToast('그룹에 참여했어요!');
            } catch (err) {
              showToast(err.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          참여하기
        </button>
      </div>
    </div>
  );
}

export function GroupScreen() {
  const { myGroup, members, cheerMember, userId } = useApp();
  if (!myGroup) return <NoGroupPrompt />;

  const maxMinutes = Math.max(...members.map((m) => m.totalMinutes), 1);

  return (
    <div>
      <h1>{myGroup.name}</h1>
      <p className="text-muted" style={{ marginTop: -8 }}>
        초대 코드 <span className="tag tag-outline">{myGroup.inviteCode}</span> · 친구에게 공유해서 함께 공부해보세요.
      </p>
      <h3 style={{ marginTop: 24 }}>멤버별 누적 학습</h3>
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {members.map((m) => (
          <div key={m.userId} className="card elev-sm" style={{ gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-accent-100)', color: 'var(--color-accent-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {(m.nickname || '?')[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{m.nickname}{m.userId === userId ? ' (나)' : ''}</div>
                  <div className="text-muted" style={{ fontSize: 11 }}>연속 {m.streak}일 · {m.points}P</div>
                </div>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => cheerMember(m.userId)}>응원 보내기 ({m.cheers})</button>
            </div>
            <div style={{ height: 8, background: 'var(--color-surface)', border: '1px solid var(--color-divider)' }}>
              <div style={{ height: '100%', width: `${Math.round((m.totalMinutes / maxMinutes) * 100)}%`, background: 'var(--color-accent)' }} />
            </div>
            <div className="text-muted" style={{ fontSize: 11 }}>누적 {Math.floor(m.totalMinutes / 60)}시간 {m.totalMinutes % 60}분</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 게시물 카드 하나. 댓글 입력창 상태는 카드 안에서 각자 관리해요.
function PostCard({ post }) {
  const { reactPost, commentPost, deleteComment, userId, profile } = useApp();
  const [draft, setDraft] = useState('');

  return (
    <div className="card elev-sm" style={{ gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700 }}>{post.nickname}</div>
        <span className={post.score >= 70 ? 'tag tag-accent' : 'tag tag-neutral'}>{post.score}점</span>
      </div>
      <div className="text-muted" style={{ fontSize: 11 }}>{post.chapterTitle}</div>
      <p className="card-body" style={{ opacity: 1, fontSize: 14 }}>{post.text}</p>
      <div style={{ display: 'grid', gap: 3 }}>
        {post.feedback.map((f) => <div key={f} className="text-muted" style={{ fontSize: 12 }}>· {f}</div>)}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {Object.entries(post.reactions).map(([emoji, count]) => (
          <button key={emoji} type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => reactPost(post.postId, emoji)}>
            {emoji} {count}
          </button>
        ))}
      </div>
      <div className="hr" style={{ margin: '6px 0' }} />
      <div style={{ display: 'grid', gap: 6 }}>
        {post.comments.map((c, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span><b>{c.nickname}</b> <span className="text-muted">{c.text}</span></span>
            {c.userId === userId && (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: 11, padding: '2px 6px', flexShrink: 0 }}
                onClick={() => deleteComment(post.postId, i)}
              >
                삭제
              </button>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="input"
          placeholder="응원 댓글 남기기"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={async () => {
            if (!draft.trim()) return;
            await commentPost(post.postId, userId, profile.nickname, draft);
            setDraft('');
          }}
        >
          등록
        </button>
      </div>
    </div>
  );
}

// "챕터학습" 탭: 레벨 카드를 고르면 그 레벨에서 내가 쓴 챕터 작문들을 3x3 그리드로 보여줘요.
function ChapterBoardTab({ posts }) {
  const [levelKey, setLevelKey] = useState(null);
  const chapterPosts = posts.filter((p) => p.chapterId && p.chapterId !== 'practice');

  const levelCounts = CURRICULUM.map((lvl) => {
    const ids = new Set(lvl.chapters.map((c) => c.id));
    const count = chapterPosts.filter((p) => ids.has(p.chapterId)).length;
    return { key: lvl.key, label: lvl.label, levelTag: lvl.levelTag, count };
  });

  if (!levelKey) {
    return (
      <div>
        <p className="text-muted" style={{ marginTop: 8 }}>레벨을 선택하면 그 레벨에서 작성한 작문을 모아볼 수 있어요.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginTop: 12 }}>
          {levelCounts.map((lp) => (
            <div key={lp.key} className="card elev-sm" style={{ cursor: 'pointer' }} onClick={() => setLevelKey(lp.key)}>
              <div className="card-kicker">{lp.levelTag}</div>
              <div className="card-title">{lp.label}</div>
              <p className="card-body" style={{ opacity: 1, fontSize: 13 }}>{lp.count}개의 작문</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const lvl = CURRICULUM.find((l) => l.key === levelKey);
  const ids = new Set(lvl.chapters.map((c) => c.id));
  const levelPosts = chapterPosts.filter((p) => ids.has(p.chapterId));

  return (
    <div>
      <button type="button" className="btn btn-ghost" onClick={() => setLevelKey(null)} style={{ marginBottom: 12 }}>
        ← 레벨 선택으로
      </button>
      <h3 style={{ marginTop: 0 }}>{lvl.label}</h3>
      {levelPosts.length === 0 && <p className="text-muted">아직 이 레벨에서 작성한 작문이 없어요.</p>}
      <div className="scroll-panel">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {levelPosts.map((p) => (
            <PostCard key={p.postId} post={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

// 작문 연습 중에 궁금한 걸 물어보는 힌트 챗봇. 정답 번역은 알려주지 않아요.
function PracticeHelper({ ui }) {
  const { askPracticeHelp } = useApp();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const helpChat = ui.helpChat || [];
  const busy = ui.helpStatus === 'loading';

  const send = (text) => {
    if (!text.trim() || busy) return;
    askPracticeHelp(text.trim());
    setInput('');
  };

  return (
    <div style={{ marginTop: 4 }}>
      <button type="button" className="btn btn-ghost" onClick={() => setOpen((v) => !v)}>
        {open ? '작문 도우미 닫기' : '💬 작문 도우미 (힌트 받기)'}
      </button>
      {open && (
        <div className="card elev-sm" style={{ marginTop: 10, gap: 10 }}>
          <p className="text-muted" style={{ margin: 0, fontSize: 12 }}>
            정답 번역은 알려주지 않고, 단어·표현 힌트만 줘요.
          </p>
          {helpChat.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
              {helpChat.map((m, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: m.role === 'user' ? 'var(--color-accent)' : 'var(--color-neutral-100)',
                    color: m.role === 'user' ? '#fff' : 'inherit',
                    border: m.role === 'user' ? 'none' : '1px solid var(--color-divider)',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: 13,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.text}
                </div>
              ))}
            </div>
          )}
          {busy && <span className="text-muted" style={{ fontSize: 12 }}>생각 중…</span>}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              placeholder="궁금한 걸 물어보세요 (예: '어제'는 스페인어로 뭐예요?)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send(input);
              }}
              style={{ flex: 1 }}
            />
            <button type="button" className="btn btn-primary" disabled={busy || !input.trim()} onClick={() => send(input)}>
              보내기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// "작문 연습" 탭: 지금까지 배운 범위에서 Gemini가 추천한 한국어 문장을 스페인어 두 문장 이상으로 번역해봐요.
function PracticeTab() {
  const { practiceUi, suggestPractice, setPracticeText, submitPractice, myPosts } = useApp();
  const practicePosts = myPosts.filter((p) => p.chapterId === 'practice');
  const sentenceCount = practiceUi.text.split(/[.!?¡¿]+/).map((s) => s.trim()).filter(Boolean).length;
  const enoughSentences = sentenceCount >= 2;
  const isDone = practiceUi.status === 'done' && practiceUi.result;

  return (
    <div style={{ maxWidth: 640 }}>
      <p className="text-muted" style={{ marginTop: 8 }}>
        지금까지 배운 단어와 문법 범위 안에서 연습하기 좋은 한국어 문장을 계속 추천받아서, 스페인어 두 문장 이상으로 작문해보세요.
      </p>
      {practiceUi.count > 0 && (
        <p className="text-muted" style={{ fontSize: 12, marginTop: -4 }}>지금까지 {practiceUi.count}개의 연습 문장을 완료했어요.</p>
      )}

      {!practiceUi.kr && (
        <button type="button" className="btn btn-primary" disabled={practiceUi.status === 'loading'} onClick={suggestPractice}>
          {practiceUi.status === 'loading' ? '추천받는 중...' : '연습 문장 추천받기'}
        </button>
      )}

      {practiceUi.kr && (
        <div className="card elev-md" style={{ marginTop: 16, gap: 12 }}>
          <div className="card-kicker">오늘의 연습 문장</div>
          <p className="card-title" style={{ fontWeight: 400, fontFamily: 'var(--font-body)' }}>{practiceUi.kr}</p>

          <div className="field">
            <label>스페인어로 두 문장 이상 작성해보세요</label>
            <textarea
              className="input"
              rows={4}
              placeholder="스페인어로 작문해보세요"
              value={practiceUi.text}
              onChange={(e) => setPracticeText(e.target.value)}
            />
          </div>

          <PracticeHelper ui={practiceUi} />

          {!enoughSentences && practiceUi.text.trim() && (
            <p className="text-muted" style={{ fontSize: 12, color: 'var(--color-accent)', margin: 0 }}>
              최소 두 문장 이상 작성해주세요.
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!enoughSentences || practiceUi.status === 'grading'}
              onClick={submitPractice}
            >
              {practiceUi.status === 'grading' ? '채점 중...' : isDone ? '수정해서 다시 제출' : '제출하고 첨삭 받기'}
            </button>
            {!isDone && (
              <button type="button" className="btn btn-secondary" disabled={practiceUi.status === 'loading'} onClick={suggestPractice}>
                이 문장 건너뛰기
              </button>
            )}
          </div>

          {isDone && (
            <>
              <div className="card elev-sm" style={{ gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={practiceUi.result.passed ? 'tag tag-accent' : 'tag tag-neutral'}>{practiceUi.result.score}점</span>
                  <span style={{ fontWeight: 700 }}>{practiceUi.result.passed ? '통과!' : '아쉬워요, 다시 도전해보세요'}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, display: 'grid', gap: 4 }}>
                  {practiceUi.result.feedback.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>작문 게시판에 기록했어요. 위 내용을 수정해서 다시 제출할 수도 있어요.</p>
              </div>
              <button type="button" className="btn btn-primary btn-block" onClick={suggestPractice}>
                다음 문장 받기 →
              </button>
            </>
          )}
        </div>
      )}

      <h3 style={{ marginTop: 28 }}>지난 연습 기록 ({practicePosts.length}개)</h3>
      {practicePosts.length === 0 && <p className="text-muted">아직 작성한 연습 작문이 없어요.</p>}
      <div className="scroll-panel">
        <div style={{ display: 'grid', gap: 16 }}>
          {practicePosts.map((p) => (
            <PostCard key={p.postId} post={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function BoardScreen() {
  const { myGroup, myPosts, groupPosts } = useApp();
  const [tab, setTab] = useState('chapters');

  return (
    <div style={{ maxWidth: 720 }}>
      <h1>작문 게시판</h1>

      <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <button type="button" className={tab === 'chapters' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => setTab('chapters')}>
          챕터학습
        </button>
        <button type="button" className={tab === 'practice' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => setTab('practice')}>
          작문 연습
        </button>
        {myGroup && (
          <button type="button" className={tab === 'group' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => setTab('group')}>
            {myGroup.name}
          </button>
        )}
      </div>

      {tab === 'chapters' && <ChapterBoardTab posts={myPosts} />}
      {tab === 'practice' && <PracticeTab />}
      {tab === 'group' && myGroup && (
        <div className="scroll-panel" style={{ marginTop: 8 }}>
          <div style={{ display: 'grid', gap: 16 }}>
            {groupPosts.length === 0 && <p className="text-muted">아직 게시물이 없어요. 챕터 학습에서 작문을 제출해보세요!</p>}
            {groupPosts.map((p) => (
              <PostCard key={p.postId} post={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RankingScreen() {
  const { myGroup, members } = useApp();
  if (!myGroup) return <NoGroupPrompt />;
  const ranked = [...members].sort((a, b) => b.points - a.points);

  return (
    <div style={{ maxWidth: 680 }}>
      <h1>그룹 랭킹</h1>
      <p className="text-muted" style={{ marginTop: -8 }}>{myGroup.name} · 포인트 기준</p>
      <table className="table" style={{ marginTop: 16 }}>
        <thead><tr><th>순위</th><th>이름</th><th>연속학습</th><th>포인트</th></tr></thead>
        <tbody>
          {ranked.map((m, i) => (
            <tr key={m.userId}>
              <td style={{ fontWeight: 800, color: 'var(--color-accent)' }}>{i + 1}</td>
              <td>{m.nickname}</td>
              <td>{m.streak}일</td>
              <td style={{ fontWeight: 700 }}>{m.points}P</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

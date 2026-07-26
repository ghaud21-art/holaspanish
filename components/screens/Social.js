'use client';
import { useState } from 'react';
import { useApp } from '../AppContext';

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

export function BoardScreen() {
  const { myGroup, posts, reactPost, commentPost, userId, profile } = useApp();
  const [drafts, setDrafts] = useState({});

  if (!myGroup) return <NoGroupPrompt />;

  return (
    <div style={{ maxWidth: 680 }}>
      <h1>작문 게시판</h1>
      <p className="text-muted" style={{ marginTop: -8 }}>챕터 학습에서 제출한 작문이 여기 그룹원들과 함께 모여요.</p>
      <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
        {posts.length === 0 && <p className="text-muted">아직 게시물이 없어요. 챕터 학습에서 작문을 제출해보세요!</p>}
        {posts.map((p) => (
          <div key={p.postId} className="card elev-sm" style={{ gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700 }}>{p.nickname}</div>
              <span className={p.score >= 70 ? 'tag tag-accent' : 'tag tag-neutral'}>{p.score}점</span>
            </div>
            <div className="text-muted" style={{ fontSize: 11 }}>{p.chapterTitle}</div>
            <p className="card-body" style={{ opacity: 1, fontSize: 14 }}>{p.text}</p>
            <div style={{ display: 'grid', gap: 3 }}>
              {p.feedback.map((f) => <div key={f} className="text-muted" style={{ fontSize: 12 }}>· {f}</div>)}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {Object.entries(p.reactions).map(([emoji, count]) => (
                <button key={emoji} type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => reactPost(p.postId, emoji)}>
                  {emoji} {count}
                </button>
              ))}
            </div>
            <div className="hr" style={{ margin: '6px 0' }} />
            <div style={{ display: 'grid', gap: 6 }}>
              {p.comments.map((c, i) => (
                <div key={i} style={{ fontSize: 13 }}><b>{c.nickname}</b> <span className="text-muted">{c.text}</span></div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                placeholder="응원 댓글 남기기"
                value={drafts[p.postId] || ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [p.postId]: e.target.value }))}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={async () => {
                  const text = drafts[p.postId];
                  if (!text || !text.trim()) return;
                  await commentPost(p.postId, userId, profile.nickname, text);
                  setDrafts((d) => ({ ...d, [p.postId]: '' }));
                }}
              >
                등록
              </button>
            </div>
          </div>
        ))}
      </div>
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

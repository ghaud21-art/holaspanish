'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useApp } from '../AppContext';
import { CURRICULUM } from '../../data/curriculum';

export default function AdminScreen() {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [openGroupId, setOpenGroupId] = useState(null);
  const [groupPosts, setGroupPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const [vocabLevel, setVocabLevel] = useState(CURRICULUM[0].levelTag);
  const [vocabTopic, setVocabTopic] = useState('');
  const [vocabCount, setVocabCount] = useState(10);
  const [vocabGenerating, setVocabGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState([]);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminOverview();
      setUsers(res.users || []);
      setGroups(res.groups || []);
    } catch (err) {
      showToast('관리자 데이터를 불러오지 못했어요: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openGroupPosts = async (groupId) => {
    if (openGroupId === groupId) {
      setOpenGroupId(null);
      return;
    }
    setOpenGroupId(groupId);
    setPostsLoading(true);
    try {
      const res = await api.getPosts(groupId);
      setGroupPosts(res.posts || []);
    } catch (err) {
      showToast('게시물을 불러오지 못했어요: ' + err.message);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('이 게시물을 삭제할까요? 되돌릴 수 없어요.')) return;
    try {
      await api.deletePost(postId);
      setGroupPosts((prev) => prev.filter((p) => p.postId !== postId));
      showToast('게시물을 삭제했어요.');
    } catch (err) {
      showToast('삭제에 실패했어요: ' + err.message);
    }
  };

  const handleDeleteComment = async (postId, commentIndex) => {
    try {
      const res = await api.deleteComment(postId, commentIndex);
      setGroupPosts((prev) => prev.map((p) => (p.postId === postId ? res.post : p)));
    } catch (err) {
      showToast('댓글 삭제에 실패했어요: ' + err.message);
    }
  };

  const handleToggleAiUnlimited = async (userId, aiUnlimited) => {
    try {
      await api.setAiUnlimited(userId, aiUnlimited);
      setUsers((prev) => prev.map((u) => (u.userId === userId ? { ...u, aiUnlimited } : u)));
      showToast(aiUnlimited ? 'AI 무제한 사용을 허용했어요.' : 'AI 무제한 사용을 해제했어요.');
    } catch (err) {
      showToast('변경에 실패했어요: ' + err.message);
    }
  };

  const handleGenerateVocab = async () => {
    setVocabGenerating(true);
    setGeneratedPreview([]);
    try {
      const res = await api.generateVocab(vocabLevel, vocabTopic, vocabCount);
      setGeneratedPreview(res.words || []);
      showToast(`단어 ${res.words?.length || 0}개를 생성해서 단어장에 추가했어요.`);
    } catch (err) {
      showToast('생성에 실패했어요: ' + err.message);
    } finally {
      setVocabGenerating(false);
    }
  };

  if (loading) return <p className="text-muted">불러오는 중…</p>;

  return (
    <div>
      <h1>관리자</h1>
      <p className="text-muted" style={{ marginTop: -8 }}>전체 사용자/그룹 현황을 보고, 부적절한 게시물이나 댓글을 지울 수 있어요.</p>

      <h3 style={{ marginTop: 24 }}>Gemini로 단어장 확장</h3>
      <div className="card elev-sm" style={{ gap: 10, maxWidth: 520 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: '1 1 120px' }}>
            <label>레벨</label>
            <select className="input" value={vocabLevel} onChange={(e) => setVocabLevel(e.target.value)}>
              {CURRICULUM.map((lvl) => (
                <option key={lvl.key} value={lvl.levelTag}>{lvl.levelTag}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: '2 1 200px' }}>
            <label>주제 (선택)</label>
            <input className="input" placeholder="예: 여행, 음식, 날씨" value={vocabTopic} onChange={(e) => setVocabTopic(e.target.value)} />
          </div>
          <div className="field" style={{ flex: '0 1 80px' }}>
            <label>개수</label>
            <input className="input" type="number" min={1} max={30} value={vocabCount} onChange={(e) => setVocabCount(e.target.value)} />
          </div>
        </div>
        <button type="button" className="btn btn-primary" disabled={vocabGenerating} onClick={handleGenerateVocab}>
          {vocabGenerating ? '생성 중…' : 'Gemini로 단어 생성하기'}
        </button>
        {generatedPreview.length > 0 && (
          <div style={{ display: 'grid', gap: 4, marginTop: 4, fontSize: 13 }}>
            {generatedPreview.map((w) => (
              <div key={w.id}><b>{w.es}</b> — {w.kr}</div>
            ))}
          </div>
        )}
      </div>

      <h3 style={{ marginTop: 24 }}>전체 사용자 ({users.length}명)</h3>
      <div className="scroll-panel" style={{ maxHeight: '40vh' }}>
        <table className="table">
          <thead>
            <tr><th>닉네임</th><th>이메일</th><th>연속학습</th><th>포인트</th><th>완료 챕터</th><th>그룹</th><th>AI 사용</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.userId}>
                <td>{u.nickname}</td>
                <td style={{ fontSize: 12 }}>{u.email}</td>
                <td>{u.streak}일</td>
                <td>{u.points}P</td>
                <td>{u.completedCount}개</td>
                <td style={{ fontSize: 12 }}>{u.groups.join(', ') || '-'}</td>
                <td style={{ fontSize: 12 }}>
                  {u.aiUnlimited ? <span className="tag tag-accent">무제한</span> : `${u.aiUsageCount} / 10`}
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: 11, padding: '4px 8px' }}
                    onClick={() => handleToggleAiUnlimited(u.userId, !u.aiUnlimited)}
                  >
                    {u.aiUnlimited ? '무제한 해제' : '무제한 허용'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginTop: 24 }}>전체 그룹 ({groups.length}개)</h3>
      <div style={{ display: 'grid', gap: 10 }}>
        {groups.map((g) => (
          <div key={g.groupId} className="card elev-sm" style={{ gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span style={{ fontWeight: 700 }}>{g.name}</span>{' '}
                <span className="tag tag-neutral">{g.inviteCode}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="text-muted" style={{ fontSize: 12 }}>멤버 {g.memberCount}명 · 게시물 {g.postCount}개</span>
                <button type="button" className="btn btn-ghost" onClick={() => openGroupPosts(g.groupId)}>
                  {openGroupId === g.groupId ? '닫기' : '게시물 보기'}
                </button>
              </div>
            </div>

            {openGroupId === g.groupId && (
              <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
                {postsLoading && <p className="text-muted" style={{ fontSize: 13 }}>불러오는 중…</p>}
                {!postsLoading && groupPosts.length === 0 && <p className="text-muted" style={{ fontSize: 13 }}>게시물이 없어요.</p>}
                {!postsLoading && groupPosts.map((p) => (
                  <div key={p.postId} className="card elev-sm" style={{ background: 'var(--color-neutral-100)', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{p.nickname} · {p.chapterTitle}</span>
                      <button type="button" className="btn btn-ghost" style={{ color: 'var(--color-accent)' }} onClick={() => handleDeletePost(p.postId)}>게시물 삭제</button>
                    </div>
                    <p style={{ fontSize: 13, margin: 0 }}>{p.text}</p>
                    {p.comments.map((c, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span><b>{c.nickname}</b> {c.text}</span>
                        <button type="button" className="btn btn-ghost" style={{ fontSize: 11, padding: 0 }} onClick={() => handleDeleteComment(p.postId, i)}>삭제</button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

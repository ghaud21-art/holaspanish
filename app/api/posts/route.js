import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { getRows, appendRow, updateRow, deleteRow } from '../../../lib/db';
import { nowIso } from '../../../lib/util';

function toClient(row) {
  return {
    postId: row.postId,
    groupId: row.groupId,
    userId: row.userId,
    nickname: row.nickname,
    chapterId: row.chapterId,
    chapterTitle: row.chapterTitle,
    text: row.text,
    score: Number(row.score || 0),
    feedback: row.feedback || [],
    reactions: row.reactions || { '❤️': 0, '👏': 0, '🔥': 0 },
    comments: row.comments || [],
    createdAt: row.createdAt,
  };
}

export async function GET(request) {
  const groupId = new URL(request.url).searchParams.get('groupId');
  if (!groupId) return NextResponse.json({ error: 'groupId가 필요합니다.' }, { status: 400 });
  const rows = await getRows('Posts');
  const posts = rows
    .filter((r) => r.groupId === groupId)
    .map(toClient)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return NextResponse.json({ posts });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  const userId = session.user.id;

  const body = await request.json();
  const { action } = body;

  if (action === 'create') {
    const { groupId, nickname, chapterId, chapterTitle, text, score, feedback } = body;
    if (!groupId || !text) {
      return NextResponse.json({ error: 'groupId, text가 필요합니다.' }, { status: 400 });
    }
    const postId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const row = await appendRow('Posts', {
      postId,
      groupId,
      userId,
      nickname: nickname || '익명',
      chapterId: chapterId || '',
      chapterTitle: chapterTitle || '',
      text,
      score: score ?? 0,
      feedback: feedback || [],
      reactions: { '❤️': 0, '👏': 0, '🔥': 0 },
      comments: [],
      createdAt: nowIso(),
    });
    return NextResponse.json({ post: toClient(row) });
  }

  if (action === 'react') {
    const { postId, emoji } = body;
    const rows = await getRows('Posts');
    const row = rows.find((r) => r.postId === postId);
    if (!row) return NextResponse.json({ error: '게시물을 찾을 수 없어요.' }, { status: 404 });
    const reactions = row.reactions || {};
    reactions[emoji] = (reactions[emoji] || 0) + 1;
    const saved = await updateRow('Posts', 'postId', postId, { reactions });
    return NextResponse.json({ post: toClient(saved) });
  }

  if (action === 'comment') {
    const { postId, nickname, text } = body;
    if (!text || !text.trim()) return NextResponse.json({ error: '댓글 내용이 비어있어요.' }, { status: 400 });
    const rows = await getRows('Posts');
    const row = rows.find((r) => r.postId === postId);
    if (!row) return NextResponse.json({ error: '게시물을 찾을 수 없어요.' }, { status: 404 });
    const comments = row.comments || [];
    comments.push({ userId, nickname: nickname || '익명', text: text.trim(), createdAt: nowIso() });
    const saved = await updateRow('Posts', 'postId', postId, { comments });
    return NextResponse.json({ post: toClient(saved) });
  }

  if (action === 'delete') {
    if (session.user.role !== 'admin') return NextResponse.json({ error: '관리자만 삭제할 수 있어요.' }, { status: 403 });
    const { postId } = body;
    await deleteRow('Posts', 'postId', postId);
    return NextResponse.json({ ok: true });
  }

  if (action === 'deleteComment') {
    const { postId, commentIndex } = body;
    const rows = await getRows('Posts');
    const row = rows.find((r) => r.postId === postId);
    if (!row) return NextResponse.json({ error: '게시물을 찾을 수 없어요.' }, { status: 404 });
    const comments = row.comments || [];
    const target = comments[commentIndex];
    if (!target) return NextResponse.json({ error: '댓글을 찾을 수 없어요.' }, { status: 404 });
    // 본인이 쓴 댓글이거나 관리자만 지울 수 있어요.
    if (session.user.role !== 'admin' && target.userId !== userId) {
      return NextResponse.json({ error: '본인 댓글만 삭제할 수 있어요.' }, { status: 403 });
    }
    comments.splice(commentIndex, 1);
    const saved = await updateRow('Posts', 'postId', postId, { comments });
    return NextResponse.json({ post: toClient(saved) });
  }

  return NextResponse.json({ error: '알 수 없는 action 입니다.' }, { status: 400 });
}

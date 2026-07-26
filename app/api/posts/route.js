import { NextResponse } from 'next/server';
import { getRows, appendRow, updateRow } from '../../../lib/db';
import { safeParseJSON, nowIso } from '../../../lib/util';

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
    feedback: safeParseJSON(row.feedback, []),
    reactions: safeParseJSON(row.reactions, { '❤️': 0, '👏': 0, '🔥': 0 }),
    comments: safeParseJSON(row.comments, []),
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
  const body = await request.json();
  const { action } = body;

  if (action === 'create') {
    const { groupId, userId, nickname, chapterId, chapterTitle, text, score, feedback } = body;
    if (!groupId || !userId || !text) {
      return NextResponse.json({ error: 'groupId, userId, text가 필요합니다.' }, { status: 400 });
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
      feedback: JSON.stringify(feedback || []),
      reactions: JSON.stringify({ '❤️': 0, '👏': 0, '🔥': 0 }),
      comments: JSON.stringify([]),
      createdAt: nowIso(),
    });
    return NextResponse.json({ post: toClient(row) });
  }

  if (action === 'react') {
    const { postId, emoji } = body;
    const rows = await getRows('Posts');
    const row = rows.find((r) => r.postId === postId);
    if (!row) return NextResponse.json({ error: '게시물을 찾을 수 없어요.' }, { status: 404 });
    const reactions = safeParseJSON(row.reactions, {});
    reactions[emoji] = (reactions[emoji] || 0) + 1;
    const saved = await updateRow('Posts', 'postId', postId, { reactions: JSON.stringify(reactions) });
    return NextResponse.json({ post: toClient(saved) });
  }

  if (action === 'comment') {
    const { postId, userId, nickname, text } = body;
    if (!text || !text.trim()) return NextResponse.json({ error: '댓글 내용이 비어있어요.' }, { status: 400 });
    const rows = await getRows('Posts');
    const row = rows.find((r) => r.postId === postId);
    if (!row) return NextResponse.json({ error: '게시물을 찾을 수 없어요.' }, { status: 404 });
    const comments = safeParseJSON(row.comments, []);
    comments.push({ userId, nickname: nickname || '익명', text: text.trim(), createdAt: nowIso() });
    const saved = await updateRow('Posts', 'postId', postId, { comments: JSON.stringify(comments) });
    return NextResponse.json({ post: toClient(saved) });
  }

  return NextResponse.json({ error: '알 수 없는 action 입니다.' }, { status: 400 });
}

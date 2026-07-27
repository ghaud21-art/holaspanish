import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { getRows, appendRow, updateWhere } from '../../../lib/db';
import { todayKey } from '../../../lib/date';
import { scheduleNext, MAX_BOX } from '../../../lib/leitner';

function toClient(row) {
  return {
    wordKey: row.wordKey,
    es: row.es,
    kr: row.kr,
    box: Number(row.box || 0),
    wrongCount: Number(row.wrongCount || 0),
    lastWrong: Boolean(row.lastWrong),
    nextReviewDate: row.nextReviewDate || '',
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  const rows = await getRows('VocabProgress');
  const mine = rows.filter((r) => r.userId === session.user.id);
  return NextResponse.json({ items: mine.map(toClient) });
}

// action: 'learn'(단어를 처음 배움) | 'quizCorrect'(복습 퀴즈 정답) | 'quizWrong'(복습 퀴즈 오답)
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  const userId = session.user.id;

  const { wordKey, es, kr, action } = await request.json();
  if (!wordKey || !action) return NextResponse.json({ error: 'wordKey와 action이 필요합니다.' }, { status: 400 });

  const today = todayKey();
  const rows = await getRows('VocabProgress');
  const existing = rows.find((r) => r.userId === userId && r.wordKey === wordKey);

  if (action === 'learn') {
    if (existing) return NextResponse.json({ item: toClient(existing) });
    const created = await appendRow('VocabProgress', {
      userId,
      wordKey,
      es: es || '',
      kr: kr || '',
      box: 0,
      wrongCount: 0,
      lastWrong: false,
      nextReviewDate: scheduleNext(0, today),
    });
    return NextResponse.json({ item: toClient(created) });
  }

  if (action !== 'quizCorrect' && action !== 'quizWrong') {
    return NextResponse.json({ error: '알 수 없는 action입니다.' }, { status: 400 });
  }

  if (!existing) {
    const box = action === 'quizCorrect' ? 1 : 0;
    const created = await appendRow('VocabProgress', {
      userId,
      wordKey,
      es: es || '',
      kr: kr || '',
      box,
      wrongCount: action === 'quizWrong' ? 1 : 0,
      lastWrong: action === 'quizWrong',
      nextReviewDate: scheduleNext(box, today),
    });
    return NextResponse.json({ item: toClient(created) });
  }

  const patch =
    action === 'quizCorrect'
      ? (() => {
          const box = Math.min((existing.box || 0) + 1, MAX_BOX);
          return { box, lastWrong: false, nextReviewDate: scheduleNext(box, today) };
        })()
      : { box: 0, wrongCount: (existing.wrongCount || 0) + 1, lastWrong: true, nextReviewDate: scheduleNext(0, today) };

  const updated = await updateWhere('VocabProgress', { userId, wordKey }, patch);
  return NextResponse.json({ item: toClient(updated) });
}

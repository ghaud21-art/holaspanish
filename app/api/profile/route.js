import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { getRows, appendRow, updateRow } from '../../../lib/db';
import { nowIso } from '../../../lib/util';
import { FLAT_CHAPTERS } from '../../../data/curriculum';

function toClient(row) {
  return {
    userId: row.userId,
    nickname: row.nickname || '',
    bio: row.bio || '',
    points: Number(row.points || 0),
    streak: Number(row.streak || 0),
    totalMinutes: Number(row.totalMinutes || 0),
    completedChapters: row.completedChapters || [],
    currentChapterId: row.currentChapterId || FLAT_CHAPTERS[0].id,
    badges: row.badges || [],
    lastStudyDate: row.lastStudyDate || '',
    dailyVocabDate: row.dailyVocabDate || '',
    dailyVocabWords: row.dailyVocabWords || [],
    updatedAt: row.updatedAt,
  };
}

function defaultProfile(userId, email) {
  return {
    userId,
    email: email || '',
    nickname: '',
    bio: '',
    points: 0,
    streak: 0,
    totalMinutes: 0,
    completedChapters: [],
    currentChapterId: FLAT_CHAPTERS[0].id,
    badges: [],
    lastStudyDate: '',
    dailyVocabDate: '',
    dailyVocabWords: [],
  };
}

export async function GET(request) {
  const userId = new URL(request.url).searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId가 필요합니다.' }, { status: 400 });
  const rows = await getRows('Profiles');
  const row = rows.find((r) => r.userId === userId);
  return NextResponse.json({ profile: row ? toClient(row) : defaultProfile(userId) });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  const userId = session.user.id;

  const body = await request.json();
  const { patch } = body;
  if (!patch) return NextResponse.json({ error: 'patch가 필요합니다.' }, { status: 400 });

  const rows = await getRows('Profiles');
  const existing = rows.find((r) => r.userId === userId);

  const rawPatch = { ...patch, updatedAt: nowIso() };

  let saved;
  if (existing) {
    if (!existing.email && session.user.email) rawPatch.email = session.user.email;
    saved = await updateRow('Profiles', 'userId', userId, rawPatch);
  } else {
    const base = defaultProfile(userId, session.user.email);
    const merged = { ...base, ...patch, updatedAt: rawPatch.updatedAt };
    saved = await appendRow('Profiles', merged);
  }
  return NextResponse.json({ profile: toClient(saved) });
}

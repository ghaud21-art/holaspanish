import { NextResponse } from 'next/server';
import { getRows, appendRow, updateRow } from '../../../lib/db';
import { safeParseJSON, nowIso } from '../../../lib/util';
import { FLAT_CHAPTERS } from '../../../data/curriculum';

const JSON_FIELDS = ['completedChapters', 'badges', 'dailyVocabWords'];

function toClient(row) {
  return {
    userId: row.userId,
    nickname: row.nickname || '',
    bio: row.bio || '',
    points: Number(row.points || 0),
    streak: Number(row.streak || 0),
    totalMinutes: Number(row.totalMinutes || 0),
    completedChapters: safeParseJSON(row.completedChapters, []),
    currentChapterId: row.currentChapterId || FLAT_CHAPTERS[0].id,
    badges: safeParseJSON(row.badges, []),
    lastStudyDate: row.lastStudyDate || '',
    dailyVocabDate: row.dailyVocabDate || '',
    dailyVocabWords: safeParseJSON(row.dailyVocabWords, []),
    updatedAt: row.updatedAt,
  };
}

function defaultProfile(userId) {
  return {
    userId,
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
  const body = await request.json();
  const { userId, patch } = body;
  if (!userId || !patch) return NextResponse.json({ error: 'userId와 patch가 필요합니다.' }, { status: 400 });

  const rows = await getRows('Profiles');
  const existing = rows.find((r) => r.userId === userId);

  const rawPatch = { ...patch };
  JSON_FIELDS.forEach((f) => {
    if (f in rawPatch) rawPatch[f] = JSON.stringify(rawPatch[f]);
  });
  rawPatch.updatedAt = nowIso();

  let saved;
  if (existing) {
    saved = await updateRow('Profiles', 'userId', userId, rawPatch);
  } else {
    const base = defaultProfile(userId);
    const merged = { ...base, ...patch };
    JSON_FIELDS.forEach((f) => {
      merged[f] = JSON.stringify(patch[f] !== undefined ? patch[f] : base[f]);
    });
    merged.updatedAt = rawPatch.updatedAt;
    saved = await appendRow('Profiles', merged);
  }
  return NextResponse.json({ profile: toClient(saved) });
}

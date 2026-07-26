import { NextResponse } from 'next/server';
import { getRows, updateWhere } from '../../../lib/db';
import { safeParseJSON } from '../../../lib/util';

export async function GET(request) {
  const groupId = new URL(request.url).searchParams.get('groupId');
  if (!groupId) return NextResponse.json({ error: 'groupId가 필요합니다.' }, { status: 400 });

  const [memberships, profiles] = await Promise.all([getRows('Memberships'), getRows('Profiles')]);
  const rows = memberships.filter((m) => m.groupId === groupId);

  const members = rows.map((m) => {
    const p = profiles.find((r) => r.userId === m.userId);
    return {
      userId: m.userId,
      cheers: Number(m.cheers || 0),
      nickname: p?.nickname || '이름 없음',
      streak: Number(p?.streak || 0),
      points: Number(p?.points || 0),
      totalMinutes: Number(p?.totalMinutes || 0),
      badges: safeParseJSON(p?.badges, []),
    };
  });

  return NextResponse.json({ members });
}

export async function POST(request) {
  const body = await request.json();
  const { action, groupId, userId } = body;
  if (action !== 'cheer') return NextResponse.json({ error: '알 수 없는 action 입니다.' }, { status: 400 });
  if (!groupId || !userId) return NextResponse.json({ error: 'groupId, userId가 필요합니다.' }, { status: 400 });

  const memberships = await getRows('Memberships');
  const row = memberships.find((m) => m.groupId === groupId && m.userId === userId);
  if (!row) return NextResponse.json({ error: '멤버를 찾을 수 없어요.' }, { status: 404 });

  const cheers = Number(row.cheers || 0) + 1;
  await updateWhere('Memberships', { groupId, userId }, { cheers });
  return NextResponse.json({ cheers });
}

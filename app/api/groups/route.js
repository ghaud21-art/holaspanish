import { NextResponse } from 'next/server';
import { getRows, appendRow } from '../../../lib/db';
import { makeInviteCode, nowIso } from '../../../lib/util';

export async function GET(request) {
  const userId = new URL(request.url).searchParams.get('userId');
  const groups = await getRows('Groups');
  if (!userId) return NextResponse.json({ groups });

  const memberships = await getRows('Memberships');
  const myGroupIds = new Set(memberships.filter((m) => m.userId === userId).map((m) => m.groupId));
  const myGroups = groups.filter((g) => myGroupIds.has(g.groupId));
  return NextResponse.json({ groups, myGroups });
}

export async function POST(request) {
  const body = await request.json();
  const { action, userId } = body;
  if (!userId) return NextResponse.json({ error: 'userId가 필요합니다.' }, { status: 400 });

  if (action === 'create') {
    const name = (body.name || '').trim() || '나의 스터디 그룹';
    const groupId = `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const inviteCode = makeInviteCode();
    const group = await appendRow('Groups', { groupId, name, inviteCode, createdAt: nowIso() });
    await appendRow('Memberships', { groupId, userId, joinedAt: nowIso(), cheers: 0 });
    return NextResponse.json({ group });
  }

  if (action === 'join') {
    const code = (body.inviteCode || '').trim().toUpperCase();
    const groups = await getRows('Groups');
    const group = groups.find((g) => (g.inviteCode || '').toUpperCase() === code);
    if (!group) return NextResponse.json({ error: '초대 코드를 찾을 수 없어요.' }, { status: 404 });

    const memberships = await getRows('Memberships');
    const already = memberships.find((m) => m.groupId === group.groupId && m.userId === userId);
    if (!already) await appendRow('Memberships', { groupId: group.groupId, userId, joinedAt: nowIso(), cheers: 0 });
    return NextResponse.json({ group });
  }

  return NextResponse.json({ error: '알 수 없는 action 입니다.' }, { status: 400 });
}

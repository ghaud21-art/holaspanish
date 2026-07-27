import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { getRows } from '../../../lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: '관리자만 볼 수 있어요.' }, { status: 403 });

  const [profiles, groups, memberships, posts] = await Promise.all([
    getRows('Profiles'),
    getRows('Groups'),
    getRows('Memberships'),
    getRows('Posts'),
  ]);

  const groupNamesByUser = {};
  memberships.forEach((m) => {
    const g = groups.find((gr) => gr.groupId === m.groupId);
    if (!g) return;
    (groupNamesByUser[m.userId] ||= []).push(g.name);
  });

  const users = profiles.map((p) => ({
    userId: p.userId,
    email: p.email || '',
    nickname: p.nickname || '(닉네임 없음)',
    points: Number(p.points || 0),
    streak: Number(p.streak || 0),
    totalMinutes: Number(p.totalMinutes || 0),
    completedCount: (p.completedChapters || []).length,
    groups: groupNamesByUser[p.userId] || [],
  }));

  const groupSummaries = groups.map((g) => {
    const memberCount = memberships.filter((m) => m.groupId === g.groupId).length;
    const postCount = posts.filter((po) => po.groupId === g.groupId).length;
    return { groupId: g.groupId, name: g.name, inviteCode: g.inviteCode, memberCount, postCount };
  });

  return NextResponse.json({ users, groups: groupSummaries });
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { getRows, updateRow } from '../../../lib/db';

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
    aiUsageCount: Number(p.aiUsageCount || 0),
    aiUnlimited: Boolean(p.aiUnlimited),
  }));

  const groupSummaries = groups.map((g) => {
    const memberCount = memberships.filter((m) => m.groupId === g.groupId).length;
    const postCount = posts.filter((po) => po.groupId === g.groupId).length;
    return { groupId: g.groupId, name: g.name, inviteCode: g.inviteCode, memberCount, postCount };
  });

  return NextResponse.json({ users, groups: groupSummaries });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: '관리자만 할 수 있어요.' }, { status: 403 });

  const { action, userId, aiUnlimited } = await request.json();
  if (action !== 'setAiUnlimited') return NextResponse.json({ error: '알 수 없는 action 입니다.' }, { status: 400 });
  if (!userId) return NextResponse.json({ error: 'userId가 필요합니다.' }, { status: 400 });

  try {
    const saved = await updateRow('Profiles', 'userId', userId, { aiUnlimited: Boolean(aiUnlimited) });
    return NextResponse.json({ userId, aiUnlimited: Boolean(saved.aiUnlimited) });
  } catch (err) {
    return NextResponse.json(
      { error: 'AI 무제한 권한 변경에 실패했어요: ' + err.message + ' (Supabase에 supabase/schema.sql을 다시 실행했는지 확인해주세요.)' },
      { status: 500 }
    );
  }
}

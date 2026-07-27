import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { gradeWritingWithGemini } from '../../../lib/gemini';
import { mockGrade, PASS_THRESHOLD } from '../../../lib/grading';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const { titleEs, titleKr, prompt, text } = await request.json();
  if (!text || !text.trim()) {
    return NextResponse.json({ score: 0, feedback: ['문장을 작성해주세요.'], passed: false });
  }

  try {
    const result = await gradeWritingWithGemini({ titleEs, titleKr, prompt, text });
    return NextResponse.json({ ...result, source: 'gemini' });
  } catch (err) {
    const { score, feedback } = mockGrade(text);
    return NextResponse.json({ score, feedback, passed: score >= PASS_THRESHOLD, source: 'mock' });
  }
}

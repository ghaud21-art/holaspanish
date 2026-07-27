import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { writingHelpWithGemini, isGeminiConfigured } from '../../../lib/gemini';
import { checkAndConsumeAiQuota, AI_FREE_LIMIT } from '../../../lib/aiQuota';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: 'Gemini API가 설정되지 않았어요. GEMINI_API_KEY를 등록해주세요.' }, { status: 400 });
  }

  const { titleEs, titleKr, level, prompt, currentText, question, history } = await request.json();
  if (!question || !question.trim()) {
    return NextResponse.json({ error: '질문을 입력해주세요.' }, { status: 400 });
  }

  const quota = await checkAndConsumeAiQuota(session.user.id);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: `AI 작문 도우미 무료 사용 횟수(${AI_FREE_LIMIT}회)를 모두 썼어요. 관리자에게 무제한 사용 권한을 요청해보세요.` },
      { status: 403 }
    );
  }

  try {
    const reply = await writingHelpWithGemini({
      titleEs,
      titleKr,
      level,
      prompt,
      currentText,
      question: question.trim(),
      history: Array.isArray(history) ? history : [],
    });
    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json({ error: 'Gemini 호출에 실패했어요: ' + err.message }, { status: 502 });
  }
}

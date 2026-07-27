import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { writingHelpWithGemini, isGeminiConfigured } from '../../../lib/gemini';

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

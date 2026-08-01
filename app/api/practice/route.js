import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { suggestPracticeSentenceWithGemini, gradeTranslationWithGemini, isGeminiConfigured } from '../../../lib/gemini';
import { checkAndConsumeAiQuota, AI_FREE_LIMIT } from '../../../lib/aiQuota';
import { FLAT_CHAPTERS } from '../../../data/curriculum';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 완료한 챕터들의 단어카드를 모아서 Gemini에게 "이 범위 안에서" 문제를 내달라고 힌트로 줘요.
// 완료한 챕터가 많으면 커리큘럼 순서상 앞쪽(Prep/A1 초반) 단어만 매번 뽑히지 않도록,
// 전체 범위에서 무작위로 샘플링해서 뒤쪽에서 배운 챕터도 골고루 등장하게 해요.
function vocabHintFromCompleted(completedChapters = []) {
  const words = [];
  FLAT_CHAPTERS.forEach((c) => {
    if (completedChapters.includes(c.id) && c.keyVocab) {
      c.keyVocab.forEach((w) => words.push(w.es));
    }
  });
  return shuffle(words).slice(0, 50).join(', ');
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: 'Gemini API가 설정되지 않았어요. GEMINI_API_KEY를 등록해주세요.' }, { status: 400 });
  }

  const body = await request.json();
  const { action } = body;

  if (action === 'suggest') {
    const { level, completedChapters, recentPrompts } = body;
    try {
      const vocabHint = vocabHintFromCompleted(completedChapters || []);
      const kr = await suggestPracticeSentenceWithGemini({
        level: level || 'A1',
        vocabHint,
        recentPrompts: Array.isArray(recentPrompts) ? recentPrompts : [],
      });
      return NextResponse.json({ kr });
    } catch (err) {
      return NextResponse.json({ error: 'Gemini 호출에 실패했어요: ' + err.message }, { status: 502 });
    }
  }

  if (action === 'grade') {
    const { krPrompt, text } = body;
    if (!krPrompt || !text || !text.trim()) {
      return NextResponse.json({ error: 'krPrompt와 text가 필요합니다.' }, { status: 400 });
    }

    const quota = await checkAndConsumeAiQuota(session.user.id);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: `AI 무료 사용 횟수(${AI_FREE_LIMIT}회)를 모두 썼어요. 관리자에게 무제한 사용 권한을 요청해보세요.` },
        { status: 403 }
      );
    }

    try {
      const result = await gradeTranslationWithGemini({ krPrompt, text });
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json({ error: 'Gemini 호출에 실패했어요: ' + err.message }, { status: 502 });
    }
  }

  return NextResponse.json({ error: '알 수 없는 action입니다.' }, { status: 400 });
}

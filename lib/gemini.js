import { GoogleGenAI } from '@google/genai';

// 3.5를 우선 쓰고, 모델을 못 찾거나 일시적으로 막히면 3.1로 자동 폴백해요.
const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];

let client = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

async function generateWithFallback(ai, config) {
  let lastErr;
  for (const model of MODELS) {
    try {
      return await ai.models.generateContent({ ...config, model });
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

// 작문을 채점해서 {score, feedback, passed}를 돌려줍니다. Gemini 미설정이거나 호출 실패 시 예외를 던지고,
// 호출부(app/api/grade/route.js)가 lib/grading.js의 규칙 기반 채점으로 폴백합니다.
export async function gradeWritingWithGemini({ titleEs, titleKr, prompt, text }) {
  const ai = getClient();
  if (!ai) throw new Error('Gemini API가 설정되지 않았습니다.');

  const instruction = `당신은 한국인 스페인어 학습자를 돕는 친절하고 꼼꼼한 스페인어 첨삭 선생님입니다.

챕터 주제: "${titleEs}" (${titleKr})
오늘의 작문 프롬프트: "${prompt}"
학습자가 제출한 스페인어 문장:
"""
${text}
"""

이 문장을 문법, 어휘 선택, 완성도 기준으로 평가해주세요. 아래 JSON 형식으로만 답하세요.
- score: 0~100 사이 정수 (70점 이상이면 통과)
- feedback: 한국어로 된 구체적인 피드백 2~3개 (잘한 점과 고칠 점을 함께, 너무 길지 않게)
- passed: score가 70 이상이면 true, 아니면 false`;

  const response = await generateWithFallback(ai, {
    contents: instruction,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          score: { type: 'number' },
          feedback: { type: 'array', items: { type: 'string' } },
          passed: { type: 'boolean' },
        },
        required: ['score', 'feedback', 'passed'],
      },
    },
  });

  const parsed = JSON.parse(response.text);
  const score = Math.max(0, Math.min(100, Math.round(parsed.score)));
  return { score, feedback: parsed.feedback || [], passed: Boolean(parsed.passed) };
}

// 레벨/주제에 맞는 스페인어 단어 목록을 생성합니다. 각 항목은 {es, kr, example, exampleKr} 형태입니다.
export async function generateVocabWithGemini({ levelLabel, topic, count }) {
  const ai = getClient();
  if (!ai) throw new Error('Gemini API가 설정되지 않았습니다.');

  const instruction = `스페인어를 배우는 한국인 학습자를 위한 단어장을 만들어주세요.
레벨: "${levelLabel}"
주제: "${topic || '일상 생활에서 자주 쓰는 표현'}"

이 레벨과 주제에 맞는, 실제로 자주 쓰이는 스페인어 단어(또는 짧은 표현) ${count}개를 만들어주세요.
중복되거나 너무 어려운 단어는 피해주세요. 아래 JSON 배열 형식으로만 답하세요.
[{"es": "스페인어 단어", "kr": "정확한 한국어 뜻", "example": "그 단어가 들어간 스페인어 예문", "exampleKr": "예문의 한국어 번역"}]`;

  const response = await generateWithFallback(ai, {
    contents: instruction,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            es: { type: 'string' },
            kr: { type: 'string' },
            example: { type: 'string' },
            exampleKr: { type: 'string' },
          },
          required: ['es', 'kr'],
        },
      },
    },
  });

  return JSON.parse(response.text);
}

// 작문 중에 막힐 때 힌트만 주는 도우미예요. 정답 문장/번역은 절대 통째로 주지 않고,
// 단어·표현 힌트, 문법 포인트, (요청 시) 레벨에 맞는 한글 문장 아이디어만 제안합니다.
export async function writingHelpWithGemini({ titleEs, titleKr, level, prompt, currentText, question, history = [] }) {
  const ai = getClient();
  if (!ai) throw new Error('Gemini API가 설정되지 않았습니다.');

  const historyText = history
    .slice(-6)
    .map((h) => `${h.role === 'user' ? '학생' : '선생님'}: ${h.text}`)
    .join('\n');

  const instruction = `당신은 한국인 스페인어 학습자를 돕는 친절한 스페인어 작문 도우미입니다.

챕터: "${titleEs}" (${titleKr}), 레벨: ${level || '초급'}
오늘의 작문 프롬프트: "${prompt || ''}"
학생이 지금까지 쓴 문장(있다면): "${currentText || '(아직 없음)'}"

아주 중요한 규칙:
- 정답이 되는 완성된 스페인어 문장이나 통째 번역을 절대로 알려주지 마세요.
- 대신 힌트만 주세요: 관련 단어·표현 제안, 문법 포인트, 격려, 다음에 뭘 생각해보면 좋을지 되묻는 질문 등.
- 학생이 "문장 아이디어를 추천해줘" 같은 요청을 하면, 이 레벨에서 연습하기 좋은 한글 문장(의미)만
  1~3개 제안하세요. 그 문장의 스페인어 번역은 학생이 직접 만들어보도록 절대 주지 마세요.
- 답변은 한국어로, 짧고 다정하게 (4문장 이내).

${historyText ? `이전 대화:\n${historyText}\n` : ''}학생의 질문: "${question}"`;

  const response = await generateWithFallback(ai, { contents: instruction });
  return response.text.trim();
}

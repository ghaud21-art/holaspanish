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

${titleEs ? `챕터: "${titleEs}" (${titleKr})` : `주제: ${titleKr}`}, 레벨: ${level || '초급'}
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

// 매번 다른 "형식"을 강제로 지정해서, Gemini가 매번 비슷한 인사말 패턴으로만 답하는 걸 막아요.
// requiresTag가 있는 형식은 학습자가 해당 문법(과거/미래/비교급)을 실제로 배웠을 때만 후보에 넣어요.
const PRACTICE_STYLES = [
  { name: '지난 일 이야기하기', desc: '어제/지난 주말에 있었던 일을 순서대로 이야기하는 서술문 (과거 시제 위주)', requiresTag: 'past' },
  { name: '부탁·제안하기', desc: '누군가에게 무언가를 부탁하거나 같이 하자고 제안하는 대화체 문장' },
  { name: '생각·느낌 말하기', desc: '어떤 것에 대한 자신의 의견이나 느낌을 말하는 문장' },
  { name: '계획 말하기', desc: '앞으로의 계획이나 약속을 이야기하는 문장 (미래 시제 위주)', requiresTag: 'future' },
  { name: '질문과 대답', desc: '한 사람이 묻고 다른 사람이 답하는 짧은 대화 형식' },
  { name: '하루 일과 설명', desc: '오늘 하루 일과를 순서대로 설명하는 문장 (현재 시제)' },
  { name: '묘사하기', desc: '어떤 장소, 사람, 물건이 어떤지 묘사하는 문장' },
  { name: '감탄·놀람', desc: '놀랍거나 감탄스러운 상황과 그 이유를 설명하는 문장' },
  { name: '불평·아쉬움', desc: '뭔가 마음에 안 들거나 아쉬운 점을 이야기하는 문장' },
  { name: '비교하기', desc: '두 가지를 비교하면서 어느 쪽이 더 좋은지 이야기하는 문장', requiresTag: 'comparison' },
];

// 지금까지 완료한 챕터의 어휘 범위 안에서, 스페인어 여러 문장으로 번역하며 연습하기 좋은
// 조금 더 긴 한국어 문장(3~4문장)을 추천해줘요. 스페인어 번역은 절대 포함하지 않아요.
export async function suggestPracticeSentenceWithGemini({ level, vocabHint, grammarHint = [], recentPrompts = [] }) {
  const ai = getClient();
  if (!ai) throw new Error('Gemini API가 설정되지 않았습니다.');

  // 문법 챕터를 아직 안 끝냈으면(회화 단계) 과거/미래/비교급이 필요한 형식은 아예 후보에서 빼요.
  const hasPast = grammarHint.some((g) => g.includes('과거'));
  const hasFuture = grammarHint.some((g) => g.includes('미래') || g.includes('가능법'));
  const hasComparison = grammarHint.some((g) => g.includes('비교') || g.includes('최상급'));
  const allowedStyles = PRACTICE_STYLES.filter((s) => {
    if (!s.requiresTag) return true;
    if (s.requiresTag === 'past') return hasPast;
    if (s.requiresTag === 'future') return hasFuture;
    if (s.requiresTag === 'comparison') return hasComparison;
    return true;
  });
  const style = allowedStyles[Math.floor(Math.random() * allowedStyles.length)];

  const recentText = recentPrompts.length
    ? `아래는 최근에 이미 냈던 연습 문장들입니다. 이것들과 주제·소재는 물론 시작하는 방식까지
겹치지 않는 완전히 새로운 문장을 만들어주세요 (예: 최근 문장들이 전부 "안녕하세요"로 시작했다면
이번에는 절대 인사말로 시작하지 마세요).
${recentPrompts.map((p, i) => `${i + 1}. ${p}`).join('\n')}
`
    : '';

  const grammarText = grammarHint.length
    ? `이 학습자가 수업에서 배운 문법 포인트는 정확히 다음과 같습니다: ${grammarHint.join(', ')}.
이 목록에 없는 문법(특히 접속법, 가정법, 관계대명사, 복잡한 시제 등)은 절대 사용하지 마세요.`
    : `이 학습자는 아직 문법 수업(과거/미래 시제, 접속법, 관계대명사 등)을 듣지 않았고 회화 표현만
배웠어요. 반드시 현재 시제와 아주 기본적인 문장 구조만 사용하세요.`;

  const instruction = `당신은 한국인 스페인어 학습자를 위한 작문 연습 문제를 만드는 선생님입니다.

이 학습자는 지금까지 "${level || '초급'}" 수준까지 학습을 완료했고, 아래 단어/표현들을 배웠습니다:
${vocabHint || '(기본적인 인사말과 자기소개 표현)'}

${grammarText}

${recentText}
이번에는 반드시 아래 형식으로 문장을 만들어주세요 — 다른 형식과 섞지 말고 이 형식에 집중하세요:
["${style.name}"] ${style.desc}

아주 중요한 규칙:
- "안녕하세요", "반갑습니다" 같은 인사말로 시작하지 마세요. 위에서 지정한 형식에 맞는 내용으로 바로 시작하세요.
- 위 단어들과 비슷한 난이도로, 학습자가 스페인어 여러 문장으로 번역해서 연습하기 좋은 자연스러운
  한국어 문장 3~4개(하나의 짧은 이야기나 상황으로 자연스럽게 이어지는 내용)를 만들어주세요.
- 매번 다른 소재(가족, 여행, 취미, 날씨, 일/공부, 음식, 감정, 쇼핑, 건강, 친구 등)를 활용해서 신선하게 느껴지도록 해주세요.
- 위에서 정해진 문법 범위를 절대 넘지 마세요. 학습자가 배우지 않은 문법은 아예 필요 없는 쉬운 표현으로 바꿔서 만드세요.
- 스페인어 번역은 절대 포함하지 말고 한국어 문장만 응답하세요.

아래 JSON 형식으로만 답하세요.
{"kr": "한국어 문장 1. 한국어 문장 2. 한국어 문장 3."}`;

  const response = await generateWithFallback(ai, {
    contents: instruction,
    config: {
      responseMimeType: 'application/json',
      responseSchema: { type: 'object', properties: { kr: { type: 'string' } }, required: ['kr'] },
    },
  });
  const parsed = JSON.parse(response.text);
  return parsed.kr;
}

// 학습자가 한국어 문장을 스페인어로 번역한 것을 채점해요 — 뜻이 맞는지, 문법이 맞는지,
// 두 문장 이상으로 작성했는지를 봅니다.
export async function gradeTranslationWithGemini({ krPrompt, text }) {
  const ai = getClient();
  if (!ai) throw new Error('Gemini API가 설정되지 않았습니다.');

  const instruction = `당신은 한국인 스페인어 학습자를 돕는 친절한 스페인어 선생님입니다.

학습자에게 아래 한국어 문장을 스페인어로 번역해서 최소 두 문장으로 작성하라고 요청했습니다:
"${krPrompt}"

학습자가 제출한 스페인어:
"""
${text}
"""

이 번역을 평가해주세요:
- 한국어 문장의 의미를 정확하게 담았는지
- 문법이 올바른지
- 최소 두 문장으로 작성했는지 (한 문장만 썼다면 감점하고 피드백에 언급하세요)

아래 JSON 형식으로만 답하세요.
- score: 0~100 사이 정수 (70점 이상이면 통과)
- feedback: 한국어로 된 구체적인 피드백 2~3개 (잘한 점과 고칠 점을 함께)
- passed: score가 70 이상이면 true, 아니면 false
- corrected: 학생의 문장을 자연스럽고 문법적으로 올바른 스페인어로 고친 버전
  (이미 완벽하다면 그대로 반환하세요. 학생이 안 쓴 새로운 내용을 추가하지 말고, 학생이 쓴 문장을 다듬기만 하세요)`;

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
          corrected: { type: 'string' },
        },
        required: ['score', 'feedback', 'passed', 'corrected'],
      },
    },
  });
  const parsed = JSON.parse(response.text);
  const score = Math.max(0, Math.min(100, Math.round(parsed.score)));
  return { score, feedback: parsed.feedback || [], passed: Boolean(parsed.passed), corrected: parsed.corrected || text };
}

// 학생이 목표 문장을 소리 내어 읽은 녹음을 듣고, 실제로 그 문장을 정확한 단어로 말했는지 확인해요.
// 억양/발음의 미세한 정확도까지는 판단하지 않고(범용 모델이 신뢰성 있게 잘하는 영역이 아니라서),
// "어떤 단어를 말했는지 · 목표 문장과 얼마나 일치하는지"에만 집중합니다.
export async function checkPronunciationWithGemini({ targetText, audioBase64, mimeType }) {
  const ai = getClient();
  if (!ai) throw new Error('Gemini API가 설정되지 않았습니다.');

  const prompt = `당신은 한국인 스페인어 학습자의 발화 정확도를 확인하는 선생님입니다.

학생이 아래 스페인어 문장을 소리 내어 읽었습니다:
"${targetText}"

첨부된 음성을 듣고 학생이 실제로 말한 내용을 스페인어로 받아 적어주세요. 그리고 목표 문장과
비교해주세요. 세밀한 억양이나 발음의 정확도까지는 판단하지 말고, "정확히 어떤 단어를 말했는지"와
"목표 문장과 얼마나 일치하는지"에만 집중해주세요.

아래 JSON 형식으로만 답하세요.
- transcript: 학생이 실제로 말한 내용을 스페인어로 받아 적은 것
- matched: 목표 문장과 실질적으로 같은 단어로 말했으면 true, 많이 다르거나 빠뜨린 단어가 많으면 false
- feedback: 한국어로 된 피드백 1~2개 (빠뜨리거나 다르게 말한 단어가 있다면 구체적으로 짚어주세요)`;

  const response = await generateWithFallback(ai, {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }, { inlineData: { mimeType: mimeType || 'audio/webm', data: audioBase64 } }],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          transcript: { type: 'string' },
          matched: { type: 'boolean' },
          feedback: { type: 'array', items: { type: 'string' } },
        },
        required: ['transcript', 'matched', 'feedback'],
      },
    },
  });
  const parsed = JSON.parse(response.text);
  return { transcript: parsed.transcript || '', matched: Boolean(parsed.matched), feedback: parsed.feedback || [] };
}

// 한국어(한글) 비율이 너무 높으면 지문에 한국어가 섞였다고 보고 재시도할 때 씁니다.
function looksLikeMostlyKorean(text) {
  if (!text) return true;
  const hangul = (text.match(/[가-힣]/g) || []).length;
  return hangul / text.length > 0.15;
}

function buildReadingInstruction({ level, vocabHint, grammarHint, recentTopics, retryWarning }) {
  const grammarText = grammarHint.length
    ? `이 학습자가 수업에서 배운 문법 포인트는 정확히 다음과 같습니다: ${grammarHint.join(', ')}.
이 목록에 없는 문법(특히 접속법, 가정법, 관계대명사, 복잡한 시제 등)은 절대 사용하지 마세요.`
    : `이 학습자는 아직 문법 수업(과거/미래 시제, 접속법, 관계대명사 등)을 듣지 않았고 회화 표현만
배웠어요. 반드시 현재 시제와 아주 기본적인 문장 구조만 사용하세요.`;

  const recentText = recentTopics.length
    ? `아래는 최근에 이미 낸 지문의 주제들입니다. 겹치지 않는 새로운 주제로 만들어주세요: ${recentTopics.join(', ')}`
    : '';

  return `당신은 한국인 스페인어 학습자를 위한 독해 문제를 만드는 선생님입니다.
${retryWarning || ''}
이 학습자는 지금까지 "${level || '초급'}" 수준까지 학습을 완료했고, 아래 단어/표현들을 배웠습니다:
${vocabHint || '(기본적인 인사말과 자기소개 표현)'}

${grammarText}
${recentText}

두 가지를 만들어야 합니다. 언어를 절대 헷갈리지 마세요:

1) "passage" (지문): 위 범위 안에서 학습자가 읽고 이해할 수 있는 짧은 글.
   - **반드시 100% 스페인어 문장으로만 작성하세요. 한국어 단어나 조사를 단 하나도 섞지 마세요.**
     (나쁜 예: "오늘 나는 trabajo한다" ← 이렇게 한국어와 스페인어를 섞으면 절대 안 됩니다.
      좋은 예: "Hoy trabajo en un restaurante." 처럼 문장 전체가 스페인어여야 합니다.)
   - 4~6개의 스페인어 문장으로 이루어진 하나의 자연스러운 이야기나 설명이어야 합니다.
     문장을 나열만 하지 말고, "y", "pero", "porque", "también" 같은 기본 접속사나 "después", "luego" 같은
     연결어로 자연스럽게 이어지도록 쓰세요. 실제 원어민이 쓸 법한 자연스러운 문장으로 만들어주세요
     (나쁜 예: "Hoy trabajo. El restaurante está abierto. La comida es rica." 처럼 단조롭게 끊어 쓰지 말고,
      좋은 예: "Hoy trabajo en el restaurante y la comida está muy rica." 처럼 자연스럽게 연결하세요).
   - 소재 하나를 정해서(일상생활, 취미, 가족, 여행, 일과 등 중 하나) 그 안에서 일관된 내용으로 쓰세요.
   - 위에서 정해진 문법 범위를 절대 넘지 마세요. 너무 어려운 단어는 피하세요.

2) "questions" (이해도 확인 질문) 3개: 이건 반대로 **100% 한국어**로만 작성하세요.
   - question과 options는 모두 한국어 (위 스페인어 지문의 내용을 이해했는지 확인하는 질문)
   - 각 질문은 보기 4개 중 하나만 정답이어야 하고, 지문에 없는 내용을 묻지 마세요

아래 JSON 형식으로만 답하세요. title도 한국어로 작성하세요.
{
  "title": "지문의 짧은 한국어 제목",
  "passage": "스페인어로만 이루어진 지문 전체 (한국어 절대 금지)",
  "questions": [
    { "question": "한국어 질문", "options": ["보기1", "보기2", "보기3", "보기4"], "correct": 0 }
  ]
}`;
}

// 완료한 챕터의 어휘/문법 범위 안에서 짧은 스페인어 독해 지문 + 이해도 확인 객관식 질문을 만들어요.
// 채점은 서버에서 하지 않고(질문에 정답 인덱스가 이미 들어있어서) 클라이언트에서 바로 확인해요.
export async function generateReadingPassageWithGemini({ level, vocabHint, grammarHint = [], recentTopics = [] }) {
  const ai = getClient();
  if (!ai) throw new Error('Gemini API가 설정되지 않았습니다.');

  const requestOnce = (retryWarning) =>
    generateWithFallback(ai, {
      contents: buildReadingInstruction({ level, vocabHint, grammarHint, recentTopics, retryWarning }),
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            passage: { type: 'string' },
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  options: { type: 'array', items: { type: 'string' } },
                  correct: { type: 'number' },
                },
                required: ['question', 'options', 'correct'],
              },
            },
          },
          required: ['title', 'passage', 'questions'],
        },
      },
    });

  let response = await requestOnce();
  let parsed = JSON.parse(response.text);

  // 가끔 지문에 한국어가 섞여서 나오는 경우가 있어서, 한 번은 강하게 경고를 추가해 재시도해요.
  if (looksLikeMostlyKorean(parsed.passage)) {
    try {
      response = await requestOnce(
        '**경고: 이전 시도에서 "passage"에 한국어가 섞여 있었습니다. 이번에는 절대로 그러지 말고, passage 전체를 100% 스페인어 문장으로만 작성하세요.**\n'
      );
      const retryParsed = JSON.parse(response.text);
      if (!looksLikeMostlyKorean(retryParsed.passage)) parsed = retryParsed;
    } catch {
      // 재시도가 실패해도 원래 받은 결과라도 돌려줘요.
    }
  }

  return {
    title: parsed.title || '독해 연습',
    passage: parsed.passage || '',
    questions: (parsed.questions || []).map((q) => ({
      question: q.question,
      options: q.options || [],
      correct: Math.max(0, Math.min((q.options || []).length - 1, Math.round(q.correct))),
    })),
  };
}

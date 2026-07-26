// 실제 Gemini API 대신, 지금은 로컬 규칙 기반의 간이 첨삭기입니다.
// 나중에 Gemini API 키가 준비되면 이 함수 내부만 fetch('/api/grade', ...) 호출로 바꿔주면 됩니다.
export const PASS_THRESHOLD = 70;

export function mockGrade(text) {
  const trimmed = (text || '').trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const len = words.length;
  if (len === 0) return { score: 0, feedback: ['문장을 작성해주세요.'] };

  let score = Math.min(97, 42 + len * 4 + (/[.!?¡¿]$/.test(trimmed) ? 4 : 0) + Math.floor(Math.random() * 8));
  const positive = ['어휘 선택이 자연스러워요', '문장 구조가 정확해요', '시제 활용이 좋아요', '완성도 높은 문장이에요'];
  const negative = ['동사 활용을 다시 확인해보세요', '어순을 조금 더 다듬어보세요', '전치사 사용을 점검해보세요', '문장을 조금 더 길게 써보면 좋아요'];
  const feedback =
    score >= PASS_THRESHOLD
      ? [positive[len % positive.length], positive[(len + 1) % positive.length]]
      : [negative[len % negative.length], positive[len % positive.length]];
  return { score, feedback };
}

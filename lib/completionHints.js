import { FLAT_CHAPTERS } from '../data/curriculum';

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
export function vocabHintFromCompleted(completedChapters = []) {
  const words = [];
  FLAT_CHAPTERS.forEach((c) => {
    if (completedChapters.includes(c.id) && c.keyVocab) {
      c.keyVocab.forEach((w) => words.push(w.es));
    }
  });
  return shuffle(words).slice(0, 50).join(', ');
}

// 완료한 "문법" 챕터(gram-01~60)의 포인트만 모아요. 회화 챕터만 끝낸 학습자는 이 목록이 비어있는데,
// 그럴 땐 Gemini에게 현재 시제 중심의 아주 단순한 문장만 내달라고 명시적으로 알려줘요.
export function grammarHintFromCompleted(completedChapters = []) {
  const points = [];
  FLAT_CHAPTERS.forEach((c) => {
    if (completedChapters.includes(c.id) && c.grammarPoint) points.push(c.grammarPoint);
  });
  return points;
}

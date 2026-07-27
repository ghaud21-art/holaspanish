import { findChapter } from '../data/curriculum';
import { BONUS_VOCAB } from '../data/bonusVocab';
import { todayKey } from './date';

// profile.dailyVocabWords에는 "chapterId:단어" / "bonus:단어" / "gen:단어" 형태의 키만 저장돼 있어요.
// 공유 카드에 실제 단어+뜻을 보여주려면 이 키를 다시 원본 데이터에서 찾아야 합니다.
// generatedVocab은 Gemini로 생성해서 Supabase에 저장된 단어 목록이에요 (AppShell에서 불러와 넘겨줍니다).
export function resolveWordKey(key, generatedVocab = []) {
  if (!key) return null;
  const sep = key.indexOf(':');
  if (sep === -1) return null;
  const prefix = key.slice(0, sep);
  const word = key.slice(sep + 1);

  if (prefix === 'bonus') {
    const found = BONUS_VOCAB.find((w) => w.es === word);
    return found || null;
  }
  if (prefix === 'gen') {
    const found = generatedVocab.find((w) => w.es === word);
    return found || null;
  }
  const chapter = findChapter(prefix);
  if (!chapter || !chapter.keyVocab) return null;
  const found = chapter.keyVocab.find((w) => w.es === word);
  return found || null;
}

export function resolveTodayVocabWords(profile, generatedVocab = []) {
  const today = todayKey();
  if (profile.dailyVocabDate !== today) return [];
  return profile.dailyVocabWords.map((k) => resolveWordKey(k, generatedVocab)).filter(Boolean);
}

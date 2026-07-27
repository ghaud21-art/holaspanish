'use client';
import { useMemo, useState } from 'react';
import { BONUS_VOCAB } from '../../data/bonusVocab';
import { CURRICULUM, findChapter } from '../../data/curriculum';
import { useApp } from '../AppContext';
import { DAILY_VOCAB_GOAL } from '../../lib/constants';
import { resolveTodayVocabWords, levelVocabPool } from '../../lib/vocabLookup';
import { todayKey } from '../../lib/date';
import ShareCardButton from '../ShareCardButton';
import FlipWord from '../FlipWord';
import Review from './Review';

function seededShuffleIndexes(seed, length, count) {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const idxs = Array.from({ length }, (_, i) => i);
  for (let i = idxs.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
  }
  return idxs.slice(0, count);
}

function dedupeByEs(list) {
  const seen = new Set();
  return list.filter((w) => {
    if (seen.has(w.es)) return false;
    seen.add(w.es);
    return true;
  });
}

export default function VocabNotebook() {
  const { profile, recordVocabWord, generatedVocab } = useApp();
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('mine');
  const [tab, setTab] = useState('words');

  const today = todayKey();
  const todayCount = profile.dailyVocabDate === today ? profile.dailyVocabWords.length : 0;
  const currentLevelTag = findChapter(profile.currentChapterId)?.levelTag || 'Prep';

  // 오늘의 단어 10개는 내 레벨에 맞는 단어(Gemini 생성 단어 + 그 레벨 챕터 단어)를 우선 채우고,
  // 그래도 모자라면 다른 레벨의 생성 단어로, 그것도 부족하면 심화 보너스 단어장으로 채워요.
  const todayPool = useMemo(() => {
    const mine = levelVocabPool(currentLevelTag, generatedVocab);
    let pool = dedupeByEs(mine);
    if (pool.length < DAILY_VOCAB_GOAL) {
      const otherGen = generatedVocab
        .filter((w) => w.level !== currentLevelTag)
        .map((w) => ({ es: w.es, kr: w.kr, key: `gen:${w.es}` }));
      pool = dedupeByEs([...pool, ...otherGen]);
    }
    if (pool.length < DAILY_VOCAB_GOAL) {
      const bonus = BONUS_VOCAB.map((w) => ({ es: w.es, kr: w.kr, key: `bonus:${w.es}`, advanced: true }));
      pool = dedupeByEs([...pool, ...bonus]);
    }
    return pool;
  }, [currentLevelTag, generatedVocab]);

  const allVocab = useMemo(() => {
    const gen = generatedVocab.map((w) => ({ ...w, level: w.level || '레벨 미지정' }));
    const bonus = BONUS_VOCAB.map((w) => ({ ...w, level: '심화' }));
    return [...gen, ...bonus];
  }, [generatedVocab]);

  const todaySeed = useMemo(() => {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }, []);
  const todayIdxs = useMemo(
    () => seededShuffleIndexes(todaySeed, todayPool.length, Math.min(DAILY_VOCAB_GOAL, todayPool.length)),
    [todaySeed, todayPool.length]
  );
  const todayWords = todayIdxs.map((i) => todayPool[i]);
  const reviewedToday = resolveTodayVocabWords(profile, generatedVocab);

  const levelOptions = [
    { value: 'mine', label: `내 레벨 (${currentLevelTag})` },
    { value: 'all', label: '전체' },
    ...CURRICULUM.map((lvl) => ({ value: lvl.levelTag, label: lvl.levelTag })),
    { value: '심화', label: '심화 (보너스)' },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byLevel = allVocab.filter((w) => {
      if (levelFilter === 'all') return true;
      if (levelFilter === 'mine') return w.level === currentLevelTag;
      return w.level === levelFilter;
    });
    if (!q) return byLevel;
    return byLevel.filter((w) => w.es.toLowerCase().includes(q) || w.kr.toLowerCase().includes(q));
  }, [query, allVocab, levelFilter, currentLevelTag]);

  return (
    <div>
      <h1>단어장</h1>
      <p className="text-muted" style={{ marginTop: -8 }}>
        내 레벨({currentLevelTag})에 맞는 단어부터 심화 보너스 단어까지, 커리큘럼 챕터와는 별도로 자유롭게 복습해보세요.
      </p>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 4 }}>
        <button type="button" className={tab === 'words' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => setTab('words')}>
          단어 학습
        </button>
        <button type="button" className={tab === 'review' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => setTab('review')}>
          복습 퀴즈
        </button>
      </div>

      {tab === 'review' ? (
        <Review />
      ) : (
        <>
      <div className="card elev-sm" style={{ marginTop: 16, gap: 8, maxWidth: 420 }}>
        <div className="card-kicker">오늘의 단어 학습 목표</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ fontWeight: 700 }}>{Math.min(todayCount, DAILY_VOCAB_GOAL)} / {DAILY_VOCAB_GOAL}개</span>
          <span className="text-muted">{todayCount >= DAILY_VOCAB_GOAL ? '오늘 목표 달성! 🎉' : '챕터 단어카드 + 아래 단어장을 합쳐서 세어요'}</span>
        </div>
        <div style={{ height: 8, background: 'var(--color-neutral-200)', border: '1px solid var(--color-divider)' }}>
          <div style={{ height: '100%', width: `${Math.min(100, Math.round((todayCount / DAILY_VOCAB_GOAL) * 100))}%`, background: 'var(--color-accent)' }} />
        </div>
      </div>

      <h3 style={{ marginTop: 24 }}>오늘의 단어 {DAILY_VOCAB_GOAL}개</h3>
      <p className="text-muted" style={{ marginTop: -6, fontSize: 13 }}>
        내 레벨({currentLevelTag})에 맞는 단어 위주예요. 탭해서 뜻을 확인하면 오늘의 학습으로 기록돼요.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginTop: 12 }}>
        {todayWords.map((w) => (
          <FlipWord key={w.key} word={w} badge={w.advanced ? '심화' : undefined} onFirstFlip={() => recordVocabWord(w.key)} />
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <ShareCardButton
          label="오늘 배운 단어 카드 저장"
          filename="hola-today-vocab"
          eyebrow="오늘의 단어"
          title="오늘 배운 스페인어 단어"
          subtitle={reviewedToday.length ? undefined : '아직 오늘 학습한 단어가 없어요. 카드를 눌러 뜻을 확인해보세요.'}
          wordList={reviewedToday.length ? reviewedToday : todayWords}
        />
      </div>

      <div className="hr" />
      <h3>전체 단어장 ({filtered.length}개{generatedVocab.length ? `, Gemini로 생성된 단어 ${generatedVocab.length}개 포함` : ''})</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <select className="input" style={{ maxWidth: 180 }} value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
          {levelOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          className="input"
          placeholder="스페인어 또는 한글 뜻으로 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 360, flex: 1 }}
        />
      </div>
      <div className="scroll-panel">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
          {filtered.map((w) => (
            <FlipWord key={w.id || w.es} word={w} badge={w.level} onFirstFlip={() => recordVocabWord(`${w.id ? 'gen' : 'bonus'}:${w.es}`)} />
          ))}
        </div>
        {filtered.length === 0 && <p className="text-muted">이 레벨에는 아직 단어가 없어요. 필터를 바꿔보세요.</p>}
      </div>
        </>
      )}
    </div>
  );
}

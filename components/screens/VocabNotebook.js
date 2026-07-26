'use client';
import { useMemo, useState } from 'react';
import { BONUS_VOCAB } from '../../data/bonusVocab';
import { useApp } from '../AppContext';
import { DAILY_VOCAB_GOAL } from '../../lib/constants';
import { resolveTodayVocabWords } from '../../lib/vocabLookup';
import { todayKey } from '../../lib/date';
import ShareCardButton from '../ShareCardButton';

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

function FlipWord({ word, onFirstFlip }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className="card elev-sm"
      style={{ cursor: 'pointer', minHeight: 96, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}
      onClick={() => {
        if (!flipped && onFirstFlip) onFirstFlip();
        setFlipped((f) => !f);
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 17 }}>{word.es}</div>
      {flipped ? (
        <div style={{ color: 'var(--color-accent)', fontSize: 13 }}>{word.kr}</div>
      ) : (
        <div className="text-muted" style={{ fontSize: 11 }}>탭해서 뜻 보기</div>
      )}
    </div>
  );
}

export default function VocabNotebook() {
  const { profile, recordVocabWord } = useApp();
  const [query, setQuery] = useState('');

  const today = todayKey();
  const todayCount = profile.dailyVocabDate === today ? profile.dailyVocabWords.length : 0;

  const todaySeed = useMemo(() => {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }, []);
  const todayIdxs = useMemo(() => seededShuffleIndexes(todaySeed, BONUS_VOCAB.length, DAILY_VOCAB_GOAL), [todaySeed]);
  const todayWords = todayIdxs.map((i) => BONUS_VOCAB[i]);
  const reviewedToday = resolveTodayVocabWords(profile);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BONUS_VOCAB;
    return BONUS_VOCAB.filter((w) => w.es.toLowerCase().includes(q) || w.kr.toLowerCase().includes(q));
  }, [query]);

  return (
    <div>
      <h1>내 단어장</h1>
      <p className="text-muted" style={{ marginTop: -8 }}>
        예전에 정리해둔 개인 단어장에서 고른 보너스 단어들이에요. 커리큘럼 챕터와는 별도로 자유롭게 복습해보세요.
      </p>

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
      <p className="text-muted" style={{ marginTop: -6, fontSize: 13 }}>탭해서 뜻을 확인하면 오늘의 학습으로 기록돼요.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginTop: 12 }}>
        {todayWords.map((w) => (
          <FlipWord key={w.es} word={w} onFirstFlip={() => recordVocabWord(`bonus:${w.es}`)} />
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <ShareCardButton
          label="오늘 배운 단어 카드 저장·공유"
          filename="hola-today-vocab"
          eyebrow="오늘의 단어"
          title="오늘 배운 스페인어 단어"
          subtitle={reviewedToday.length ? undefined : '아직 오늘 학습한 단어가 없어요. 카드를 눌러 뜻을 확인해보세요.'}
          wordList={reviewedToday.length ? reviewedToday : todayWords}
        />
      </div>

      <div className="hr" />
      <h3>전체 단어장 ({BONUS_VOCAB.length}개)</h3>
      <input
        className="input"
        placeholder="스페인어 또는 한글 뜻으로 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 360 }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
        {filtered.map((w) => (
          <FlipWord key={w.es} word={w} onFirstFlip={() => recordVocabWord(`bonus:${w.es}`)} />
        ))}
      </div>
      {filtered.length === 0 && <p className="text-muted">검색 결과가 없어요.</p>}
    </div>
  );
}

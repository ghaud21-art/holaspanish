'use client';
import { useApp } from '../AppContext';
import { CURRICULUM, findChapter } from '../../data/curriculum';
import { DAILY_VOCAB_GOAL } from '../../lib/constants';
import { resolveTodayVocabWords } from '../../lib/vocabLookup';
import { todayKey } from '../../lib/date';
import ShareCardButton from '../ShareCardButton';

export default function Dashboard() {
  const { profile, setScreen, openChapter, generatedVocab } = useApp();
  const currentChapter = findChapter(profile.currentChapterId) || findChapter(CURRICULUM[0].chapters[0].id);
  const today = todayKey();
  const todayVocabCount = profile.dailyVocabDate === today ? profile.dailyVocabWords.length : 0;
  const vocabGoalMet = todayVocabCount >= DAILY_VOCAB_GOAL;
  const todayWords = resolveTodayVocabWords(profile, generatedVocab);

  const levelProgress = CURRICULUM.map((lvl) => {
    const total = lvl.chapters.length;
    const done = lvl.chapters.filter((c) => profile.completedChapters.includes(c.id)).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { label: lvl.label, done, total, pct };
  });

  const todayLabel = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div>
      <div className="text-muted" style={{ fontSize: 12, letterSpacing: '.05em', textTransform: 'uppercase' }}>{todayLabel}</div>
      <h1 style={{ marginTop: 6 }}>안녕하세요{profile.nickname ? `, ${profile.nickname}님` : ''}</h1>
      <p className="text-muted" style={{ marginTop: -6, marginBottom: 24 }}>
        {profile.nickname ? '오늘도 스페인어 한 걸음, 화이팅이에요!' : '마이페이지에서 닉네임을 설정하면 더 반갑게 인사할게요.'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card elev-sm">
          <div className="card-kicker">연속 학습</div>
          <div className="card-title">{profile.streak}일째</div>
        </div>
        <div className="card elev-sm">
          <div className="card-kicker">현재 레벨</div>
          <div className="card-title">{currentChapter?.levelTag || 'Prep'}</div>
        </div>
        <div className="card elev-sm">
          <div className="card-kicker">포인트</div>
          <div className="card-title">{profile.points}P</div>
        </div>
      </div>

      <div className="card elev-sm" style={{ gap: 8, marginBottom: 24, maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="card-kicker">오늘의 단어 학습 목표</div>
          <span className="text-muted" style={{ fontSize: 12 }}>{vocabGoalMet ? '달성! 🎉' : `${DAILY_VOCAB_GOAL - todayVocabCount}개 남음`}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">{Math.min(todayVocabCount, DAILY_VOCAB_GOAL)} / {DAILY_VOCAB_GOAL}개</span>
          <button type="button" className="btn btn-ghost" onClick={() => setScreen('vocab')}>단어 학습하러 가기</button>
        </div>
        <div style={{ height: 8, background: 'var(--color-neutral-200)', border: '1px solid var(--color-divider)' }}>
          <div style={{ height: '100%', width: `${Math.min(100, Math.round((todayVocabCount / DAILY_VOCAB_GOAL) * 100))}%`, background: 'var(--color-accent)' }} />
        </div>
      </div>

      <div className="card elev-md" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
        <div>
          <div className="card-kicker">오늘의 학습</div>
          <div className="card-title" style={{ marginTop: 4 }}>{currentChapter?.titleEs}</div>
          <p className="card-body" style={{ marginTop: 2 }}>{currentChapter?.titleKr}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setScreen('chapters');
              openChapter(currentChapter.id);
            }}
          >
            이어서 학습하기
          </button>
          <ShareCardButton
            label="오늘 학습 카드 저장"
            filename="hola-daily"
            eyebrow={currentChapter?.levelTag}
            title={`${profile.nickname || '나'}의 스페인어 기록`}
            subtitle={`연속 ${profile.streak}일째 · 오늘의 챕터 "${currentChapter?.titleKr}"`}
            stats={[
              { label: '연속 학습', value: `${profile.streak}일` },
              { label: '포인트', value: `${profile.points}P` },
            ]}
            wordList={todayWords}
            quote={{ es: currentChapter?.titleEs, kr: currentChapter?.titleKr }}
          />
        </div>
      </div>

      <div className="hr" />
      <h3>레벨별 진도</h3>
      <div style={{ display: 'grid', gap: 14, marginTop: 14 }}>
        {levelProgress.map((lp) => (
          <div key={lp.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ fontWeight: 600 }}>{lp.label}</span>
              <span className="text-muted">{lp.done} / {lp.total}</span>
            </div>
            <div style={{ height: 8, background: 'var(--color-surface)', border: '1px solid var(--color-divider)' }}>
              <div style={{ height: '100%', width: `${lp.pct}%`, background: 'var(--color-accent)' }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <button type="button" className="btn btn-ghost" onClick={() => setScreen('leveltest')}>레벨테스트 다시 보기</button>
      </div>
    </div>
  );
}

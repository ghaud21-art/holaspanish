'use client';
import { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { todayKey } from '../../lib/date';
import { FLAT_CHAPTERS } from '../../data/curriculum';
import { BONUS_VOCAB } from '../../data/bonusVocab';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDistractorPool(vocabProgress, generatedVocab) {
  const pool = [
    ...vocabProgress.map((p) => ({ es: p.es, kr: p.kr })),
    ...generatedVocab.map((w) => ({ es: w.es, kr: w.kr })),
    ...FLAT_CHAPTERS.flatMap((c) => c.keyVocab || []),
    ...BONUS_VOCAB,
  ];
  const seen = new Set();
  return pool.filter((w) => {
    if (seen.has(w.kr)) return false;
    seen.add(w.kr);
    return true;
  });
}

function buildQuestions(words, pool) {
  return shuffle(words).map((w) => {
    const distractors = shuffle(pool.filter((p) => p.kr !== w.kr)).slice(0, 3).map((p) => p.kr);
    const options = shuffle([w.kr, ...distractors]);
    return { wordKey: w.wordKey, es: w.es, kr: w.kr, options };
  });
}

export default function Review() {
  const { vocabProgress, generatedVocab, recordProgress } = useApp();
  const [mode, setMode] = useState(null); // null | 'due' | 'wrong' | 'done'
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState({ correct: 0, total: 0 });

  const today = todayKey();
  const dueWords = useMemo(
    () => vocabProgress.filter((p) => p.nextReviewDate && p.nextReviewDate <= today),
    [vocabProgress, today]
  );
  const wrongWords = useMemo(() => vocabProgress.filter((p) => p.lastWrong), [vocabProgress]);
  const pool = useMemo(() => buildDistractorPool(vocabProgress, generatedVocab), [vocabProgress, generatedVocab]);

  const startQuiz = (which) => {
    const words = which === 'due' ? dueWords : wrongWords;
    if (!words.length) return;
    setQuestions(buildQuestions(words, pool));
    setMode(which);
    setQIndex(0);
    setSelected(null);
    setResults({ correct: 0, total: 0 });
  };

  const current = questions[qIndex];

  const handleAnswer = (opt) => {
    if (selected || !current) return;
    setSelected(opt);
    const correct = opt === current.kr;
    setResults((r) => ({ correct: r.correct + (correct ? 1 : 0), total: r.total + 1 }));
    recordProgress(current.wordKey, current.es, current.kr, correct ? 'quizCorrect' : 'quizWrong');
  };

  const handleNext = () => {
    if (qIndex + 1 >= questions.length) {
      setMode('done');
    } else {
      setQIndex((i) => i + 1);
      setSelected(null);
    }
  };

  if ((mode === 'due' || mode === 'wrong') && current) {
    return (
      <div style={{ maxWidth: 480 }}>
        <button type="button" className="btn btn-ghost" onClick={() => setMode(null)} style={{ marginBottom: 12 }}>
          ← 복습 메뉴로
        </button>
        <p className="text-muted" style={{ fontSize: 12 }}>{qIndex + 1} / {questions.length}</p>
        <h2 style={{ marginTop: 4 }}>{current.es}</h2>
        <p className="text-muted" style={{ marginTop: -8 }}>이 단어의 뜻은 무엇일까요?</p>
        <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
          {current.options.map((opt) => {
            const isCorrect = opt === current.kr;
            const isSelected = opt === selected;
            let style = { cursor: selected ? 'default' : 'pointer', textAlign: 'left', padding: '14px 16px' };
            if (selected && isCorrect) style = { ...style, border: '2px solid var(--color-accent)' };
            else if (selected && isSelected) style = { ...style, opacity: 0.55, textDecoration: 'line-through' };
            return (
              <div key={opt} className="card elev-sm" style={style} onClick={() => handleAnswer(opt)}>
                {opt}
              </div>
            );
          })}
        </div>
        {selected && (
          <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={handleNext}>
            {qIndex + 1 >= questions.length ? '결과 보기' : '다음 문제'}
          </button>
        )}
      </div>
    );
  }

  if (mode === 'done') {
    return (
      <div style={{ maxWidth: 480 }}>
        <h1>복습 완료!</h1>
        <p className="card-body" style={{ opacity: 1 }}>{results.correct} / {results.total}개 맞혔어요.</p>
        <button type="button" className="btn btn-primary" onClick={() => setMode(null)}>복습 메뉴로</button>
      </div>
    );
  }

  return (
    <div>
      <h1>복습 퀴즈</h1>
      <p className="text-muted" style={{ marginTop: -8 }}>
        어제 이전에 배운 단어를 퀴즈로 복습해요. 틀린 단어는 오답노트에 모아뒀다가 다시 맞히면 사라져요.
      </p>

      <div className="card elev-sm" style={{ marginTop: 16, gap: 10, maxWidth: 480 }}>
        <div className="card-kicker">오늘 복습할 단어</div>
        <div className="card-title">{dueWords.length}개</div>
        <p className="card-body" style={{ opacity: 1, fontSize: 13 }}>
          {dueWords.length
            ? '전에 배운 단어 중 복습할 때가 된 단어들이에요.'
            : '오늘 복습할 단어가 아직 없어요. 챕터나 단어장에서 새 단어를 배우면 내일부터 여기 나타나요.'}
        </p>
        <button type="button" className="btn btn-primary" disabled={!dueWords.length} onClick={() => startQuiz('due')}>
          복습 퀴즈 시작
        </button>
      </div>

      <div className="card elev-sm" style={{ marginTop: 16, gap: 10, maxWidth: 480 }}>
        <div className="card-kicker">오답노트</div>
        <div className="card-title">{wrongWords.length}개</div>
        <p className="card-body" style={{ opacity: 1, fontSize: 13 }}>
          {wrongWords.length ? '최근 퀴즈에서 틀린 단어들이에요. 다시 맞히면 오답노트에서 사라져요.' : '아직 틀린 단어가 없어요.'}
        </p>
        {wrongWords.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 8 }}>
            {wrongWords.map((w) => (
              <div key={w.wordKey} className="card elev-sm" style={{ minHeight: 70, justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{w.es}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>{w.kr}</div>
              </div>
            ))}
          </div>
        )}
        <button type="button" className="btn btn-secondary" disabled={!wrongWords.length} onClick={() => startQuiz('wrong')}>
          오답 단어 다시 풀기
        </button>
      </div>
    </div>
  );
}

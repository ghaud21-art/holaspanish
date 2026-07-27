'use client';
import { useState } from 'react';
import { useApp } from '../AppContext';
import { TEST_QUESTIONS, SKIP_LABEL, evaluateTest, CURRICULUM } from '../../data/curriculum';
import LevelPicker from './LevelPicker';

const SKIP = -1;

export default function LevelTest() {
  const { setScreen, saveProfilePatch } = useApp();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  const start = () => {
    setActive(true);
    setStep(0);
    setAnswers([]);
    setResult(null);
  };

  const answer = (idx) => {
    const next = [...answers, idx];
    if (next.length === TEST_QUESTIONS.length) {
      setAnswers(next);
      setResult(evaluateTest(next));
    } else {
      setAnswers(next);
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (step === 0) return;
    setAnswers((prev) => prev.slice(0, -1));
    setStep((s) => s - 1);
  };

  const retake = () => {
    setActive(false);
    setStep(0);
    setAnswers([]);
    setResult(null);
  };

  const recommendedLevel = result ? CURRICULUM.find((l) => l.key === result.recommendedKey) : null;

  const goToChapters = (adoptLevel) => {
    if (adoptLevel && recommendedLevel) {
      saveProfilePatch({ currentChapterId: recommendedLevel.chapters[0].id });
    }
    setScreen('chapters');
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <h1>레벨테스트</h1>

      {!active && (
        <>
          <p className="card-body" style={{ fontSize: 15, opacity: 1, marginBottom: 20 }}>
            {TEST_QUESTIONS.length}문제로 지금 스페인어 실력을 확인하고 시작 레벨을 추천해드려요. 모르는 문제는 추측하지 말고
            &ldquo;잘 모르겠습니다&rdquo;를 골라주세요.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={start}>테스트 시작하기</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowPicker((v) => !v)}>
              {showPicker ? '레벨 선택 닫기' : '테스트 없이 시작 레벨 직접 선택하기'}
            </button>
          </div>

          {showPicker && (
            <div style={{ marginTop: 20 }}>
              <p className="text-muted" style={{ fontSize: 13 }}>
                레벨테스트와 상관없이, 원하는 레벨의 첫 챕터로 바로 시작할 수 있어요.
              </p>
              <LevelPicker onPicked={() => setShowPicker(false)} />
            </div>
          )}
        </>
      )}

      {active && !result && (
        <>
          <div style={{ height: 8, background: 'var(--color-surface)', border: '1px solid var(--color-divider)', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${Math.round((step / TEST_QUESTIONS.length) * 100)}%`, background: 'var(--color-accent)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div className="text-muted" style={{ fontSize: 12 }}>{step + 1} / {TEST_QUESTIONS.length}</div>
            {step > 0 && (
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={goBack}>← 이전 문제</button>
            )}
          </div>
          <div className="card elev-md" style={{ gap: 16 }}>
            <div className="card-kicker">{TEST_QUESTIONS[step].instruction}</div>
            <div className="card-title" style={{ fontWeight: 400, fontFamily: 'var(--font-body)' }}>{TEST_QUESTIONS[step].prompt}</div>
            <div style={{ display: 'grid', gap: 8 }} role="radiogroup">
              {TEST_QUESTIONS[step].options.map((opt, i) => (
                <button key={opt} type="button" className="btn btn-secondary btn-block" onClick={() => answer(i)}>{opt}</button>
              ))}
              <button type="button" className="btn btn-secondary btn-block" onClick={() => answer(SKIP)}>{SKIP_LABEL}</button>
            </div>
          </div>
        </>
      )}

      {active && result && recommendedLevel && (
        <div className="card elev-lg" style={{ gap: 14, padding: 28 }}>
          <div className="card-kicker">레벨테스트 결과</div>
          <h2 style={{ margin: 0 }}>{recommendedLevel.levelTag} 레벨</h2>
          <p className="card-body" style={{ fontSize: 14, opacity: 1 }}>
            추천 시작 챕터: <b>{recommendedLevel.chapters[0].titleEs}</b> · {recommendedLevel.chapters[0].titleKr}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
            <button type="button" className="btn btn-primary" onClick={() => goToChapters(true)}>이 레벨로 학습 시작하기</button>
            <button type="button" className="btn btn-secondary" onClick={() => goToChapters(false)}>챕터 목록 둘러보기</button>
            <button type="button" className="btn btn-ghost" onClick={retake}>다시 풀어보기</button>
          </div>
        </div>
      )}
    </div>
  );
}

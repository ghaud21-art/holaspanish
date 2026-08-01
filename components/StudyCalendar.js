'use client';
import { useMemo, useState } from 'react';
import { useApp } from './AppContext';
import { findChapter } from '../data/curriculum';
import { todayKey } from '../lib/date';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 이모지 대신 쓰는 깔끔한 선 없는 불꽃 아이콘. 학습(작문 제출) 기록이 있는 날에만 표시돼요.
function FlameIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--color-accent)" stroke="none" aria-hidden="true">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function formatDateLabel(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} (${WEEKDAYS[date.getDay()]})`;
}

export default function StudyCalendar() {
  const { myPosts } = useApp();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedKey, setSelectedKey] = useState(todayKey(now));

  // 챕터 작문 + 작문 연습 게시물을 날짜별로 묶어요. 하루에 하나라도 있으면 "학습 성공한 날"로 봐요.
  const postsByDate = useMemo(() => {
    const map = {};
    myPosts.forEach((p) => {
      if (!p.createdAt) return;
      const key = todayKey(new Date(p.createdAt));
      (map[key] ||= []).push(p);
    });
    return map;
  }, [myPosts]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const cells = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const dateKeyFor = (d) => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  };

  const selectedPosts = postsByDate[selectedKey] || [];
  const monthStudyDays = Object.keys(postsByDate).filter((k) => k.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`)).length;

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div className="card elev-sm" style={{ flex: '2 1 420px', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" className="btn btn-ghost" onClick={goPrevMonth}>‹</button>
          <div style={{ fontWeight: 700 }}>
            {viewYear}. {String(viewMonth + 1).padStart(2, '0')}
            <span className="text-muted" style={{ fontWeight: 400, fontSize: 12, marginLeft: 8 }}>이번 달 {monthStudyDays}일 학습</span>
          </div>
          <button type="button" className="btn btn-ghost" onClick={goNextMonth}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-muted" style={{ textAlign: 'center', fontSize: 11 }}>{w}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {cells.map((d, i) => {
            if (d === null) return <div key={`blank-${i}`} />;
            const key = dateKeyFor(d);
            const hasStudy = !!postsByDate[key];
            const isSelected = key === selectedKey;
            return (
              <div
                key={key}
                onClick={() => setSelectedKey(key)}
                style={{
                  cursor: 'pointer',
                  minHeight: 50,
                  border: isSelected ? '2px solid var(--color-accent)' : '1px solid var(--color-divider)',
                  borderRadius: 8,
                  padding: '6px 4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  background: isSelected ? 'var(--color-accent-100)' : 'transparent',
                }}
              >
                <span style={{ fontSize: 12 }}>{d}</span>
                {hasStudy && <FlameIcon />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card elev-sm" style={{ flex: '1 1 260px', gap: 10 }}>
        <div className="card-kicker">선택한 날짜</div>
        <div className="card-title" style={{ fontSize: 15 }}>{formatDateLabel(selectedKey)}</div>
        {selectedPosts.length === 0 ? (
          <p className="text-muted" style={{ fontSize: 13 }}>이 날은 작성한 작문 기록이 없어요.</p>
        ) : (
          <div className="scroll-panel" style={{ maxHeight: '50vh' }}>
            <div style={{ display: 'grid', gap: 12 }}>
              {selectedPosts.map((p) => {
                const chapter = p.chapterId !== 'practice' ? findChapter(p.chapterId) : null;
                return (
                  <div key={p.postId} style={{ borderTop: '1px solid var(--color-divider)', paddingTop: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {chapter ? `${chapter.titleEs} · ${chapter.titleKr}` : `작문 연습: ${p.chapterTitle}`}
                    </div>
                    {!!(chapter?.examples && chapter.examples.length) && (
                      <div style={{ marginTop: 6, display: 'grid', gap: 3 }}>
                        <span className="text-muted" style={{ fontSize: 11 }}>챕터 예문</span>
                        {chapter.examples.map((ex) => (
                          <div key={ex.es} style={{ fontSize: 12 }}>
                            {ex.es} <span className="text-muted">— {ex.kr}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: 6 }}>
                      <span className="text-muted" style={{ fontSize: 11 }}>내가 쓴 문장 ({p.score}점)</span>
                      <p className="card-body" style={{ opacity: 1, fontSize: 13, margin: '2px 0 0' }}>{p.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

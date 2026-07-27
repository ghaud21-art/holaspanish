'use client';
import { useState } from 'react';

export default function FlipWord({ word, onFirstFlip, badge }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className="card elev-sm"
      style={{ cursor: 'pointer', minHeight: 96, justifyContent: 'center', alignItems: 'center', textAlign: 'center', position: 'relative' }}
      onClick={() => {
        if (!flipped && onFirstFlip) onFirstFlip();
        setFlipped((f) => !f);
      }}
    >
      {badge && (
        <span className="tag tag-neutral" style={{ position: 'absolute', top: 6, left: 6, fontSize: 10, padding: '1px 6px' }}>
          {badge}
        </span>
      )}
      <div style={{ fontWeight: 800, fontSize: 17 }}>{word.es}</div>
      {flipped ? (
        <div style={{ color: 'var(--color-accent)', fontSize: 13 }}>{word.kr}</div>
      ) : (
        <div className="text-muted" style={{ fontSize: 11 }}>탭해서 뜻 보기</div>
      )}
    </div>
  );
}

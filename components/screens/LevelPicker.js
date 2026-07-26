'use client';
import { useApp } from '../AppContext';
import { CURRICULUM } from '../../data/curriculum';

const LEVEL_DESC = {
  Prep: '스페인어를 처음 시작해요 (발음, 인사말)',
  A1: '기초 생활회화 문장을 배우고 있어요',
  A2: '일상적인 대화가 어느 정도 가능해요',
  B1: '문법을 체계적으로 정리하고 싶어요',
  B2: '접속법·가정법 등 심화 문법을 배우고 싶어요',
};

export default function LevelPicker({ onPicked }) {
  const { saveProfilePatch, showToast, setScreen, setOpenChapterId } = useApp();

  const pick = (lvl) => {
    if (!window.confirm(`${lvl.levelTag} 레벨의 첫 챕터부터 시작할까요? (기존에 완료한 챕터 기록은 그대로 남아요)`)) return;
    saveProfilePatch({ currentChapterId: lvl.chapters[0].id });
    setOpenChapterId(null);
    showToast(`${lvl.levelTag} 레벨로 시작 지점을 설정했어요.`);
    if (onPicked) onPicked(lvl);
    else setScreen('chapters');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
      {CURRICULUM.map((lvl) => (
        <div key={lvl.key} className="card elev-sm" style={{ cursor: 'pointer' }} onClick={() => pick(lvl)}>
          <div className="card-kicker">{lvl.levelTag}</div>
          <div className="card-title">{lvl.label}</div>
          <p className="card-body">{LEVEL_DESC[lvl.levelTag]}</p>
        </div>
      ))}
    </div>
  );
}

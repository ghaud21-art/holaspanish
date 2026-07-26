'use client';
import { useApp } from './AppContext';

const NAV_ITEMS = [
  { key: 'dashboard', label: '홈' },
  { key: 'leveltest', label: '레벨테스트' },
  { key: 'chapters', label: '챕터학습' },
  { key: 'vocab', label: '내 단어장' },
  { key: 'group', label: '그룹' },
  { key: 'board', label: '작문게시판' },
  { key: 'ranking', label: '랭킹' },
  { key: 'mypage', label: '마이페이지' },
];

export default function Nav() {
  const { screen, setScreen, profile, setOpenChapterId } = useApp();

  return (
    <nav className="nav">
      <span className="nav-brand">
        <img src="/icon.png" alt="" width={28} height={28} style={{ borderRadius: 6 }} />
        Hola<span style={{ color: 'var(--color-accent)' }}>.</span>
      </span>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          className="navlink"
          aria-current={screen === item.key ? 'page' : undefined}
          onClick={() => {
            setOpenChapterId(null);
            setScreen(item.key);
          }}
        >
          {item.label}
        </button>
      ))}
      <span className="tag tag-outline" style={{ marginLeft: 4 }}>{profile.points}P</span>
    </nav>
  );
}

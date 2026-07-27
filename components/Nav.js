'use client';
import { signOut } from 'next-auth/react';
import { useApp } from './AppContext';

const NAV_ITEMS = [
  { key: 'dashboard', label: '홈' },
  { key: 'chapters', label: '챕터학습' },
  { key: 'vocab', label: '단어장' },
  { key: 'group', label: '그룹' },
  { key: 'board', label: '작문게시판' },
  { key: 'ranking', label: '랭킹' },
  { key: 'mypage', label: '마이페이지' },
];

export default function Nav() {
  const { screen, setScreen, profile, setOpenChapterId, isAdmin } = useApp();
  const items = isAdmin ? [...NAV_ITEMS, { key: 'admin', label: '관리자' }] : NAV_ITEMS;

  return (
    <nav className="nav">
      <button
        type="button"
        className="nav-brand"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
        onClick={() => {
          setOpenChapterId(null);
          setScreen('dashboard');
        }}
      >
        <img src="/icon.png" alt="" width={28} height={28} style={{ borderRadius: 6 }} />
        Hola<span style={{ color: 'var(--color-accent)' }}>.</span>
      </button>
      {items.map((item) => (
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
      <button type="button" className="navlink" style={{ fontSize: 12 }} onClick={() => signOut()}>로그아웃</button>
    </nav>
  );
}

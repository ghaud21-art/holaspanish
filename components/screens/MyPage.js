'use client';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import ShareCardButton from '../ShareCardButton';
import LevelPicker from './LevelPicker';
import { findChapter } from '../../data/curriculum';

const AVATAR_KEY = 'hola_avatar_data_url';

// 배지 획득 기준. 여기 목록에 없는 배지는 없어요 — 조건을 채우면 자동으로 마이페이지에 나타나요.
const ALL_BADGES = [
  { id: 'streak3', label: '3일 연속 학습', requirement: '연속 학습 3일', check: (p) => p.streak >= 3 },
  { id: 'streak7', label: '7일 연속 학습', requirement: '연속 학습 7일', check: (p) => p.streak >= 7 },
  { id: 'streak30', label: '30일 연속 학습', requirement: '연속 학습 30일', check: (p) => p.streak >= 30 },
  { id: 'chapter1', label: '첫 챕터 완료', requirement: '챕터 1개 완료', check: (p) => p.completedChapters.length >= 1 },
  { id: 'chapter10', label: '챕터 10개 완료', requirement: '챕터 10개 완료', check: (p) => p.completedChapters.length >= 10 },
  { id: 'points500', label: '500P 달성', requirement: '포인트 500P 이상', check: (p) => p.points >= 500 },
];

export default function MyPage() {
  const { profile, saveProfilePatch, myGroup, backendMode, showToast } = useApp();
  const [editing, setEditing] = useState(false);
  const [draftNickname, setDraftNickname] = useState(profile.nickname);
  const [draftBio, setDraftBio] = useState(profile.bio);
  const [avatar, setAvatar] = useState(null);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    setAvatar(localStorage.getItem(AVATAR_KEY));
  }, []);

  const currentLevelTag = findChapter(profile.currentChapterId)?.levelTag || 'Prep';

  const handleAvatarFile = (file) => {
    if (!file) return;
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const size = 200;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        localStorage.setItem(AVATAR_KEY, dataUrl);
        setAvatar(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <h1>마이페이지</h1>
      <div className="card elev-md" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20, alignItems: 'center', marginTop: 8 }}>
        <div
          className="avatar-upload"
          style={{ width: 88, height: 88 }}
          onClick={() => fileRef.current?.click()}
        >
          {avatar ? <img src={avatar} alt="프로필 사진" /> : '사진 추가'}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleAvatarFile(e.target.files?.[0])} />

        <div style={{ flex: 1, minWidth: 200 }}>
          {!editing && (
            <>
              <div className="card-title">{profile.nickname || '닉네임을 설정해보세요'}</div>
              <p className="card-body" style={{ opacity: 1 }}>{profile.bio}</p>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setDraftNickname(profile.nickname);
                  setDraftBio(profile.bio);
                  setEditing(true);
                }}
              >
                프로필 수정
              </button>
            </>
          )}
          {editing && (
            <>
              <div className="field"><label>닉네임</label><input className="input" value={draftNickname} onChange={(e) => setDraftNickname(e.target.value)} /></div>
              <div className="field"><label>한 줄 소개</label><input className="input" value={draftBio} onChange={(e) => setDraftBio(e.target.value)} /></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    saveProfilePatch({ nickname: draftNickname.trim(), bio: draftBio });
                    setEditing(false);
                    showToast('프로필을 저장했어요.');
                  }}
                >
                  저장
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>취소</button>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginTop: 20 }}>
        <div className="card elev-sm"><div className="card-kicker">현재 레벨</div><div className="card-title">{currentLevelTag}</div></div>
        <div className="card elev-sm"><div className="card-kicker">포인트</div><div className="card-title">{profile.points}P</div></div>
        <div className="card elev-sm"><div className="card-kicker">완료 챕터</div><div className="card-title">{profile.completedChapters.length}개</div></div>
      </div>

      <h3 style={{ marginTop: 24 }}>가입한 그룹</h3>
      {myGroup ? (
        <div className="card elev-sm" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{myGroup.name}</span><span className="tag tag-neutral">{myGroup.inviteCode}</span>
        </div>
      ) : (
        <p className="text-muted" style={{ fontSize: 13 }}>아직 그룹에 가입하지 않았어요. 그룹 메뉴에서 만들거나 참여해보세요.</p>
      )}

      <h3 style={{ marginTop: 24 }}>학습 시작 레벨</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
          레벨테스트 결과와 상관없이, 언제든 원하는 레벨의 첫 챕터로 다시 시작할 수 있어요.
        </p>
        <button type="button" className="btn btn-ghost" onClick={() => setShowLevelPicker((v) => !v)}>
          {showLevelPicker ? '닫기' : '레벨 변경하기'}
        </button>
      </div>
      {showLevelPicker && <div style={{ marginTop: 12 }}><LevelPicker onPicked={() => setShowLevelPicker(false)} /></div>}

      <h3 style={{ marginTop: 24 }}>배지</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {ALL_BADGES.map((b) => {
          const earned = b.check(profile);
          return (
            <span
              key={b.id}
              className={earned ? 'tag tag-accent' : 'tag tag-neutral'}
              style={!earned ? { opacity: 0.55 } : undefined}
              title={earned ? '획득 완료' : `조건: ${b.requirement}`}
            >
              {earned ? '' : '🔒 '}{b.label}
            </span>
          );
        })}
      </div>

      <h3 style={{ marginTop: 24 }}>학습 카드 공유</h3>
      <ShareCardButton
        label="프로필 카드 저장"
        filename="hola-profile"
        eyebrow="내 스페인어 여정"
        title={profile.nickname || '나의 학습 기록'}
        subtitle={profile.bio}
        stats={[
          { label: '연속 학습', value: `${profile.streak}일` },
          { label: '완료 챕터', value: `${profile.completedChapters.length}개` },
          { label: '포인트', value: `${profile.points}P` },
        ]}
      />

      <p className="text-muted" style={{ fontSize: 11, marginTop: 32 }}>
        데이터 저장 방식: {backendMode === 'supabase' ? 'Supabase 연동됨 (여러 기기·사람과 공유)' : '로컬 저장 모드 (Supabase 미설정 — README 참고)'}
      </p>
    </div>
  );
}

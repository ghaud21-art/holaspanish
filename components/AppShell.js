'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AppContext } from './AppContext';
import { api } from '../lib/api';
import { FLAT_CHAPTERS, findChapter } from '../data/curriculum';
import { mockGrade, PASS_THRESHOLD } from '../lib/grading';
import { DAILY_VOCAB_GOAL } from '../lib/constants';
import { todayKey, diffDaysLocal } from '../lib/date';
import Nav from './Nav';
import LoginScreen from './LoginScreen';
import Dashboard from './screens/Dashboard';
import LevelTest from './screens/LevelTest';
import { ChapterList, ChapterDetail } from './screens/Chapters';
import VocabNotebook from './screens/VocabNotebook';
import { GroupScreen, BoardScreen, RankingScreen } from './screens/Social';
import MyPage from './screens/MyPage';
import AdminScreen from './screens/AdminScreen';

const DEFAULT_PROFILE = {
  nickname: '',
  bio: '',
  points: 0,
  streak: 0,
  totalMinutes: 0,
  completedChapters: [],
  currentChapterId: FLAT_CHAPTERS[0].id,
  badges: [],
  lastStudyDate: '',
  dailyVocabDate: '',
  dailyVocabWords: [],
};

// 학습 활동(단어 카드, 작문 제출 등)이 있을 때마다 호출해서 스트릭/누적 시간/오늘의 단어 목표를 함께 갱신합니다.
// wordKey를 넘기면 "오늘 학습한 고유 단어" 목록에 추가합니다 (같은 단어를 여러 번 뒤집어도 중복 집계되지 않도록).
function buildActivityPatch(profile, { minutes = 0, wordKey } = {}) {
  const today = todayKey();
  let streak = profile.streak;
  if (profile.lastStudyDate === today) {
    // 오늘 이미 활동 기록이 있으면 스트릭은 그대로 둠
  } else if (profile.lastStudyDate) {
    const diffDays = diffDaysLocal(today, profile.lastStudyDate);
    streak = diffDays === 1 ? streak + 1 : 1;
  } else {
    streak = 1;
  }

  let dailyVocabWords = profile.dailyVocabDate === today ? profile.dailyVocabWords : [];
  if (wordKey && !dailyVocabWords.includes(wordKey)) {
    dailyVocabWords = [...dailyVocabWords, wordKey];
  }

  return {
    streak,
    lastStudyDate: today,
    totalMinutes: profile.totalMinutes + minutes,
    dailyVocabDate: today,
    dailyVocabWords,
  };
}

export default function AppShell() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id || null;
  const isAdmin = session?.user?.role === 'admin';
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [backendMode, setBackendMode] = useState('local');

  const [screen, setScreen] = useState('dashboard');
  const [openChapterId, setOpenChapterId] = useState(null);
  const [chapterUi, setChapterUi] = useState({});
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const [myGroup, setMyGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [generatedVocab, setGeneratedVocab] = useState([]);

  const profileRef = useRef(profile);
  profileRef.current = profile;

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const [profileRes, groupsRes, statusRes, vocabRes] = await Promise.all([
          api.getProfile(userId),
          api.getGroups(userId),
          api.status(),
          api.getGeneratedVocab().catch(() => ({ words: [] })),
        ]);
        setGeneratedVocab(vocabRes.words || []);
        let nextProfile = { ...DEFAULT_PROFILE, ...profileRes.profile };
        if (!nextProfile.nickname && session?.user?.name) {
          nextProfile = { ...nextProfile, nickname: session.user.name };
          api.saveProfile(userId, { nickname: session.user.name }).catch(() => {});
        }
        setProfile(nextProfile);
        setBackendMode(statusRes.mode);
        const first = groupsRes.myGroups?.[0] || null;
        setMyGroup(first || null);
        if (first) {
          const [membersRes, postsRes] = await Promise.all([
            api.getGroupMembers(first.groupId),
            api.getPosts(first.groupId),
          ]);
          setMembers(membersRes.members || []);
          setPosts(postsRes.posts || []);
        }
      } catch (err) {
        showToast('데이터를 불러오지 못했어요: ' + err.message);
      } finally {
        setLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const saveProfilePatch = useCallback(
    (patch) => {
      setProfile((prev) => ({ ...prev, ...patch }));
      if (!userId) return;
      api.saveProfile(userId, patch).catch((err) => showToast('저장에 실패했어요: ' + err.message));
    },
    [userId, showToast]
  );

  const isChapterDone = useCallback((id) => profile.completedChapters.includes(id), [profile.completedChapters]);
  const isChapterCurrent = useCallback((id) => profile.currentChapterId === id, [profile.currentChapterId]);
  const isChapterLocked = useCallback((id) => !isChapterDone(id) && !isChapterCurrent(id), [isChapterDone, isChapterCurrent]);

  const openChapter = useCallback(
    (id) => {
      if (isChapterLocked(id)) {
        showToast('이전 챕터를 완료하면 열려요');
        return;
      }
      const chapter = findChapter(id);
      setChapterUi((prev) => {
        if (prev[id]) return prev;
        return {
          ...prev,
          [id]: {
            flipped: false,
            queue: chapter.keyVocab ? chapter.keyVocab.map((_, i) => i) : [],
            writingText: '',
            gradingStatus: 'idle',
            gradingResult: null,
          },
        };
      });
      setOpenChapterId(id);
    },
    [isChapterLocked, showToast]
  );
  const closeChapter = useCallback(() => setOpenChapterId(null), []);

  const updateChapterUi = useCallback((id, patch) => {
    setChapterUi((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const flipCard = useCallback(() => {
    const ui = chapterUi[openChapterId];
    if (!ui) return;
    updateChapterUi(openChapterId, { flipped: !ui.flipped });
  }, [chapterUi, openChapterId, updateChapterUi]);

  const markCard = useCallback(
    (known) => {
      const id = openChapterId;
      const ui = chapterUi[id];
      if (!ui) return;
      const chapter = findChapter(id);
      const wordIdx = ui.queue[0];
      const word = wordIdx !== undefined ? chapter?.keyVocab?.[wordIdx] : null;
      const queue = [...ui.queue];
      const idx = queue.shift();
      if (!known && idx !== undefined) queue.push(idx);
      updateChapterUi(id, { queue, flipped: false });
      saveProfilePatch(
        buildActivityPatch(profileRef.current, { minutes: 2, wordKey: word ? `${id}:${word.es}` : undefined })
      );
    },
    [chapterUi, openChapterId, updateChapterUi, saveProfilePatch]
  );

  const recordVocabWord = useCallback(
    (wordKey) => {
      saveProfilePatch(buildActivityPatch(profileRef.current, { minutes: 1, wordKey }));
    },
    [saveProfilePatch]
  );

  const setWritingText = useCallback(
    (text) => updateChapterUi(openChapterId, { writingText: text }),
    [openChapterId, updateChapterUi]
  );

  const refreshPosts = useCallback(async () => {
    if (!myGroup) return;
    const res = await api.getPosts(myGroup.groupId);
    setPosts(res.posts || []);
  }, [myGroup]);

  const submitWriting = useCallback(() => {
    const id = openChapterId;
    const ui = chapterUi[id];
    if (!ui) return;
    updateChapterUi(id, { gradingStatus: 'loading' });
    (async () => {
      const chapter = findChapter(id);
      let score, feedback, passed;
      try {
        const result = await api.gradeWriting({
          titleEs: chapter.titleEs,
          titleKr: chapter.titleKr,
          prompt: chapter.writingPrompt,
          text: ui.writingText,
        });
        score = result.score;
        feedback = result.feedback;
        passed = result.passed;
      } catch {
        // 서버 라우트 자체에서 이미 규칙 기반 채점으로 폴백하지만, 네트워크 요청 자체가
        // 실패하는 극단적인 경우를 대비한 이중 안전장치예요.
        const g = mockGrade(ui.writingText);
        score = g.score;
        feedback = g.feedback;
        passed = score >= PASS_THRESHOLD;
      }
      updateChapterUi(id, { gradingStatus: 'done', gradingResult: { score, feedback, passed } });

      if (passed) {
        const p = profileRef.current;
        const alreadyDone = p.completedChapters.includes(id);
        const studyPatch = buildActivityPatch(p, { minutes: 10 });
        const patch = { ...studyPatch };
        if (!alreadyDone) {
          const idx = FLAT_CHAPTERS.findIndex((c) => c.id === id);
          const next = FLAT_CHAPTERS[idx + 1];
          patch.completedChapters = [...p.completedChapters, id];
          patch.points = p.points + 50;
          if (p.currentChapterId === id && next) patch.currentChapterId = next.id;
        }
        saveProfilePatch(patch);
        showToast(alreadyDone ? '다시 통과했어요!' : '챕터 통과! +50P 획득');

        if (myGroup) {
          try {
            await api.createPost({
              groupId: myGroup.groupId,
              userId,
              nickname: p.nickname || '익명',
              chapterId: id,
              chapterTitle: chapter.titleEs,
              text: ui.writingText,
              score,
              feedback,
            });
            refreshPosts();
            api.getGroupMembers(myGroup.groupId).then((r) => setMembers(r.members || []));
          } catch {
            // 게시판 공유는 선택 사항이라 실패해도 조용히 넘어감
          }
        }
      }
    })();
  }, [chapterUi, openChapterId, updateChapterUi, saveProfilePatch, showToast, myGroup, userId, refreshPosts]);

  const refreshMembers = useCallback(async (groupId) => {
    const res = await api.getGroupMembers(groupId);
    setMembers(res.members || []);
  }, []);

  const createGroup = useCallback(
    async (name) => {
      const res = await api.createGroup(userId, name);
      setMyGroup(res.group);
      await Promise.all([refreshMembers(res.group.groupId), api.getPosts(res.group.groupId).then((r) => setPosts(r.posts || []))]);
    },
    [userId, refreshMembers]
  );

  const joinGroup = useCallback(
    async (code) => {
      const res = await api.joinGroup(userId, code);
      setMyGroup(res.group);
      await Promise.all([refreshMembers(res.group.groupId), api.getPosts(res.group.groupId).then((r) => setPosts(r.posts || []))]);
    },
    [userId, refreshMembers]
  );

  const cheerMember = useCallback(
    async (targetUserId) => {
      if (!myGroup) return;
      setMembers((prev) => prev.map((m) => (m.userId === targetUserId ? { ...m, cheers: m.cheers + 1 } : m)));
      try {
        await api.cheerMember(myGroup.groupId, targetUserId);
        showToast('응원을 보냈어요!');
      } catch (err) {
        showToast('응원 보내기에 실패했어요: ' + err.message);
      }
    },
    [myGroup, showToast]
  );

  const reactPost = useCallback(
    async (postId, emoji) => {
      setPosts((prev) => prev.map((p) => (p.postId === postId ? { ...p, reactions: { ...p.reactions, [emoji]: (p.reactions[emoji] || 0) + 1 } } : p)));
      try {
        await api.reactPost(postId, emoji);
      } catch {
        refreshPosts();
      }
    },
    [refreshPosts]
  );

  const commentPost = useCallback(
    async (postId, uid, nickname, text) => {
      try {
        await api.commentPost(postId, uid, nickname, text);
        refreshPosts();
      } catch (err) {
        showToast('댓글 등록에 실패했어요: ' + err.message);
      }
    },
    [refreshPosts, showToast]
  );

  const value = {
    userId,
    profile,
    saveProfilePatch,
    screen,
    setScreen,
    openChapterId,
    setOpenChapterId,
    chapterUi,
    toast,
    showToast,
    isChapterDone,
    isChapterCurrent,
    isChapterLocked,
    openChapter,
    closeChapter,
    flipCard,
    markCard,
    recordVocabWord,
    setWritingText,
    submitWriting,
    myGroup,
    members,
    posts,
    createGroup,
    joinGroup,
    cheerMember,
    reactPost,
    commentPost,
    backendMode,
    isAdmin,
    generatedVocab,
  };

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="text-muted">불러오는 중…</span>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <LoginScreen />;
  }

  if (!loaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="text-muted">불러오는 중…</span>
      </div>
    );
  }

  let ScreenComp = Dashboard;
  const activeScreen = openChapterId && screen === 'chapters' ? 'chapterDetail' : screen;
  if (activeScreen === 'leveltest') ScreenComp = LevelTest;
  else if (activeScreen === 'chapters') ScreenComp = ChapterList;
  else if (activeScreen === 'chapterDetail') ScreenComp = ChapterDetail;
  else if (activeScreen === 'vocab') ScreenComp = VocabNotebook;
  else if (activeScreen === 'group') ScreenComp = GroupScreen;
  else if (activeScreen === 'board') ScreenComp = BoardScreen;
  else if (activeScreen === 'ranking') ScreenComp = RankingScreen;
  else if (activeScreen === 'mypage') ScreenComp = MyPage;
  else if (activeScreen === 'admin' && isAdmin) ScreenComp = AdminScreen;

  return (
    <AppContext.Provider value={value}>
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <Nav />
        {toast && <div className="toast-pop">{toast}</div>}
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px clamp(16px,4vw,32px) 64px' }}>
          <ScreenComp />
        </main>
      </div>
    </AppContext.Provider>
  );
}

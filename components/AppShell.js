'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AppContext } from './AppContext';
import { api } from '../lib/api';
import { FLAT_CHAPTERS, findChapter } from '../data/curriculum';
import { mockGrade, PASS_THRESHOLD } from '../lib/grading';
import { DAILY_VOCAB_GOAL } from '../lib/constants';
import { todayKey, diffDaysLocal } from '../lib/date';
import { resolveWordKey } from '../lib/vocabLookup';
import Nav from './Nav';
import LoginScreen from './LoginScreen';
import Dashboard from './screens/Dashboard';
import LevelTest from './screens/LevelTest';
import { ChapterList, ChapterDetail } from './screens/Chapters';
import VocabNotebook from './screens/VocabNotebook';
import { GroupScreen, BoardScreen } from './screens/Social';
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
  aiUsageCount: 0,
  aiUnlimited: false,
  levelTestDone: false,
};

// 학습 활동(단어 카드, 작문 제출 등)이 있을 때마다 호출해서 스트릭/누적 시간/오늘의 단어 목표를 함께 갱신합니다.
// wordKey를 넘기면 "오늘 학습한 고유 단어" 목록에 추가합니다 (같은 단어를 여러 번 뒤집어도 중복 집계되지 않도록).
// 그룹에 가입하지 않은 사용자도 작문 게시판을 쓸 수 있도록, 그룹이 없으면 이 개인 게시판 ID를 써요.
function soloBoardId(userId) {
  return `solo:${userId}`;
}

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
  const [myPosts, setMyPosts] = useState([]);
  const [groupPosts, setGroupPosts] = useState([]);
  const [generatedVocab, setGeneratedVocab] = useState([]);
  const [vocabProgress, setVocabProgress] = useState([]);
  const [practiceUi, setPracticeUi] = useState({
    kr: '', text: '', status: 'idle', result: null, count: 0, helpChat: [], helpStatus: 'idle',
  });

  const profileRef = useRef(profile);
  profileRef.current = profile;
  const practiceUiRef = useRef(practiceUi);
  practiceUiRef.current = practiceUi;
  const generatedVocabRef = useRef(generatedVocab);
  generatedVocabRef.current = generatedVocab;
  const myPostsRef = useRef(myPosts);
  myPostsRef.current = myPosts;
  // 같은 세션 안에서 건너뛰거나 새로 받은 문장까지 포함해서, 방금 추천받은 문장을 또 추천하지 않게 해요.
  const practiceHistoryRef = useRef([]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const [profileRes, groupsRes, statusRes, vocabRes, progressRes] = await Promise.all([
          api.getProfile(userId),
          api.getGroups(userId),
          api.status(),
          api.getGeneratedVocab().catch(() => ({ words: [] })),
          api.getVocabProgress().catch(() => ({ items: [] })),
        ]);
        setGeneratedVocab(vocabRes.words || []);
        setVocabProgress(progressRes.items || []);
        let nextProfile = { ...DEFAULT_PROFILE, ...profileRes.profile };
        if (!nextProfile.nickname && session?.user?.name) {
          nextProfile = { ...nextProfile, nickname: session.user.name };
          api.saveProfile(userId, { nickname: session.user.name }).catch(() => {});
        }
        setProfile(nextProfile);
        setBackendMode(statusRes.mode);
        // 레벨테스트는 가입 직후 한 번만 자동으로 띄워요. 그 이후엔 마이페이지에서만 다시 볼 수 있어요.
        if (!nextProfile.levelTestDone) setScreen('leveltest');
        const first = groupsRes.myGroups?.[0] || null;
        setMyGroup(first || null);
        const [membersRes, myPostsRes, groupPostsRes] = await Promise.all([
          first ? api.getGroupMembers(first.groupId) : Promise.resolve({ members: [] }),
          api.getPosts(soloBoardId(userId)),
          first ? api.getPosts(first.groupId) : Promise.resolve({ posts: [] }),
        ]);
        setMembers(membersRes.members || []);
        setMyPosts(myPostsRes.posts || []);
        setGroupPosts(groupPostsRes.posts || []);
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
  // currentChapterId는 진도 포인터일 뿐이라 completedChapters와 어긋날 수 있어요(예: 챕터를 통과했는데
  // 포인터가 그대로 남는 경우). 그래서 잠금 여부는 currentChapterId만 보지 않고, 바로 이전 챕터가
  // 완료됐는지로도 판단해서 completedChapters가 실제 진도의 기준이 되게 합니다.
  const isChapterLocked = useCallback(
    (id) => {
      if (isChapterDone(id) || isChapterCurrent(id)) return false;
      const idx = FLAT_CHAPTERS.findIndex((c) => c.id === id);
      const prev = FLAT_CHAPTERS[idx - 1];
      return prev ? !isChapterDone(prev.id) : false;
    },
    [isChapterDone, isChapterCurrent]
  );

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
            helpChat: [],
            helpStatus: 'idle',
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

  const recordProgress = useCallback((wordKey, es, kr, action) => {
    api
      .recordVocabProgress({ wordKey, es, kr, action })
      .then((res) => {
        setVocabProgress((prev) => {
          const idx = prev.findIndex((p) => p.wordKey === wordKey);
          if (idx === -1) return [...prev, res.item];
          const next = [...prev];
          next[idx] = res.item;
          return next;
        });
      })
      .catch(() => {});
  }, []);

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
      if (known && word) recordProgress(`${id}:${word.es}`, word.es, word.kr, 'learn');
    },
    [chapterUi, openChapterId, updateChapterUi, saveProfilePatch, recordProgress]
  );

  const recordVocabWord = useCallback(
    (wordKey) => {
      saveProfilePatch(buildActivityPatch(profileRef.current, { minutes: 1, wordKey }));
      const resolved = resolveWordKey(wordKey, generatedVocabRef.current);
      if (resolved) recordProgress(wordKey, resolved.es, resolved.kr, 'learn');
    },
    [saveProfilePatch, recordProgress]
  );

  const setWritingText = useCallback(
    (text) => updateChapterUi(openChapterId, { writingText: text }),
    [openChapterId, updateChapterUi]
  );

  const askWritingHelp = useCallback(
    (question) => {
      const id = openChapterId;
      const ui = chapterUi[id];
      if (!ui || !question || !question.trim()) return;
      const chapter = findChapter(id);
      const history = ui.helpChat || [];
      const nextHistory = [...history, { role: 'user', text: question.trim() }];
      updateChapterUi(id, { helpChat: nextHistory, helpStatus: 'loading' });
      api
        .askWritingHelp({
          titleEs: chapter.titleEs,
          titleKr: chapter.titleKr,
          level: chapter.levelTag,
          prompt: chapter.writingPrompt,
          currentText: ui.writingText,
          question: question.trim(),
          history,
        })
        .then((res) => {
          updateChapterUi(id, { helpChat: [...nextHistory, { role: 'assistant', text: res.reply }], helpStatus: 'idle' });
        })
        .catch((err) => {
          updateChapterUi(id, {
            helpChat: [...nextHistory, { role: 'assistant', text: err.message || '도움을 가져오지 못했어요.' }],
            helpStatus: 'idle',
          });
        });
    },
    [openChapterId, chapterUi, updateChapterUi]
  );

  const refreshPosts = useCallback(async () => {
    const soloRes = await api.getPosts(soloBoardId(userId));
    setMyPosts(soloRes.posts || []);
    if (myGroup) {
      const groupRes = await api.getPosts(myGroup.groupId);
      setGroupPosts(groupRes.posts || []);
    }
  }, [myGroup, userId]);

  const suggestPractice = useCallback(() => {
    setPracticeUi((prev) => ({ kr: '', text: '', status: 'loading', result: null, count: prev.count, helpChat: [], helpStatus: 'idle' }));
    const p = profileRef.current;
    // 이번 세션에서 이미 보여준 문장 + 예전에 제출했던 연습 문장을 합쳐서, 비슷한 문장이 또 나오지 않게 해요.
    const pastFromPosts = myPostsRef.current.filter((post) => post.chapterId === 'practice').map((post) => post.chapterTitle);
    const recentPrompts = [...new Set([...practiceHistoryRef.current, ...pastFromPosts])].slice(-15);
    api
      .getPracticePrompt({
        level: findChapter(p.currentChapterId)?.levelTag || 'A1',
        completedChapters: p.completedChapters,
        recentPrompts,
      })
      .then((res) => {
        practiceHistoryRef.current = [...practiceHistoryRef.current, res.kr].slice(-20);
        setPracticeUi((prev) => ({ kr: res.kr, text: '', status: 'idle', result: null, count: prev.count, helpChat: [], helpStatus: 'idle' }));
      })
      .catch((err) => {
        showToast('연습 문장을 가져오지 못했어요: ' + err.message);
        setPracticeUi((prev) => ({ kr: '', text: '', status: 'idle', result: null, count: prev.count, helpChat: [], helpStatus: 'idle' }));
      });
  }, [showToast]);

  const setPracticeText = useCallback((text) => {
    setPracticeUi((prev) => ({ ...prev, text }));
  }, []);

  const askPracticeHelp = useCallback((question) => {
    if (!question || !question.trim()) return;
    const cur = practiceUiRef.current;
    const history = cur.helpChat || [];
    const nextHistory = [...history, { role: 'user', text: question.trim() }];
    setPracticeUi((prev) => ({ ...prev, helpChat: nextHistory, helpStatus: 'loading' }));
    api
      .askWritingHelp({
        titleEs: '',
        titleKr: '작문 연습',
        level: findChapter(profileRef.current.currentChapterId)?.levelTag || 'A1',
        prompt: cur.kr,
        currentText: cur.text,
        question: question.trim(),
        history,
      })
      .then((res) => {
        setPracticeUi((prev) => ({ ...prev, helpChat: [...nextHistory, { role: 'assistant', text: res.reply }], helpStatus: 'idle' }));
      })
      .catch((err) => {
        setPracticeUi((prev) => ({
          ...prev,
          helpChat: [...nextHistory, { role: 'assistant', text: err.message || '도움을 가져오지 못했어요.' }],
          helpStatus: 'idle',
        }));
      });
  }, []);

  // 챕터 작문과 달리 통과 여부와 상관없이 항상 게시판에 기록해서, 연습한 흔적이 남게 해요.
  const submitPractice = useCallback(() => {
    setPracticeUi((prev) => ({ ...prev, status: 'grading' }));
    (async () => {
      const { kr, text } = practiceUi;
      let score, feedback, passed;
      try {
        const result = await api.gradePractice({ krPrompt: kr, text });
        score = result.score;
        feedback = result.feedback;
        passed = result.passed;
      } catch (err) {
        setPracticeUi((prev) => ({ ...prev, status: 'idle' }));
        showToast('채점에 실패했어요: ' + err.message);
        return;
      }
      setPracticeUi((prev) => ({ ...prev, status: 'done', result: { score, feedback, passed }, count: prev.count + 1 }));

      const p = profileRef.current;
      const patch = buildActivityPatch(p, { minutes: 5 });
      if (passed) patch.points = p.points + 20;
      saveProfilePatch(patch);

      try {
        const postBase = {
          userId,
          nickname: p.nickname || '익명',
          chapterId: 'practice',
          chapterTitle: kr,
          text,
          score,
          feedback,
        };
        await api.createPost({ ...postBase, groupId: soloBoardId(userId) });
        if (myGroup) await api.createPost({ ...postBase, groupId: myGroup.groupId });
        refreshPosts();
      } catch {
        // 게시판 공유는 선택 사항이라 실패해도 조용히 넘어감
      }
    })();
  }, [practiceUi, saveProfilePatch, showToast, userId, myGroup, refreshPosts]);

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
          patch.completedChapters = [...p.completedChapters, id];
          patch.points = p.points + 50;
        }
        // 이미 완료했던 챕터를 다시 통과한 경우에도, 진도 포인터가 아직 이 챕터에 머물러 있다면
        // 다음 챕터로 넘겨줘요 (포인터가 completedChapters보다 뒤처져서 다음 챕터가 안 열리는 문제 방지).
        if (p.currentChapterId === id) {
          const idx = FLAT_CHAPTERS.findIndex((c) => c.id === id);
          const next = FLAT_CHAPTERS[idx + 1];
          if (next) patch.currentChapterId = next.id;
        }
        saveProfilePatch(patch);
        showToast(alreadyDone ? '다시 통과했어요!' : '챕터 통과! +50P 획득');

        // 개인 게시판에는 항상 기록하고, 그룹에 가입돼 있으면 그룹 게시판에도 별도로 남겨서
        // "내 게시판"과 "그룹 게시판"이 서로 분리되어 각자 유지되게 해요.
        try {
          const postBase = {
            userId,
            nickname: p.nickname || '익명',
            chapterId: id,
            chapterTitle: chapter.titleEs,
            text: ui.writingText,
            score,
            feedback,
          };
          await api.createPost({ ...postBase, groupId: soloBoardId(userId) });
          if (myGroup) await api.createPost({ ...postBase, groupId: myGroup.groupId });
          refreshPosts();
          if (myGroup) api.getGroupMembers(myGroup.groupId).then((r) => setMembers(r.members || []));
        } catch {
          // 게시판 공유는 선택 사항이라 실패해도 조용히 넘어감
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
      await Promise.all([refreshMembers(res.group.groupId), api.getPosts(res.group.groupId).then((r) => setGroupPosts(r.posts || []))]);
    },
    [userId, refreshMembers]
  );

  const joinGroup = useCallback(
    async (code) => {
      const res = await api.joinGroup(userId, code);
      setMyGroup(res.group);
      await Promise.all([refreshMembers(res.group.groupId), api.getPosts(res.group.groupId).then((r) => setGroupPosts(r.posts || []))]);
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
      const bump = (prev) =>
        prev.map((p) => (p.postId === postId ? { ...p, reactions: { ...p.reactions, [emoji]: (p.reactions[emoji] || 0) + 1 } } : p));
      setMyPosts(bump);
      setGroupPosts(bump);
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

  const deleteComment = useCallback(
    async (postId, commentIndex) => {
      try {
        await api.deleteComment(postId, commentIndex);
        refreshPosts();
      } catch (err) {
        showToast('댓글 삭제에 실패했어요: ' + err.message);
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
    askWritingHelp,
    practiceUi,
    suggestPractice,
    setPracticeText,
    submitPractice,
    askPracticeHelp,
    myGroup,
    members,
    myPosts,
    groupPosts,
    createGroup,
    joinGroup,
    cheerMember,
    reactPost,
    commentPost,
    deleteComment,
    backendMode,
    isAdmin,
    generatedVocab,
    vocabProgress,
    recordProgress,
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

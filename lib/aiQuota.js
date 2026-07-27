import { getRows, updateRow } from './db';
import { AI_FREE_LIMIT } from './constants';

// 기본 회원은 Gemini 기능(작문 첨삭 + 작문 도우미 합산)을 이 횟수까지만 무료로 쓸 수 있어요.
// 관리자가 특정 사용자에게 무제한 권한(aiUnlimited)을 주면 이 제한이 적용되지 않아요.
export { AI_FREE_LIMIT };

// 호출 전에 사용 가능 여부를 확인하고, 가능하면 사용 횟수를 1 늘려요.
export async function checkAndConsumeAiQuota(userId) {
  const rows = await getRows('Profiles');
  const row = rows.find((r) => r.userId === userId);
  const unlimited = Boolean(row?.aiUnlimited);
  const usage = Number(row?.aiUsageCount || 0);

  if (unlimited) return { allowed: true, unlimited: true, usage };
  if (usage >= AI_FREE_LIMIT) return { allowed: false, unlimited: false, usage, limit: AI_FREE_LIMIT };

  if (row) await updateRow('Profiles', 'userId', userId, { aiUsageCount: usage + 1 });
  return { allowed: true, unlimited: false, usage: usage + 1, limit: AI_FREE_LIMIT };
}

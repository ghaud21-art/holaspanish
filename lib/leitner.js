import { todayKey } from './date';

// 라이트너 상자(box) 인덱스별 다음 복습까지의 간격(일). 정답을 맞힐 때마다 다음 상자로 이동해서
// 복습 간격이 점점 늘어나고, 틀리면 0번 상자(내일 다시)로 돌아갑니다.
const INTERVAL_DAYS = [1, 3, 7, 16, 35];
export const MAX_BOX = INTERVAL_DAYS.length - 1;

export function scheduleNext(box, fromDateKey = todayKey()) {
  const days = INTERVAL_DAYS[Math.min(Math.max(box, 0), MAX_BOX)];
  const [y, m, d] = fromDateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return todayKey(dt);
}

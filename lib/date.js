// toISOString()은 UTC 기준이라, 한국(UTC+9)처럼 UTC보다 앞선 시간대에서는
// 자정이 지나도 오전 9시까지 "어제"로 취급되는 문제가 있어요.
// 스트릭/오늘의 단어 목표처럼 "오늘" 개념이 중요한 값은 전부 이 로컬 날짜 키를 사용합니다.
export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function diffDaysLocal(dateKeyA, dateKeyB) {
  const [ay, am, ad] = dateKeyA.split('-').map(Number);
  const [by, bm, bd] = dateKeyB.split('-').map(Number);
  const a = new Date(ay, am - 1, ad);
  const b = new Date(by, bm - 1, bd);
  return Math.round((a - b) / 86400000);
}

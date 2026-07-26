export function safeParseJSON(str, fallback) {
  if (str === undefined || str === null || str === '') return fallback;
  try {
    const val = JSON.parse(str);
    return val ?? fallback;
  } catch {
    return fallback;
  }
}

export function makeInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function nowIso() {
  return new Date().toISOString();
}

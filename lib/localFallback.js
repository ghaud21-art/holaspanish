// 구글 시트가 아직 설정되지 않았을 때(로컬 개발 등) 쓰는 파일 기반 임시 저장소.
// Vercel 같은 서버리스 환경에서는 파일시스템이 매 요청마다 초기화될 수 있으므로
// "진짜 여러 사람과 같이 쓰는" 배포에는 구글 시트 설정이 꼭 필요합니다.
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), '.local-db.json');

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

export function localGetRows(tab) {
  const db = readDb();
  return db[tab] || [];
}

export function localAppendRow(tab, obj) {
  const db = readDb();
  if (!db[tab]) db[tab] = [];
  db[tab].push(obj);
  writeDb(db);
  return obj;
}

export function localUpdateRow(tab, keyField, keyValue, patch) {
  const db = readDb();
  const rows = db[tab] || [];
  const row = rows.find((r) => r[keyField] === keyValue);
  if (!row) return null;
  Object.assign(row, patch);
  writeDb(db);
  return row;
}

export function localUpdateWhere(tab, matchObj, patch) {
  const db = readDb();
  const rows = db[tab] || [];
  const entries = Object.entries(matchObj);
  const row = rows.find((r) => entries.every(([k, v]) => r[k] === v));
  if (!row) return null;
  Object.assign(row, patch);
  writeDb(db);
  return row;
}

export function localDeleteRow(tab, keyField, keyValue) {
  const db = readDb();
  db[tab] = (db[tab] || []).filter((r) => r[keyField] !== keyValue);
  writeDb(db);
}

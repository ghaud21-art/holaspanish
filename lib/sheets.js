// 구글 시트를 앱의 공용 데이터베이스처럼 사용하기 위한 얇은 래퍼.
// 여러 사람이 같은 시트를 보고 쓰게 되므로, 그룹/게시판/진도 같은 "다 같이 보는 데이터"는
// 전부 이 모듈을 통해서만 읽고 씁니다. 환경변수가 없으면 isSheetsConfigured()가 false를
// 반환하고, 호출부(lib/db.js)가 로컬 파일 저장으로 대신 처리합니다.
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const RAW_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const PRIVATE_KEY = RAW_PRIVATE_KEY ? RAW_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;

export const TAB_HEADERS = {
  Profiles: ['userId', 'nickname', 'bio', 'points', 'streak', 'totalMinutes', 'completedChapters', 'currentChapterId', 'badges', 'lastStudyDate', 'dailyVocabDate', 'dailyVocabWords', 'updatedAt'],
  Groups: ['groupId', 'name', 'inviteCode', 'createdAt'],
  Memberships: ['groupId', 'userId', 'joinedAt', 'cheers'],
  Posts: ['postId', 'groupId', 'userId', 'nickname', 'chapterId', 'chapterTitle', 'text', 'score', 'feedback', 'reactions', 'comments', 'createdAt'],
};

export function isSheetsConfigured() {
  return Boolean(SHEET_ID && CLIENT_EMAIL && PRIVATE_KEY);
}

let docPromise = null;

async function getDoc() {
  if (!isSheetsConfigured()) {
    throw new Error('Google Sheets가 설정되지 않았습니다. 환경변수(GOOGLE_SHEET_ID 등)를 확인하세요.');
  }
  if (!docPromise) {
    docPromise = (async () => {
      const jwt = new JWT({
        email: CLIENT_EMAIL,
        key: PRIVATE_KEY,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
      await doc.loadInfo();
      for (const [title, headers] of Object.entries(TAB_HEADERS)) {
        if (!doc.sheetsByTitle[title]) {
          await doc.addSheet({ title, headerValues: headers });
        }
      }
      return doc;
    })().catch((err) => {
      docPromise = null;
      throw err;
    });
  }
  return docPromise;
}

export async function getRows(tab) {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle[tab];
  const rows = await sheet.getRows();
  return rows.map((r) => r.toObject());
}

export async function appendRow(tab, obj) {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle[tab];
  const row = await sheet.addRow(obj);
  return row.toObject();
}

export async function updateRow(tab, keyField, keyValue, patch) {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle[tab];
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get(keyField) === keyValue);
  if (!row) return null;
  Object.entries(patch).forEach(([k, v]) => row.set(k, v));
  await row.save();
  return row.toObject();
}

export async function updateWhere(tab, matchObj, patch) {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle[tab];
  const rows = await sheet.getRows();
  const entries = Object.entries(matchObj);
  const row = rows.find((r) => entries.every(([k, v]) => r.get(k) === v));
  if (!row) return null;
  Object.entries(patch).forEach(([k, v]) => row.set(k, v));
  await row.save();
  return row.toObject();
}

export async function deleteRow(tab, keyField, keyValue) {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle[tab];
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get(keyField) === keyValue);
  if (row) await row.delete();
}

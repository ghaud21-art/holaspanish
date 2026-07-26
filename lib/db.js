// 구글 시트 연동이 되어 있으면 시트를, 아니면 로컬 파일을 쓰는 통합 데이터 접근 레이어.
// API 라우트는 이 파일만 import하면 되고, 백엔드가 뭔지는 신경 쓸 필요가 없습니다.
import * as sheets from './sheets';
import * as local from './localFallback';

export function backendMode() {
  return sheets.isSheetsConfigured() ? 'sheets' : 'local';
}

export async function getRows(tab) {
  return sheets.isSheetsConfigured() ? sheets.getRows(tab) : local.localGetRows(tab);
}

export async function appendRow(tab, obj) {
  return sheets.isSheetsConfigured() ? sheets.appendRow(tab, obj) : local.localAppendRow(tab, obj);
}

export async function updateRow(tab, keyField, keyValue, patch) {
  return sheets.isSheetsConfigured()
    ? sheets.updateRow(tab, keyField, keyValue, patch)
    : local.localUpdateRow(tab, keyField, keyValue, patch);
}

export async function updateWhere(tab, matchObj, patch) {
  return sheets.isSheetsConfigured()
    ? sheets.updateWhere(tab, matchObj, patch)
    : local.localUpdateWhere(tab, matchObj, patch);
}

export async function deleteRow(tab, keyField, keyValue) {
  return sheets.isSheetsConfigured()
    ? sheets.deleteRow(tab, keyField, keyValue)
    : local.localDeleteRow(tab, keyField, keyValue);
}

// Supabase 연동이 되어 있으면 Supabase를, 아니면 로컬 파일을 쓰는 통합 데이터 접근 레이어.
// API 라우트는 이 파일만 import하면 되고, 백엔드가 뭔지는 신경 쓸 필요가 없습니다.
import * as supabaseDb from './supabaseDb';
import * as local from './localFallback';

export function backendMode() {
  return supabaseDb.isSupabaseConfigured() ? 'supabase' : 'local';
}

export async function getRows(tab) {
  return supabaseDb.isSupabaseConfigured() ? supabaseDb.getRows(tab) : local.localGetRows(tab);
}

export async function appendRow(tab, obj) {
  return supabaseDb.isSupabaseConfigured() ? supabaseDb.appendRow(tab, obj) : local.localAppendRow(tab, obj);
}

export async function updateRow(tab, keyField, keyValue, patch) {
  return supabaseDb.isSupabaseConfigured()
    ? supabaseDb.updateRow(tab, keyField, keyValue, patch)
    : local.localUpdateRow(tab, keyField, keyValue, patch);
}

export async function updateWhere(tab, matchObj, patch) {
  return supabaseDb.isSupabaseConfigured()
    ? supabaseDb.updateWhere(tab, matchObj, patch)
    : local.localUpdateWhere(tab, matchObj, patch);
}

export async function deleteRow(tab, keyField, keyValue) {
  return supabaseDb.isSupabaseConfigured()
    ? supabaseDb.deleteRow(tab, keyField, keyValue)
    : local.localDeleteRow(tab, keyField, keyValue);
}

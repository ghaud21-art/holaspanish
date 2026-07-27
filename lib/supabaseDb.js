// Supabase(Postgres)를 앱의 공용 데이터베이스로 쓰기 위한 얇은 래퍼.
// 기존 구글 시트 버전과 같은 함수 시그니처(getRows/appendRow/updateRow/updateWhere/deleteRow)를
// 유지해서, API 라우트 쪽 코드는 거의 그대로 두고 lib/db.js에서만 이 모듈로 바꿔치기했습니다.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client = null;
function getClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return client;
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

// 시트 탭 이름 -> 실제 Postgres 테이블 이름
const TABLE_MAP = {
  Profiles: 'profiles',
  Groups: 'groups',
  Memberships: 'memberships',
  Posts: 'posts',
  GeneratedVocab: 'generated_vocab',
  VocabProgress: 'vocab_progress',
};

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
}
function snakeToCamel(str) {
  return str.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function rowToSnake(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[camelToSnake(k)] = v;
  return out;
}
function rowToCamel(obj) {
  if (!obj) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[snakeToCamel(k)] = v;
  return out;
}

function table(tab) {
  const name = TABLE_MAP[tab];
  if (!name) throw new Error(`알 수 없는 테이블: ${tab}`);
  const sb = getClient();
  if (!sb) throw new Error('Supabase가 설정되지 않았습니다.');
  return sb.from(name);
}

export async function getRows(tab) {
  const { data, error } = await table(tab).select('*');
  if (error) throw new Error(error.message);
  return (data || []).map(rowToCamel);
}

export async function appendRow(tab, obj) {
  const { data, error } = await table(tab).insert(rowToSnake(obj)).select().single();
  if (error) throw new Error(error.message);
  return rowToCamel(data);
}

export async function updateRow(tab, keyField, keyValue, patch) {
  const { data, error } = await table(tab)
    .update(rowToSnake(patch))
    .eq(camelToSnake(keyField), keyValue)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToCamel(data);
}

export async function updateWhere(tab, matchObj, patch) {
  let q = table(tab).update(rowToSnake(patch));
  for (const [k, v] of Object.entries(matchObj)) q = q.eq(camelToSnake(k), v);
  const { data, error } = await q.select().single();
  if (error) throw new Error(error.message);
  return rowToCamel(data);
}

export async function deleteRow(tab, keyField, keyValue) {
  const { error } = await table(tab).delete().eq(camelToSnake(keyField), keyValue);
  if (error) throw new Error(error.message);
}

-- Hola 스페인어 앱 — Supabase(Postgres) 스키마
-- Supabase 대시보드 > SQL Editor에서 이 파일 전체를 붙여넣고 실행하세요.
-- 구글 시트에 있던 Profiles/Groups/Memberships/Posts/GeneratedVocab 탭을 그대로 테이블로 옮긴 구조예요.

create table if not exists profiles (
  user_id text primary key,
  email text,
  nickname text default '',
  bio text default '',
  points integer not null default 0,
  streak integer not null default 0,
  total_minutes integer not null default 0,
  completed_chapters text[] not null default '{}',
  current_chapter_id text,
  badges text[] not null default '{}',
  last_study_date text default '',
  daily_vocab_date text default '',
  daily_vocab_words text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists groups (
  group_id text primary key,
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists memberships (
  group_id text not null references groups (group_id) on delete cascade,
  user_id text not null,
  joined_at timestamptz not null default now(),
  cheers integer not null default 0,
  primary key (group_id, user_id)
);

create table if not exists posts (
  post_id text primary key,
  group_id text not null references groups (group_id) on delete cascade,
  user_id text not null,
  nickname text default '익명',
  chapter_id text default '',
  chapter_title text default '',
  text text not null,
  score integer default 0,
  feedback jsonb not null default '[]',
  reactions jsonb not null default '{"❤️": 0, "👏": 0, "🔥": 0}',
  comments jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists generated_vocab (
  id text primary key,
  es text not null,
  kr text not null,
  example text default '',
  example_kr text default '',
  level text default '',
  topic text default '',
  created_at timestamptz not null default now()
);

create index if not exists memberships_user_id_idx on memberships (user_id);
create index if not exists posts_group_id_idx on posts (group_id);

-- 이 앱은 서버 라우트에서 서비스 역할 키(service_role key)로만 접근하고,
-- 브라우저에서 직접 테이블에 접근하지 않으므로 RLS는 기본값(비활성) 그대로 둡니다.

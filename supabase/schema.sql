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
  ai_usage_count integer not null default 0,
  ai_unlimited boolean not null default false,
  level_test_done boolean not null default false,
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

-- group_id는 실제 그룹의 group_id이거나, 그룹에 가입하지 않은 사용자의 개인 게시판을 나타내는
-- "solo:{userId}" 문자열일 수 있어서(둘 다 허용) groups 테이블을 참조하는 외래 키를 걸지 않아요.
create table if not exists posts (
  post_id text primary key,
  group_id text not null,
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

create table if not exists vocab_progress (
  user_id text not null,
  word_key text not null,
  es text not null,
  kr text not null,
  box integer not null default 0,
  wrong_count integer not null default 0,
  last_wrong boolean not null default false,
  next_review_date text default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, word_key)
);

create index if not exists memberships_user_id_idx on memberships (user_id);
create index if not exists posts_group_id_idx on posts (group_id);
create index if not exists vocab_progress_user_id_idx on vocab_progress (user_id);

-- 이미 예전 스키마로 만들어진 프로젝트는 posts.group_id에 groups를 참조하는 외래 키가 남아있어서
-- "solo:{userId}" 개인 게시판 글을 못 넣어요. 안전하게 그 제약만 제거합니다(테이블/데이터는 그대로).
alter table posts drop constraint if exists posts_group_id_fkey;

-- 이미 만들어진 profiles 테이블에 AI 사용량 제한용 컬럼을 추가합니다(기존 프로젝트용, 데이터는 그대로 유지).
alter table profiles add column if not exists ai_usage_count integer not null default 0;
alter table profiles add column if not exists ai_unlimited boolean not null default false;

-- level_test_done은 딱 한 번, 컬럼이 아직 없을 때만 추가하면서 그 시점의 기존 사용자는 전부
-- "이미 레벨테스트를 마친 것"으로 채워요. 그래야 이미 학습 중이던 사용자가 다음 로그인 때
-- 갑자기 레벨테스트 화면으로 끌려가지 않아요. (이 블록은 한 번 실행되면 다시 실행돼도 아무 일도
-- 하지 않으므로, schema.sql을 나중에 다시 실행해도 새 가입자의 false 값을 건드리지 않아요.)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'level_test_done'
  ) then
    alter table profiles add column level_test_done boolean not null default false;
    update profiles set level_test_done = true;
  end if;
end $$;

-- 이 앱은 서버 라우트에서 서비스 역할 키(service_role key)로만 접근하고,
-- 브라우저에서 직접 테이블에 접근하지 않으므로 RLS는 기본값(비활성) 그대로 둡니다.

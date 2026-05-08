create extension if not exists pgcrypto;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#00e5ff',
  created_at timestamptz not null default now()
);

create table if not exists words (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  meaning text not null,
  example text not null default '',
  category_id uuid references categories(id) on delete set null,
  author_name text not null default 'Anonymous',
  mastery integer not null default 0 check (mastery between 0 and 5),
  created_at timestamptz not null default now()
);

create index if not exists words_category_idx on words(category_id);
create index if not exists words_created_idx on words(created_at desc);

create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id uuid references categories(id) on delete set null,
  host_name text not null,
  invite_code text not null unique,
  remind_message text not null default 'Ugee tseejleerei!',
  duration_days integer not null default 7,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists challenge_members (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  display_name text not null,
  joined_at timestamptz not null default now(),
  unique(challenge_id, display_name)
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  password_hash text not null,
  avatar text,
  bio text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_xp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount integer not null,
  reason text not null,
  source_type text not null default 'manual',
  source_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists user_xp_ledger_user_idx on user_xp_ledger(user_id);
create unique index if not exists user_xp_ledger_source_unique_idx
  on user_xp_ledger(user_id, source_type, source_id)
  where source_id is not null;

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  score integer not null,
  correct_count integer not null,
  total_count integer not null,
  created_at timestamptz not null default now()
);

create index if not exists quiz_attempts_user_idx on quiz_attempts(user_id);
create index if not exists quiz_attempts_category_idx on quiz_attempts(category_id);

create table if not exists duel_challenges (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references users(id) on delete cascade,
  opponent_id uuid not null references users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  stake_xp integer not null,
  time_limit_seconds integer not null default 30,
  words jsonb not null default '[]'::jsonb,
  challenger_answers jsonb,
  opponent_answers jsonb,
  challenger_score integer,
  opponent_score integer,
  winner_id uuid references users(id) on delete set null,
  status text not null default 'pending',
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists duel_challenges_challenger_idx on duel_challenges(challenger_id);
create index if not exists duel_challenges_opponent_idx on duel_challenges(opponent_id);
create index if not exists duel_challenges_status_idx on duel_challenges(status);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  member_name text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null unique,
  daily_goal integer not null default 10 check (daily_goal between 1 and 200),
  favorite_category_id uuid references categories(id) on delete set null,
  notifications_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_app_state (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  state_key TEXT NOT NULL,
  state_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, state_key)
);

CREATE INDEX IF NOT EXISTS user_app_state_user_idx ON user_app_state(user_id);

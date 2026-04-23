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
  created_at timestamptz not null default now()
);

create table if not exists challenge_members (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  display_name text not null,
  joined_at timestamptz not null default now(),
  unique(challenge_id, display_name)
);

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

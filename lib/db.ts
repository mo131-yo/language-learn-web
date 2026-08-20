import { neon } from "@neondatabase/serverless";

type NeonQueryFn = ReturnType<typeof neon>;

let sqlClient: NeonQueryFn | null = null;
let schemaPromise: Promise<void> | null = null;

const schemaStatements = [
  "CREATE EXTENSION IF NOT EXISTS pgcrypto",

  // Нууц үг plain text биш, зөвхөн password_hash хэлбэрээр хадгална.
  `CREATE TABLE IF NOT EXISTS users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT        NOT NULL,
    email         TEXT,
    password_hash TEXT        NOT NULL,
    avatar        TEXT,
    bio           TEXT        NOT NULL DEFAULT '',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,

  // Хуучин schema дээр name UNIQUE байсан бол email register ашиглахад саад болох тул устгана
  `DO $$
  BEGIN
    IF EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'users_name_key'
    ) THEN
      ALTER TABLE users DROP CONSTRAINT users_name_key;
    END IF;
  END $$`,

  // Хуучин nullable/empty email-тэй record байж болох тул partial unique index ашиглана
  `CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique_idx
   ON users (LOWER(email))
   WHERE email IS NOT NULL`,

  `CREATE INDEX IF NOT EXISTS users_name_idx ON users(name)`,

  `CREATE TABLE IF NOT EXISTS categories (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT        NOT NULL UNIQUE,
    color      TEXT        NOT NULL DEFAULT '#00e5ff',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `ALTER TABLE categories ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#00e5ff'`,
  `ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,

  `CREATE TABLE IF NOT EXISTS words (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    term        TEXT        NOT NULL,
    meaning     TEXT        NOT NULL,
    example     TEXT        NOT NULL DEFAULT '',
    category_id UUID        REFERENCES categories(id) ON DELETE SET NULL,
    author_name TEXT        NOT NULL DEFAULT 'Anonymous',
    author_id   UUID        REFERENCES users(id) ON DELETE SET NULL,
    mastery     INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `ALTER TABLE words ADD COLUMN IF NOT EXISTS example TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE words ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL`,
  `ALTER TABLE words ADD COLUMN IF NOT EXISTS author_name TEXT NOT NULL DEFAULT 'Anonymous'`,
  `ALTER TABLE words ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES users(id) ON DELETE SET NULL`,
  `ALTER TABLE words ADD COLUMN IF NOT EXISTS mastery INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE words ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,

  `DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'words_mastery_check'
    ) THEN
      ALTER TABLE words
      ADD CONSTRAINT words_mastery_check CHECK (mastery BETWEEN 0 AND 5);
    END IF;
  END $$`,

  `CREATE INDEX IF NOT EXISTS words_category_idx ON words(category_id)`,
  `CREATE INDEX IF NOT EXISTS words_created_idx ON words(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS words_author_idx ON words(author_id)`,

  `CREATE TABLE IF NOT EXISTS challenges (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title          TEXT        NOT NULL,
    category_id    UUID        REFERENCES categories(id) ON DELETE SET NULL,
    host_name      TEXT        NOT NULL DEFAULT 'Anonymous',
    host_id        UUID        REFERENCES users(id) ON DELETE SET NULL,
    invite_code    TEXT,
    remind_message TEXT        NOT NULL DEFAULT 'Үгээ цээжлээрэй!',
    duration_days  INTEGER     NOT NULL DEFAULT 7,
    expires_at     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `ALTER TABLE challenges ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL`,
  `ALTER TABLE challenges ADD COLUMN IF NOT EXISTS host_name TEXT NOT NULL DEFAULT 'Anonymous'`,
  `ALTER TABLE challenges ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES users(id) ON DELETE SET NULL`,
  `ALTER TABLE challenges ADD COLUMN IF NOT EXISTS invite_code TEXT`,
  `ALTER TABLE challenges ADD COLUMN IF NOT EXISTS remind_message TEXT NOT NULL DEFAULT 'Үгээ цээжлээрэй!'`,
  `ALTER TABLE challenges ADD COLUMN IF NOT EXISTS duration_days INTEGER NOT NULL DEFAULT 7`,
  `ALTER TABLE challenges ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`,
  `ALTER TABLE challenges ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
  `UPDATE challenges
   SET duration_days = 7
   WHERE duration_days IS NULL`,
  `UPDATE challenges
   SET expires_at = created_at + make_interval(days => duration_days)
   WHERE expires_at IS NULL`,

  // invite_code null байж болох хуучин мөрүүдээс болоод unique constraint унахгүй байхаар partial unique index
  `CREATE UNIQUE INDEX IF NOT EXISTS challenges_invite_code_unique_idx
   ON challenges(invite_code)
   WHERE invite_code IS NOT NULL`,

  `CREATE INDEX IF NOT EXISTS challenges_category_idx ON challenges(category_id)`,
  `CREATE INDEX IF NOT EXISTS challenges_host_idx ON challenges(host_id)`,
  `CREATE INDEX IF NOT EXISTS challenges_created_idx ON challenges(created_at DESC)`,

  `CREATE TABLE IF NOT EXISTS challenge_members (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID        NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    display_name TEXT        NOT NULL,
    user_id      UUID        REFERENCES users(id) ON DELETE SET NULL,
    joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(challenge_id, display_name)
  )`,

  `ALTER TABLE challenge_members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL`,
  `ALTER TABLE challenge_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,

  `CREATE INDEX IF NOT EXISTS challenge_members_challenge_idx ON challenge_members(challenge_id)`,
  `CREATE INDEX IF NOT EXISTS challenge_members_user_idx ON challenge_members(user_id)`,

  `CREATE TABLE IF NOT EXISTS push_subscriptions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    member_name TEXT        NOT NULL,
    user_id     UUID        REFERENCES users(id) ON DELETE CASCADE,
    endpoint    TEXT        NOT NULL UNIQUE,
    p256dh      TEXT        NOT NULL,
    auth        TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE`,
  `ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
  `ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,

  `CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions(user_id)`,

  // Хэрэглэгч бүрийн mastery тусдаа хадгалах хүсэлтэй бол ашиглана.
  `CREATE TABLE IF NOT EXISTS user_word_mastery (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word_id     UUID        NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    mastery     INTEGER     NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, word_id)
  )`,

  `ALTER TABLE user_word_mastery ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,

  `DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'user_word_mastery_mastery_check'
    ) THEN
      ALTER TABLE user_word_mastery
      ADD CONSTRAINT user_word_mastery_mastery_check CHECK (mastery BETWEEN 0 AND 5);
    END IF;
  END $$`,

  `CREATE INDEX IF NOT EXISTS user_word_mastery_user_idx ON user_word_mastery(user_id)`,
  `CREATE INDEX IF NOT EXISTS user_word_mastery_word_idx ON user_word_mastery(word_id)`,

  // Үг цээжилснээс гадна 1v1 бооцоот сорилтын XP нэмэх/хасах бүртгэл.
  `CREATE TABLE IF NOT EXISTS user_xp_ledger (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount      INTEGER     NOT NULL,
    reason      TEXT        NOT NULL,
    source_type TEXT        NOT NULL DEFAULT 'manual',
    source_id   UUID,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS user_xp_ledger_user_idx ON user_xp_ledger(user_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS user_xp_ledger_source_unique_idx
   ON user_xp_ledger(user_id, source_type, source_id)
   WHERE source_id IS NOT NULL`,

  // Шалгалтын оноо, сонгосон төрөл, дундаж хувийн leaderboard-д хэрэглэнэ.
  `CREATE TABLE IF NOT EXISTS quiz_attempts (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id   UUID        REFERENCES categories(id) ON DELETE SET NULL,
    score         INTEGER     NOT NULL,
    correct_count INTEGER     NOT NULL,
    total_count   INTEGER     NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS quiz_attempts_user_idx ON quiz_attempts(user_id)`,
  `CREATE INDEX IF NOT EXISTS quiz_attempts_category_idx ON quiz_attempts(category_id)`,

  // Найз эсвэл бусад хэрэглэгчтэй XP бооцоотой хурдан үгийн сорилт.
  `CREATE TABLE IF NOT EXISTS duel_challenges (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    challenger_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opponent_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id          UUID        REFERENCES categories(id) ON DELETE SET NULL,
    stake_xp             INTEGER     NOT NULL,
    time_limit_seconds   INTEGER     NOT NULL DEFAULT 30,
    words                JSONB       NOT NULL DEFAULT '[]'::jsonb,
    challenger_answers   JSONB,
    opponent_answers     JSONB,
    challenger_score     INTEGER,
    opponent_score       INTEGER,
    winner_id            UUID        REFERENCES users(id) ON DELETE SET NULL,
    status               TEXT        NOT NULL DEFAULT 'pending',
    settled_at           TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `ALTER TABLE duel_challenges ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL`,
  `ALTER TABLE duel_challenges ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER NOT NULL DEFAULT 30`,
  `ALTER TABLE duel_challenges ADD COLUMN IF NOT EXISTS words JSONB NOT NULL DEFAULT '[]'::jsonb`,
  `ALTER TABLE duel_challenges ADD COLUMN IF NOT EXISTS challenger_answers JSONB`,
  `ALTER TABLE duel_challenges ADD COLUMN IF NOT EXISTS opponent_answers JSONB`,
  `ALTER TABLE duel_challenges ADD COLUMN IF NOT EXISTS challenger_score INTEGER`,
  `ALTER TABLE duel_challenges ADD COLUMN IF NOT EXISTS opponent_score INTEGER`,
  `ALTER TABLE duel_challenges ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES users(id) ON DELETE SET NULL`,
  `ALTER TABLE duel_challenges ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'`,
  `ALTER TABLE duel_challenges ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ`,
  `ALTER TABLE duel_challenges ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
  `ALTER TABLE duel_challenges ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,

  `CREATE INDEX IF NOT EXISTS duel_challenges_challenger_idx ON duel_challenges(challenger_id)`,
  `CREATE INDEX IF NOT EXISTS duel_challenges_opponent_idx ON duel_challenges(opponent_id)`,
  `CREATE INDEX IF NOT EXISTS duel_challenges_status_idx ON duel_challenges(status)`,

  // Browser дээр үлддэг reader/social/theme/XP-spend state-ийг user-аар DB-д хадгална.
  `CREATE TABLE IF NOT EXISTS user_app_state (
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    state_key  TEXT        NOT NULL,
    state_value JSONB      NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, state_key)
  )`,

  `ALTER TABLE user_app_state ADD COLUMN IF NOT EXISTS state_value JSONB NOT NULL DEFAULT '{}'::jsonb`,
  `ALTER TABLE user_app_state ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
  `CREATE INDEX IF NOT EXISTS user_app_state_user_idx ON user_app_state(user_id)`,

  // Хуучин code profileSchema ашиглаж байсан бол эвдрэхгүй байлгахын тулд үлдээв.
  // Гол profile мэдээлэл одоо users table дээр хадгалагдана.
  `CREATE TABLE IF NOT EXISTS profiles (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name          TEXT        NOT NULL UNIQUE,
    daily_goal            INTEGER     NOT NULL DEFAULT 10,
    favorite_category_id  UUID        REFERENCES categories(id) ON DELETE SET NULL,
    notifications_enabled BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'profiles_daily_goal_check'
    ) THEN
      ALTER TABLE profiles
      ADD CONSTRAINT profiles_daily_goal_check CHECK (daily_goal BETWEEN 1 AND 200);
    END IF;
  END $$`,
];

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing.");
  }

  sqlClient ??= neon(process.env.DATABASE_URL);

  return sqlClient;
}

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const db = getPool();

      for (const stmt of schemaStatements) {
        await db.query(stmt);
      }
    })();
  }

  await schemaPromise;
}

export async function query<T>(text: string, params: unknown[] = []) {
  await ensureSchema();

  const result = await getPool().query(text, params);
  return result as T[];
}

export async function queryOne<T>(text: string, params: unknown[] = []) {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

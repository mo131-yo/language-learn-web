// // import webpush from "web-push";

// // export function configurePush() {
// //   const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
// //   const privateKey = process.env.  ;
// //   const subject = process.env.VAPID_SUBJECT ?? "mailto:hello@example.com";

// //   if (!publicKey || !privateKey) {
// //     return false;
// //   }

// //   webpush.setVapidDetails(subject, publicKey, privateKey);
// //   return true;
// // }



// import { neon } from "@neondatabase/serverless";

// const sql = neon(process.env.DATABASE_URL!);

// export async function ensureTable() {
//   await sql`
//     CREATE TABLE IF NOT EXISTS word_cache (
//       id          SERIAL PRIMARY KEY,
//       cache_key   TEXT UNIQUE NOT NULL,
//       data        JSONB NOT NULL,
//       created_at  TIMESTAMPTZ DEFAULT NOW()
//     )
//   `;
// }

// export async function getFromCache(cacheKey: string): Promise<WordData | null> {
//   const rows = await sql`
//     SELECT data FROM word_cache WHERE cache_key = ${cacheKey} LIMIT 1
//   `;
//   if (rows.length === 0) return null;
//   return rows[0].data as WordData;
// }

// export async function saveToCache(cacheKey: string, data: WordData): Promise<void> {
//   await sql`
//     INSERT INTO word_cache (cache_key, data)
//     VALUES (${cacheKey}, ${JSON.stringify(data)})
//     ON CONFLICT (cache_key) DO NOTHING
//   `;
// }

// export type WordData = {
//   word: string;
//   base_form?: string;
//   pronunciation?: string;
//   word_type: string;
//   difficulty: string;

//   is_inflected: boolean;
//   inflection?: {
//     form: string;     
//     base_word: string;   
//     rule_en: string;      
//     rule_mn: string;     
//     explanation_mn: string;
//   };

//   primary_translation: string;
//   all_translations: Array<{
//     mongolian: string;
//     english_sense: string;
//     usage_context: string;
//   }>;

//   simple_english_meaning: string;
//   mongolian_explanation: string;

//   phrases: Array<{
//     phrase: string;
//     translation: string;
//     example_en: string;
//     example_mn: string;
//   }>;

//   example_sentence_en: string;
//   example_sentence_mn: string;
// };





import webpush from "web-push";
import { neon } from "@neondatabase/serverless";

// ─── VAPID / Web Push ───────────────────────────────────────────────────────

export function configurePush(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hello@example.com";

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

// ─── Neon DB ─────────────────────────────────────────────────────────────────

const sql = neon(process.env.DATABASE_URL!);

export async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS word_cache (
      id          SERIAL PRIMARY KEY,
      cache_key   TEXT UNIQUE NOT NULL,
      data        JSONB NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function getFromCache(cacheKey: string): Promise<WordData | null> {
  const rows = await sql`
    SELECT data FROM word_cache WHERE cache_key = ${cacheKey} LIMIT 1
  `;
  if (rows.length === 0) return null;
  return rows[0].data as WordData;
}

export async function saveToCache(cacheKey: string, data: WordData): Promise<void> {
  await sql`
    INSERT INTO word_cache (cache_key, data)
    VALUES (${cacheKey}, ${JSON.stringify(data)})
    ON CONFLICT (cache_key) DO NOTHING
  `;
}

export type WordData = {
  word: string;
  base_form?: string;
  pronunciation?: string;
  word_type: string;
  difficulty: string;

  is_inflected: boolean;
  inflection?: {
    form: string;
    base_word: string;
    rule_en: string;
    rule_mn: string;
    explanation_mn: string;
  };

  primary_translation: string;
  all_translations: Array<{
    mongolian: string;
    english_sense: string;
    usage_context: string;
  }>;

  simple_english_meaning: string;
  mongolian_explanation: string;

  phrases: Array<{
    phrase: string;
    translation: string;
    example_en: string;
    example_mn: string;
  }>;

  example_sentence_en: string;
  example_sentence_mn: string;
};
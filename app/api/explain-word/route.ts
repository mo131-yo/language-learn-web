import OpenAI from "openai";
import { NextResponse } from "next/server";
import { ensureTable, getFromCache, WordData, saveToCache } from "@/lib/push";
import { getSessionUser } from "@/lib/auth-helpers";
import { queryOne } from "@/lib/db";
import { broadcast } from "@/lib/sse-store";
import type { Category, Word } from "@/lib/types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

function normalizeBookCategoryName(bookTitle: unknown) {
  const title = typeof bookTitle === "string" ? bookTitle.trim() : "";
  if (!title) return null;
  return title.slice(0, 80);
}

async function saveBookWordToPublicVocab(options: {
  bookTitle: unknown;
  data: WordData;
  sentence: unknown;
}) {
  const categoryName = normalizeBookCategoryName(options.bookTitle);

  if (!categoryName) return null;

  const sessionUser = await getSessionUser();
  const category = await queryOne<Category>(
    `insert into categories (name, color)
     values ($1, '#22c55e')
     on conflict (name) do update set name = excluded.name
     returning *`,
    [categoryName]
  );

  if (!category) return null;

  const term = (options.data.base_form || options.data.word).trim();
  const meaning = options.data.primary_translation.trim();
  const example =
    typeof options.sentence === "string"
      ? options.sentence.trim().slice(0, 500)
      : options.data.example_sentence_en?.slice(0, 500) ?? "";

  const word = await queryOne<Word>(
    `with inserted as (
       insert into words (term, meaning, example, category_id, author_name, author_id)
       select $1, $2, $3, $4, $5, $6
       where not exists (
         select 1
         from words
         where category_id = $4 and lower(term) = lower($1)
       )
       returning *
     )
     select inserted.*, c.name as category_name, c.color as category_color
     from inserted
     left join categories c on c.id = inserted.category_id`,
    [
      term,
      meaning,
      example,
      category.id,
      sessionUser?.name ?? "Book reader",
      sessionUser?.userId ?? null,
    ]
  );

  if (word) {
    broadcast("word-added", word);
  }

  return { category, word };
}

export async function POST(req: Request) {
  try {
    const { word, sentence, bookTitle } = await req.json();

    if (!word || typeof word !== "string") {
      return NextResponse.json({ error: "word is required" }, { status: 400 });
    }

    const sentenceSnippet = (sentence || "").slice(0, 80).toLowerCase().replace(/\s+/g, " ").trim();
    const cacheKey = `${word.toLowerCase()}::${sentenceSnippet}`;

    await ensureTable();

    const cached = await getFromCache(cacheKey);
    if (cached) {
      const saved = await saveBookWordToPublicVocab({ bookTitle, data: cached, sentence });
      return NextResponse.json({ ...cached, from_cache: true, savedWord: saved?.word ?? null, category: saved?.category ?? null });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert English vocabulary tutor for Mongolian learners.
Return ONLY valid JSON with no markdown, no backticks, no extra text.
Analyze the word carefully in context. Detect grammatical forms (past tense, past participle, plural, comparative, etc).
Be precise about irregular forms.`,
        },
        {
          role: "user",
          content: `Word: "${word}"
Sentence context: "${sentence || ""}"

Return this exact JSON structure:
{
  "word": "${word}",
  "base_form": "base/dictionary form of the word (e.g. 'teach' for 'taught'). Same as word if not inflected.",
  "pronunciation": "IPA pronunciation of '${word}'",
  "word_type": "noun | verb | adjective | adverb | preposition | conjunction | pronoun | interjection",
  "difficulty": "easy | medium | hard",

  "is_inflected": true or false,
  "inflection": {
    "form": "e.g. Past Tense, Past Participle, Plural, Comparative, Superlative, 3rd Person Singular, Present Participle, Gerund — or null if not inflected",
    "base_word": "base form e.g. teach",
    "rule_en": "Concise English grammar rule, e.g. 'Irregular verb: teach → taught (past) → taught (past participle)'",
    "rule_mn": "Same rule in Mongolian, e.g. 'Дүрэм бус үйл үг: teach → taught (өнгөрсөн цаг) → taught (Past Participle)'",
    "explanation_mn": "2-3 sentence Mongolian explanation like: 'Taught нь teach (заах, багшлах) үйл үгийн өнгөрсөн цаг болон Past Participle хэлбэр юм. Энэ нь дүрэм бус үйл үг тул -ed залгавар авдаггүй.'"
  },

  "primary_translation": "Best Mongolian translation for THIS sentence context",
  "all_translations": [
    {
      "mongolian": "заах",
      "english_sense": "to instruct or educate",
      "usage_context": "when talking about education or passing knowledge"
    }
    // include 2-4 most common translations with their contexts
  ],

  "simple_english_meaning": "One clear sentence explaining the word's meaning in this context",
  "mongolian_explanation": "1-2 sentences in easy Mongolian explaining the word meaning in this sentence",

  "phrases": [
    {
      "phrase": "e.g. 'teach a lesson' or 'taught by experience'",
      "translation": "Mongolian translation of the phrase",
      "example_en": "Short English example sentence",
      "example_mn": "Mongolian translation"
    }
    // include 2-3 common phrases/collocations with this word or its base form
  ],

  "example_sentence_en": "A simple English example sentence using '${word}' in a similar way to the context",
  "example_sentence_mn": "Mongolian translation of the example sentence"
}

IMPORTANT: If the word is NOT inflected (is_inflected: false), still include the "inflection" key but set all its string values to null and omit explanation.`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";

    let data: WordData;
    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "AI response was not valid JSON", raw },
        { status: 500 }
      );
    }

    await saveToCache(cacheKey, data);
    const saved = await saveBookWordToPublicVocab({ bookTitle, data, sentence });

    return NextResponse.json({ ...data, savedWord: saved?.word ?? null, category: saved?.category ?? null });
  } catch (error) {
    console.error("Explain word API error:", error);
    return NextResponse.json({ error: "Failed to explain word" }, { status: 500 });
  }
}

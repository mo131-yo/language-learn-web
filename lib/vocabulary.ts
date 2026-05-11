import type { WordData } from "@/lib/push";

export type ReaderVocabStatus = "learning" | "memorized";

export type ReaderVocabularyEntry = {
  id: string;
  key: string;
  word: string;
  meaning: string;
  translation: string;
  example: string;
  sourceBookId?: string;
  sourceBookTitle?: string;
  status: ReaderVocabStatus;
  isSaved: boolean;
  explainedByAI: boolean;
  createdAt: number;
  updatedAt: number;
  lastExplainedAt?: number;
  explainCount?: number;
};

export type ExplainedWordEntry = {
  id: string;
  key: string;
  word: string;
  meaning: string;
  translation: string;
  example: string;
  sourceBookId?: string;
  sourceBookTitle?: string;
  explainedByAI: true;
  isSaved: boolean;
  createdAt: number;
  updatedAt: number;
  lastExplainedAt: number;
  explainCount: number;
};

export type LegacySavedWord = {
  key: string;
  word: string;
  translation: string;
  mastered: boolean;
  addedAt: number;
};

type VocabularySource = {
  sourceBookId?: string;
  sourceBookTitle?: string;
};

function normalizeKey(word: string) {
  return word.trim().toLowerCase();
}

function makeId(prefix: string, key: string) {
  return `${prefix}-${key.replace(/[^a-z0-9]+/gi, "-") || "word"}`;
}

export function getWordMeaning(data: WordData) {
  return (
    data.mongolian_explanation ||
    data.simple_english_meaning ||
    data.primary_translation ||
    ""
  ).trim();
}

export function getWordExample(data: WordData) {
  return (data.example_sentence_en || "").trim();
}

export function normalizeReaderVocabulary(value: unknown): ReaderVocabularyEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): ReaderVocabularyEntry | null => {
      if (!item || typeof item !== "object") return null;

      const raw = item as Partial<ReaderVocabularyEntry & LegacySavedWord>;
      const wordText = typeof raw.word === "string" ? raw.word.trim() : "";
      const key = typeof raw.key === "string" ? raw.key : normalizeKey(wordText);

      if (!wordText || !key) return null;

      const addedAt =
        typeof raw.addedAt === "number"
          ? raw.addedAt
          : typeof raw.createdAt === "number"
            ? raw.createdAt
            : Date.now();
      const status: ReaderVocabStatus =
        raw.status === "memorized" || raw.mastered ? "memorized" : "learning";
      const translation =
        typeof raw.translation === "string" ? raw.translation : "";

      return {
        id: typeof raw.id === "string" ? raw.id : makeId("reader", key),
        key,
        word: wordText,
        meaning: typeof raw.meaning === "string" ? raw.meaning : translation,
        translation,
        example: typeof raw.example === "string" ? raw.example : "",
        sourceBookId:
          typeof raw.sourceBookId === "string" ? raw.sourceBookId : undefined,
        sourceBookTitle:
          typeof raw.sourceBookTitle === "string" ? raw.sourceBookTitle : undefined,
        status,
        isSaved: typeof raw.isSaved === "boolean" ? raw.isSaved : true,
        explainedByAI:
          typeof raw.explainedByAI === "boolean" ? raw.explainedByAI : true,
        createdAt: addedAt,
        updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : addedAt,
        lastExplainedAt:
          typeof raw.lastExplainedAt === "number" ? raw.lastExplainedAt : undefined,
        explainCount:
          typeof raw.explainCount === "number" ? raw.explainCount : undefined,
      };
    })
    .filter((item): item is ReaderVocabularyEntry => item !== null);
}

export function normalizeExplainedWords(value: unknown): ExplainedWordEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): ExplainedWordEntry | null => {
      if (!item || typeof item !== "object") return null;

      const raw = item as Partial<ExplainedWordEntry>;
      const wordText = typeof raw.word === "string" ? raw.word.trim() : "";
      const key = typeof raw.key === "string" ? raw.key : normalizeKey(wordText);

      if (!wordText || !key) return null;

      const now = Date.now();
      const createdAt = typeof raw.createdAt === "number" ? raw.createdAt : now;
      const lastExplainedAt =
        typeof raw.lastExplainedAt === "number" ? raw.lastExplainedAt : createdAt;

      return {
        id: typeof raw.id === "string" ? raw.id : makeId("ai", key),
        key,
        word: wordText,
        meaning: typeof raw.meaning === "string" ? raw.meaning : "",
        translation: typeof raw.translation === "string" ? raw.translation : "",
        example: typeof raw.example === "string" ? raw.example : "",
        sourceBookId:
          typeof raw.sourceBookId === "string" ? raw.sourceBookId : undefined,
        sourceBookTitle:
          typeof raw.sourceBookTitle === "string" ? raw.sourceBookTitle : undefined,
        explainedByAI: true,
        isSaved: Boolean(raw.isSaved),
        createdAt,
        updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : lastExplainedAt,
        lastExplainedAt,
        explainCount:
          typeof raw.explainCount === "number" && raw.explainCount > 0
            ? raw.explainCount
            : 1,
      };
    })
    .filter((item): item is ExplainedWordEntry => item !== null);
}

export function createReaderVocabularyEntry(
  data: WordData,
  source: VocabularySource = {},
  savedAt = Date.now()
): ReaderVocabularyEntry | null {
  const wordText = typeof data.word === "string" ? data.word.trim() : "";
  const key = normalizeKey(wordText);

  if (!wordText || !key) return null;

  const translation =
    typeof data.primary_translation === "string" ? data.primary_translation : "";

  return {
    id: makeId("reader", key),
    key,
    word: wordText,
    meaning: getWordMeaning(data),
    translation,
    example: getWordExample(data),
    sourceBookId: source.sourceBookId,
    sourceBookTitle: source.sourceBookTitle,
    status: "learning",
    isSaved: true,
    explainedByAI: true,
    createdAt: savedAt,
    updatedAt: savedAt,
    lastExplainedAt: savedAt,
    explainCount: 1,
  };
}

export function upsertReaderVocabulary(
  current: ReaderVocabularyEntry[],
  data: WordData,
  source: VocabularySource = {}
) {
  const nextEntry = createReaderVocabularyEntry(data, source);
  if (!nextEntry) return current;

  const existing = current.find((item) => item.key === nextEntry.key);
  if (!existing) return [nextEntry, ...current];

  return current.map((item) =>
    item.key === nextEntry.key
      ? {
          ...item,
          meaning: item.meaning || nextEntry.meaning,
          translation: item.translation || nextEntry.translation,
          example: item.example || nextEntry.example,
          sourceBookId: item.sourceBookId ?? nextEntry.sourceBookId,
          sourceBookTitle: item.sourceBookTitle ?? nextEntry.sourceBookTitle,
          isSaved: true,
          explainedByAI: true,
          updatedAt: Date.now(),
        }
      : item
  );
}

export function upsertExplainedWord(
  current: ExplainedWordEntry[],
  data: WordData,
  source: VocabularySource = {}
): ExplainedWordEntry[] {
  const wordText = typeof data.word === "string" ? data.word.trim() : "";
  const key = normalizeKey(wordText);
  if (!wordText || !key) return current;

  const now = Date.now();
  const existing = current.find((item) => item.key === key);

  if (existing) {
    return current.map((item) =>
      item.key === key
        ? {
            ...item,
            meaning: getWordMeaning(data) || item.meaning,
            translation:
              (typeof data.primary_translation === "string"
                ? data.primary_translation
                : "") || item.translation,
            example: getWordExample(data) || item.example,
            sourceBookId: item.sourceBookId ?? source.sourceBookId,
            sourceBookTitle: item.sourceBookTitle ?? source.sourceBookTitle,
            explainedByAI: true,
            updatedAt: now,
            lastExplainedAt: now,
            explainCount: item.explainCount + 1,
          }
        : item
    );
  }

  return [
    {
      id: makeId("ai", key),
      key,
      word: wordText,
      meaning: getWordMeaning(data),
      translation:
        typeof data.primary_translation === "string" ? data.primary_translation : "",
      example: getWordExample(data),
      sourceBookId: source.sourceBookId,
      sourceBookTitle: source.sourceBookTitle,
      explainedByAI: true,
      isSaved: false,
      createdAt: now,
      updatedAt: now,
      lastExplainedAt: now,
      explainCount: 1,
    },
    ...current,
  ];
}

export function markExplainedWordSaved(
  current: ExplainedWordEntry[],
  key: string
) {
  return current.map((item) =>
    item.key === key ? { ...item, isSaved: true, updatedAt: Date.now() } : item
  );
}

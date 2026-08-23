"use client";

import { extractBookCover, parseBookFile } from "@/lib/parseBook";
import { WordData } from "@/lib/push";
import {
  markExplainedWordSaved,
  normalizeExplainedWords,
  normalizeReaderVocabulary,
  type ExplainedWordEntry,
  type ReaderVocabularyEntry,
  upsertExplainedWord,
  upsertReaderVocabulary,
} from "@/lib/vocabulary";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Headphones,
  Library,
  Minus,
  Plus,
  Settings,
  Type,
  UserRound,
} from "lucide-react";
import type {
  ChangeEvent,
  CSSProperties,
  ReactNode,
} from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, Word } from "@/lib/types";

function splitText(text: string) {
  return text.split(/(\s+|[.,!?;:"""''()[\]—\-]+)/g).filter(Boolean);
}

function getCleanBookTitle(title: string) {
  return (
    title
      .replace(/\.(txt|pdf|epub|docx)$/i, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Imported Book"
  );
}

function cleanReaderText(text: string) {
  const normalized = text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]*-\n[ \t]*/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/([a-z])\s+([,.;:!?])/gi, "$1$2")
    .replace(/([“"'])\s+/g, "$1")
    .replace(/\s+([”"'])/g, "$1")
    .replace(/[^\S\n]+/g, " ");

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return true;
      if (/^\d{1,4}$/.test(line)) return false;
      if (/^page\s+\d+(\s+of\s+\d+)?$/i.test(line)) return false;
      return true;
    });

  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/([^\n.!?”"]) \n(?=[a-z])/g, "$1 ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function textToParagraphs(text: string) {
  const cleaned = cleanReaderText(text);

  if (!cleaned) return [];

  const blocks = cleaned
    .split(/\n{2,}/)
    .map((block) => block.replace(/\n+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (blocks.length > 1) return blocks;

  const sentences =
    cleaned.replace(/\n+/g, " ").match(/[^.!?]+[.!?”"]+|[^.!?]+$/g) ?? [];

  return sentences
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .reduce<string[]>((paragraphs, sentence) => {
      const current = paragraphs[paragraphs.length - 1] ?? "";

      if (!current || current.split(/\s+/).length > 90) {
        paragraphs.push(sentence.trim());
      } else {
        paragraphs[paragraphs.length - 1] = `${current} ${sentence.trim()}`;
      }

      return paragraphs;
    }, [])
    .filter(Boolean);
}

function cleanWord(word: string) {
  return word.replace(/[^a-zA-Z']/g, "").trim();
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "type" in error) {
    return "Үгийн тайлбар ачаалах үед алдаа гарлаа.";
  }
  return "AI тайлбар авахад алдаа гарлаа.";
}

function getSentenceAroundWord(fullText: string, word: string) {
  const sentences = fullText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  const lowerWord = word.toLowerCase();

  return (
    sentences.find((sentence) => sentence.toLowerCase().includes(lowerWord)) ||
    ""
  ).trim();
}

const WORDS_PER_PAGE = 220;

type ReaderParagraph = {
  id: string;
  tokens: string[];
};

type WordDataExtras = WordData & {
  mnemonic?: string;
  memory_tip?: string;
  memory_trick?: string;
  similar_words?: string[];
  similarWords?: string[];
};

function paginateParagraphs(paragraphs: string[]): ReaderParagraph[][] {
  const pages: ReaderParagraph[][] = [];
  let page: ReaderParagraph[] = [];
  let wordCount = 0;

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const tokens = splitText(paragraph);
    const paragraphWordCount = tokens.filter((token) =>
      /^[a-zA-Z']+$/.test(token)
    ).length;

    if (page.length && wordCount + paragraphWordCount > WORDS_PER_PAGE) {
      pages.push(page);
      page = [];
      wordCount = 0;
    }

    page.push({ id: `p-${paragraphIndex}`, tokens });
    wordCount += paragraphWordCount;

    if (wordCount >= WORDS_PER_PAGE) {
      pages.push(page);
      page = [];
      wordCount = 0;
    }
  });

  if (page.length) {
    pages.push(page);
  }

  return pages;
}

type BookChapter = {
  index: number;
  title: string;
  text: string;
};

type LoadedBook = {
  id: number;
  title: string;
  authors: string;
  cover: string | null;
  text: string;
  chapters?: BookChapter[];
};

type ImportedBookState = {
  id?: string;
  name: string;
  text: string;
  importedAt: number;
  coverUrl?: string | null;
  coverImage?: string | null;
};

type UserStateResponse = {
  state: Record<string, unknown> | null;
};

function isImportedBookState(value: unknown): value is ImportedBookState {
  if (!value || typeof value !== "object") return false;

  const book = value as Partial<ImportedBookState>;
  return (
    (typeof book.id === "string" || typeof book.id === "undefined") &&
    typeof book.name === "string" &&
    typeof book.text === "string" &&
    typeof book.importedAt === "number" &&
    Number.isFinite(book.importedAt)
  );
}

function getImportedBookList(value: unknown) {
  return Array.isArray(value) ? value.filter(isImportedBookState) : [];
}

type ReaderAuthUser = {
  id: string;
  name: string;
  email?: string;
  avatar: string | null;
  bio: string;
};

type ExplainWordResponse = WordData & {
  savedWord?: Word | null;
  category?: Category | null;
  from_cache?: boolean;
};

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  easy: { bg: "#d1fae5", text: "#065f46" },
  medium: { bg: "#fef3c7", text: "#92400e" },
  hard: { bg: "#fee2e2", text: "#991b1b" },
};

const FORM_LABELS: Record<string, string> = {
  "Past Tense": "Өнгөрсөн цаг",
  "Past Participle": "Past Participle",
  "Present Participle": "Present Participle",
  Gerund: "Герунд",
  "3rd Person Singular": "3-р биеийн нэгж тоо",
  Plural: "Олон тоо",
  Comparative: "Харьцуулах зэрэг",
  Superlative: "Давуу зэрэг",
};

type ReaderTheme = "paper" | "white" | "dark";

type ReaderPreferences = {
  fontSize: number;
  lineHeight: number;
  theme: ReaderTheme;
};

const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  fontSize: 19,
  lineHeight: 1.9,
  theme: "paper",
};

function readReaderPreferences(): ReaderPreferences {
  try {
    const raw = localStorage.getItem("reader-preferences");
    if (!raw) return DEFAULT_READER_PREFERENCES;

    const parsed = JSON.parse(raw) as Partial<ReaderPreferences>;
    return {
      fontSize:
        typeof parsed.fontSize === "number"
          ? Math.min(23, Math.max(16, parsed.fontSize))
          : DEFAULT_READER_PREFERENCES.fontSize,
      lineHeight:
        typeof parsed.lineHeight === "number"
          ? Math.min(2.2, Math.max(1.55, parsed.lineHeight))
          : DEFAULT_READER_PREFERENCES.lineHeight,
      theme:
        parsed.theme === "white" || parsed.theme === "dark" || parsed.theme === "paper"
          ? parsed.theme
          : DEFAULT_READER_PREFERENCES.theme,
    };
  } catch {
    return DEFAULT_READER_PREFERENCES;
  }
}

function ReaderToolbar({
  preferences,
  onPreferencesChange,
  open,
  onToggleOpen,
}: {
  preferences: ReaderPreferences;
  onPreferencesChange: (next: ReaderPreferences) => void;
  open: boolean;
  onToggleOpen: () => void;
}) {
  function updatePreference(next: Partial<ReaderPreferences>) {
    onPreferencesChange({ ...preferences, ...next });
  }

  return (
    <div className="reader-toolbar">
      <button
        className="reader-settings-button"
        onClick={onToggleOpen}
        aria-label="Reader settings"
        title="Reader settings"
      >
        <Settings size={20} strokeWidth={2.2} />
      </button>

      {open && (
        <div className="reader-settings-panel">
          <div className="settings-row">
            <span className="settings-label">
              <Type size={16} /> Font
            </span>

            <div className="settings-stepper">
              <button
                onClick={() =>
                  updatePreference({
                    fontSize: Math.max(16, preferences.fontSize - 1),
                  })
                }
                aria-label="Decrease font size"
                title="Decrease font size"
              >
                <Minus size={16} />
              </button>

              <span>{preferences.fontSize}px</span>

              <button
                onClick={() =>
                  updatePreference({
                    fontSize: Math.min(23, preferences.fontSize + 1),
                  })
                }
                aria-label="Increase font size"
                title="Increase font size"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="settings-row">
            <span className="settings-label">Theme</span>

            <div className="theme-segments">
              {(["paper", "white", "dark"] as ReaderTheme[]).map((theme) => (
                <button
                  key={theme}
                  className={preferences.theme === theme ? "active" : ""}
                  onClick={() => updatePreference({ theme })}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-row">
            <span className="settings-label">Line</span>

            <div className="theme-segments">
              {[1.7, 1.9, 2.1].map((lineHeight) => (
                <button
                  key={lineHeight}
                  className={
                    preferences.lineHeight === lineHeight ? "active" : ""
                  }
                  onClick={() => updatePreference({ lineHeight })}
                >
                  {lineHeight.toFixed(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReaderHeader({
  title,
  author,
  chapterTitle,
  chapterIndex,
  chapterCount,
  progress,
  totalSaved,
  chapters,
  onChapterChange,
  onOpenVocab,
  user,
}: {
  title: string;
  author: string;
  chapterTitle: string;
  chapterIndex: number;
  chapterCount: number;
  progress: number;
  totalSaved: number;
  chapters: BookChapter[];
  onChapterChange: (nextChapterIndex: number) => void;
  onOpenVocab: () => void;
  user: ReaderAuthUser;
}) {
  return (
    <header className="br-topbar">
      <div className="br-header-main">
        <Link href="/" className="br-icon-link" aria-label="Back to library">
          <ChevronLeft size={19} />
        </Link>

        <div className="br-book-meta">
          <div className="chapter-kicker">
            Chapter {chapterIndex + 1} / {Math.max(chapterCount, 1)}
          </div>
          <div className="br-title">{title}</div>
          <div className="br-author">{author}</div>
        </div>

        <div className="br-profile-pill" title={user.name}>
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt="" />
          ) : (
            <UserRound size={17} />
          )}
          <span>{totalSaved} words</span>
        </div>
      </div>

      <div className="br-progress-row">
        <span>{chapterTitle}</span>
        <div className="br-progress-bar" aria-hidden>
          <div className="br-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span>{Math.round(progress)}%</span>
      </div>

      <div className="br-action-row">
        {chapters.length > 1 && (
          <select
            className="chapter-select"
            value={chapterIndex}
            onChange={(e) => onChapterChange(Number(e.target.value))}
          >
            {chapters.map((chapter, index) => (
              <option key={chapter.index} value={index}>
                {chapter.title}
              </option>
            ))}
          </select>
        )}

        <Link className="br-vocab-btn" href="/?view=library">
          <Library size={15} />
          Номын сан
        </Link>

        <button className="br-vocab-btn" onClick={onOpenVocab}>
          Үгийн сан
          {totalSaved > 0 && <span className="br-vocab-count">{totalSaved}</span>}
        </button>
      </div>
    </header>
  );
}

function ReaderShell({
  children,
  preferences,
}: {
  children: ReactNode;
  preferences: ReaderPreferences;
}) {
  const readerStyle = {
    "--reader-font-size": `${preferences.fontSize}px`,
    "--reader-line-height": String(preferences.lineHeight),
  } as CSSProperties;

  return (
    <div
      className={`br-root br-theme-${preferences.theme}`}
      style={readerStyle}
    >
      <div className="br-content-shell">{children}</div>
    </div>
  );
}

export default function BookReader({
  bookId,
  onBookWordSaved,
  onAIWordExplained,
}: {
  bookId?: string;
  onBookWordSaved?: (payload: { word: Word; category?: Category | null }) => void;
  onAIWordExplained?: (entry: ExplainedWordEntry) => void;
}) {
  const [readerAuthUser, setReaderAuthUser] = useState<ReaderAuthUser | null>(null);
  const [readerAuthChecked, setReaderAuthChecked] = useState(false);
  const [bookText, setBookText] = useState("");
  const [book, setBook] = useState<LoadedBook | null>(null);
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [chapterIndex, setChapterIndex] = useState(0);

  const [selectedWord, setSelectedWord] = useState("");
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [importingBook, setImportingBook] = useState(false);
  const [apiError, setApiError] = useState("");
  const [highlightedWord, setHighlightedWord] = useState("");
  const [fromCache, setFromCache] = useState(false);
  const [popup, setPopup] = useState({ visible: false });
  const [selectionPopup, setSelectionPopup] = useState({
    visible: false,
    text: "",
    translation: "",
    loading: false,
    error: "",
  });
  const [preferences, setPreferences] = useState<ReaderPreferences>(
    DEFAULT_READER_PREFERENCES
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [pageIndex, setPageIndex] = useState(0);

  const [vocabOpen, setVocabOpen] = useState(false);
  const [savedWords, setSavedWords] = useState<ReaderVocabularyEntry[]>([]);
  const [explainedWords, setExplainedWords] = useState<ExplainedWordEntry[]>([]);
  const [toast, setToast] = useState("");
  const [readerStateLoaded, setReaderStateLoaded] = useState(false);

  const bodyRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const explainedWordsRef = useRef<ExplainedWordEntry[]>([]);
  const readerDisplayUser: ReaderAuthUser = readerAuthUser ?? {
    id: "guest",
    name: "Зочин",
    avatar: null,
    bio: "",
  };

  function scrollToTop(behavior: ScrollBehavior = "smooth") {
    requestAnimationFrame(() => {
      if (bodyRef.current) {
        bodyRef.current.scrollIntoView({
          behavior,
          block: "start",
        });
      }

      window.scrollTo({
        top: 0,
        behavior,
      });
    });
  }

  function closePopup() {
    setPopup({ visible: false });
    setSelectedWord("");
    setHighlightedWord("");
    setWordData(null);
    setApiError("");
    setLoading(false);
  }

  function closeSelectionPopup() {
    setSelectionPopup({ visible: false, text: "", translation: "", loading: false, error: "" });
  }

  async function translateSelection(text: string) {
    setSelectionPopup({ visible: true, text, translation: "", loading: true, error: "" });

    try {
      const res = await fetch("/api/translate-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error ?? "Орчуулга авч чадсангүй");
      }

      setSelectionPopup({
        visible: true,
        text,
        translation: data.translation ?? "",
        loading: false,
        error: "",
      });
    } catch (error) {
      setSelectionPopup({
        visible: true,
        text,
        translation: "",
        loading: false,
        error: getErrorMessage(error),
      });
    }
  }

  function splitImportedTextIntoOneChapter(text: string) {
    return [
      {
        index: 0,
        title: "Imported Chapter",
        text,
      },
    ];
  }

  function getVocabularySource() {
    return {
      sourceBookId: bookId ?? (book ? String(book.id) : undefined),
      sourceBookTitle: book?.title ?? chapters[chapterIndex]?.title ?? undefined,
    };
  }

  async function saveUserState(key: string, value: unknown) {
    await fetch("/api/user-state", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key, value }),
    }).catch(() => {
      // Local storage remains the fallback when logged out or offline.
    });
  }

  function applyImportedBook(saved: ImportedBookState) {
    if (!isImportedBookState(saved) || !saved.text.trim()) {
      setLoadError("Хадгалсан номын мэдээлэл дутуу байна.");
      return;
    }

    const importedChapters = splitImportedTextIntoOneChapter(saved.text);

    setBook({
      id: saved.importedAt,
      title: getCleanBookTitle(saved.name),
      authors: "Unknown author",
      cover: saved.coverUrl || saved.coverImage || null,
      text: saved.text,
      chapters: importedChapters,
    });

    setChapters(importedChapters);
    setChapterIndex(0);
    setBookText(importedChapters[0].text);
    setLoadError("");
    setPageIndex(0);
    closePopup();
    scrollToTop("auto");
  }

  function saveImportedBookToLibrary(importedBook: ImportedBookState) {
    const bookWithId = {
      ...importedBook,
      id: importedBook.id ?? `imported-${importedBook.importedAt}`,
    };

    try {
      const raw = localStorage.getItem("imported-books");
      const currentBooks = raw ? getImportedBookList(JSON.parse(raw)) : [];
      const nextBooks = [
        bookWithId,
        ...currentBooks.filter(
          (book) =>
            (book.id ?? `imported-${book.importedAt}`) !== bookWithId.id &&
            book.name !== bookWithId.name
        ),
      ];

      localStorage.setItem("imported-books", JSON.stringify(nextBooks));
      void saveUserState("imported-books", nextBooks);
    } catch {
      localStorage.setItem("imported-books", JSON.stringify([bookWithId]));
      void saveUserState("imported-books", [bookWithId]);
    }
  }

  async function handleBookUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setLoadError("");
    setImportingBook(true);

    try {
      const [text, coverUrl] = await Promise.all([
        parseBookFile(file),
        extractBookCover(file, file.name),
      ]);

      if (!text.trim()) {
        setLoadError("Файл хоосон байна.");
        return;
      }

      const importedAt = Date.now();
      const importedBook = {
        id: `imported-${importedAt}`,
        name: file.name,
        text,
        importedAt,
        coverUrl,
      };

      applyImportedBook(importedBook);
      saveImportedBookToLibrary(importedBook);

      localStorage.setItem(
        "last-imported-book",
        JSON.stringify(importedBook)
      );
      localStorage.setItem("selected-imported-book", JSON.stringify(importedBook));
      void saveUserState("last-imported-book", importedBook);
    } catch {
      setLoadError("Файл уншихад алдаа гарлаа. Өөр файл оруулна уу.");
    } finally {
      setImportingBook(false);
    }
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { user: ReaderAuthUser | null }) => {
        setReaderAuthUser(data.user ?? null);
      })
      .catch(() => setReaderAuthUser(null))
      .finally(() => setReaderAuthChecked(true));
  }, []);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    setPreferences(readReaderPreferences());
  }, []);

  useEffect(() => {
    localStorage.setItem("reader-preferences", JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    if (!bookId) return;

    async function loadBook() {
      try {
        setLoadError("");
        setBookText("");
        setBook(null);
        setChapters([]);
        setChapterIndex(0);
        setPageIndex(0);
        closePopup();

        const res = await fetch(`/api/books/${bookId}`);

        if (!res.ok) {
          throw new Error("Book not found");
        }

        const data = (await res.json()) as Partial<LoadedBook>;
        const safeText = typeof data.text === "string" ? data.text : "";
        const safeChapters = Array.isArray(data.chapters)
          ? data.chapters.filter(
              (chapter): chapter is BookChapter =>
                Boolean(chapter) &&
                typeof chapter.index === "number" &&
                typeof chapter.title === "string" &&
                typeof chapter.text === "string"
            )
          : [];

        const loadedChapters =
          safeChapters.length > 0
            ? safeChapters
            : [
                {
                  index: 0,
                  title: "Full Book",
                  text: safeText,
                },
              ];

        setBook({
          id: typeof data.id === "number" ? data.id : Number(bookId),
          title: typeof data.title === "string" ? data.title : "Untitled book",
          authors: typeof data.authors === "string" ? data.authors : "Unknown author",
          cover: typeof data.cover === "string" ? data.cover : null,
          text: safeText,
          chapters: loadedChapters,
        });
        setChapters(loadedChapters);
        setChapterIndex(0);
        setBookText(loadedChapters[0]?.text || safeText || "");
        setPageIndex(0);
        scrollToTop("auto");
      } catch {
        setLoadError("Ном ачаалж чадсангүй.");
      }
    }

    loadBook();
  }, [bookId]);

  useEffect(() => {
    if (bookId) return;

    try {
      const raw = localStorage.getItem("selected-imported-book");

      if (!raw) return;

      const selectedBook = JSON.parse(raw);

      if (!isImportedBookState(selectedBook)) {
        setLoadError("Сонгосон import номын мэдээлэл дутуу байна.");
        return;
      }

      applyImportedBook(selectedBook);
    } catch {
      setLoadError("Сонгосон import номыг уншиж чадсангүй.");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("reader-vocab");

      if (raw) {
        setSavedWords(normalizeReaderVocabulary(JSON.parse(raw)));
      }
    } catch {
    }

    if (!readerAuthUser) {
      setReaderStateLoaded(true);
      return;
    }

    fetch("/api/user-state")
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as UserStateResponse;
      })
      .then((data) => {
        const state = data?.state;

        if (!state) return;

        const readerVocab = normalizeReaderVocabulary(state["reader-vocab"]);

        if (readerVocab.length > 0 || Array.isArray(state["reader-vocab"])) {
          setSavedWords(readerVocab);
          localStorage.setItem(
            "reader-vocab",
            JSON.stringify(readerVocab)
          );
        }

        const aiExplainedWords = normalizeExplainedWords(state["ai-explained-words"]);

        if (
          aiExplainedWords.length > 0 ||
          Array.isArray(state["ai-explained-words"])
        ) {
          setExplainedWords(aiExplainedWords);
          localStorage.setItem(
            "ai-explained-words",
            JSON.stringify(aiExplainedWords)
          );
        }

        const importedBook = state["last-imported-book"];

        if (isImportedBookState(importedBook)) {
          localStorage.setItem(
            "last-imported-book",
            JSON.stringify(importedBook)
          );
        }
      })
      .catch(() => {
        // Logged-out users keep the local browser copy.
      })
      .finally(() => setReaderStateLoaded(true));
  }, [readerAuthUser]);

  useEffect(() => {
    localStorage.setItem("reader-vocab", JSON.stringify(savedWords));
    if (readerStateLoaded) {
      void saveUserState("reader-vocab", savedWords);
    }
  }, [readerStateLoaded, savedWords]);

  useEffect(() => {
    function handleSelectionMouseUp(event: MouseEvent) {
      const body = bodyRef.current;
      if (!body || !body.contains(event.target as Node)) return;

      const selection = window.getSelection();
      const text = selection?.toString().trim() ?? "";

      if (text.length > 1 && text.split(/\s+/).length > 1) {
        void translateSelection(text);
      }
    }

    document.addEventListener("mouseup", handleSelectionMouseUp);
    return () => document.removeEventListener("mouseup", handleSelectionMouseUp);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ai-explained-words");

      if (raw) {
        setExplainedWords(normalizeExplainedWords(JSON.parse(raw)));
      }
    } catch {
      // ignore malformed local history
    }
  }, []);

  useEffect(() => {
    explainedWordsRef.current = explainedWords;
    localStorage.setItem("ai-explained-words", JSON.stringify(explainedWords));
    if (readerStateLoaded) {
      void saveUserState("ai-explained-words", explainedWords);
    }
  }, [explainedWords, readerStateLoaded]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest("[data-word-btn]")
      ) {
        closePopup();
      }
    }

    if (popup.visible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popup.visible]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast("");
    }, 2200);

    return () => clearTimeout(timer);
  }, [toast]);

  const displayParagraphs = useMemo(() => textToParagraphs(bookText), [bookText]);
  const pages = useMemo(
    () => paginateParagraphs(displayParagraphs),
    [displayParagraphs]
  );
  const pageParagraphs = pages[pageIndex] ?? [];

  const masteredCount = savedWords.filter((word) => word.status === "memorized").length;
  const totalSaved = savedWords.length;

  async function explainWord(clickedWord: string) {
    setWordData(null);
    setApiError("");
    setLoading(true);
    setFromCache(false);

    const sentence = getSentenceAroundWord(bookText, clickedWord);

    try {
      const res = await fetch("/api/explain-word", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word: clickedWord,
          sentence,
          bookTitle: book?.title ?? chapters[chapterIndex]?.title ?? "Imported Book",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed");
      }

      const data = (await res.json()) as ExplainWordResponse;

      if (data.from_cache) {
        setFromCache(true);
      }

      setWordData(data);

      const source = getVocabularySource();
      const explainedKey = data.word.trim().toLowerCase();
      const nextExplainedWords = upsertExplainedWord(
        explainedWordsRef.current,
        data,
        source
      );
      const explainedEntry =
        nextExplainedWords.find((item) => item.key === explainedKey) ?? null;

      explainedWordsRef.current = nextExplainedWords;
      setExplainedWords(nextExplainedWords);

      if (explainedEntry) {
        onAIWordExplained?.(explainedEntry);
      }
    } catch (error) {
      console.error("Failed to explain word:", error);
      setApiError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleWordClick(rawWord: string) {
    const clickedWord = cleanWord(rawWord);

    if (!clickedWord) return;

    setHighlightedWord(clickedWord.toLowerCase());
    setSelectedWord(clickedWord);
    setPopup({ visible: true });

    await explainWord(clickedWord);
  }

  function saveWord(data: ExplainWordResponse) {
    if (typeof data.word !== "string" || !data.word.trim()) return;

    const key = data.word.trim().toLowerCase();
    const source = getVocabularySource();
    const alreadySaved = savedWords.some((word) => word.key === key);

    setSavedWords((prev) => {
      if (prev.some((word) => word.key === key)) {
        setToast(`"${data.word}" аль хэдийн нэмэгдсэн байна`);
        return prev;
      }

      setToast(`✓ "${data.word}" үгийн санд нэмэгдлээ`);

      return upsertReaderVocabulary(prev, data, source);
    });

    setExplainedWords((prev) => markExplainedWordSaved(prev, key));

    if (!alreadySaved && "savedWord" in data && data.savedWord) {
      onBookWordSaved?.({
        word: data.savedWord,
        category: "category" in data ? data.category ?? null : null,
      });
    }
  }

  function toggleMastered(key: string) {
    setSavedWords((prev) =>
      prev.map((word) =>
        word.key === key
          ? {
              ...word,
              status: word.status === "memorized" ? "learning" : "memorized",
              updatedAt: Date.now(),
            }
          : word
      )
    );
  }

  function removeWord(key: string) {
    setSavedWords((prev) => prev.filter((word) => word.key !== key));
  }

  function listenToWord(word: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setToast("Listen энэ browser дээр дэмжигдэхгүй байна");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.86;
    window.speechSynthesis.speak(utterance);
  }

  function goToChapter(nextChapterIndex: number) {
    const chapter = chapters[nextChapterIndex];

    if (!chapter) return;

    closePopup();
    setChapterIndex(nextChapterIndex);
    setBookText(chapter.text);
    setPageIndex(0);
    scrollToTop();
  }

  function goToNextChapter() {
    if (chapterIndex >= chapters.length - 1) return;

    goToChapter(chapterIndex + 1);
  }

  function goToPrevChapter() {
    if (chapterIndex <= 0) return;

    goToChapter(chapterIndex - 1);
  }

  function changePage(next: number) {
    closePopup();
    setPageIndex(next);
    scrollToTop();
  }

  const hasGrammar = wordData?.is_inflected && wordData.inflection?.form;
  const hasPhrases = (wordData?.phrases?.length ?? 0) > 0;
  const wordDataExtras = wordData as WordDataExtras | null;
  const memoryTip =
    wordDataExtras?.mnemonic ??
    wordDataExtras?.memory_tip ??
    wordDataExtras?.memory_trick ??
    "";
  const similarWords =
    wordDataExtras?.similar_words ?? wordDataExtras?.similarWords ?? [];
  const isWordSaved = wordData
    ? savedWords.some((word) => word.key === wordData.word.trim().toLowerCase())
    : false;
  const currentSavedWord = wordData
    ? savedWords.find((word) => word.key === wordData.word.trim().toLowerCase()) ?? null
    : null;

  const pageProgressInChapter =
    pages.length > 0 ? (pageIndex + 1) / pages.length : 0;

  const totalProgress =
    chapters.length > 0
      ? ((chapterIndex + pageProgressInChapter) / chapters.length) * 100
      : pages.length > 0
        ? ((pageIndex + 1) / pages.length) * 100
        : 0;

  const isFirstPage = pageIndex === 0 && chapterIndex === 0;
  const isLastPage =
    pageIndex >= pages.length - 1 && chapterIndex >= chapters.length - 1;

  if (!readerAuthChecked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f0e8",
          fontFamily: "DM Sans, sans-serif",
          fontWeight: 800,
          color: "#6b5e4e",
        }}
      >
        Уншигчийг бэлдэж байна...
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');

        .br-root {
          --paper: #f5f0e8;
          --ink: #1a1612;
          --ink-light: #6b5e4e;
          --accent: #7a3410;
          --border: #d4c5a9;
          min-height: 100vh;
          background: var(--paper);
          font-family: 'DM Sans', sans-serif;
        }

        .br-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          border-bottom: 1px solid var(--border);
          background: var(--paper);
          position: sticky;
          top: 0;
          z-index: 40;
          gap: 12px;
        }

        .br-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .br-back-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 13px;
          border-radius: 999px;
          border: 1.5px solid var(--border);
          background: #ffffff;
          color: var(--ink);
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(60, 40, 10, 0.06);
          transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.15s;
        }

        .br-back-btn:hover {
          background: #7a3410;
          color: #374151;
          border-color: #7a3410;
          transform: translateX(-2px);
        }

        .br-book-meta {
          min-width: 0;
        }

        .br-title {
          font-family: 'Lora', serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: -0.02em;
        }

        .br-author {
          margin-top: 2px;
          font-size: 0.75rem;
          color: var(--ink-light);
        }

        .br-topbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .br-vocab-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 100px;
          border: 1.5px solid var(--border);
          background: #fff;
          color: var(--ink);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          white-space: nowrap;
        }

        .br-vocab-btn:hover {
          border-color: var(--accent);
          background: #fdf8f0;
        }

        .br-vocab-count {
          background: var(--accent);
          color: #fff;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: 100px;
        }

        .chapter-select {
          max-width: 240px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1.5px solid var(--border);
          background: #fff;
          color: var(--ink);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          outline: none;
          cursor: pointer;
        }

        .chapter-select:hover {
          border-color: var(--accent);
        }

        .br-progress-bar {
          height: 3px;
          background: #e8e0d0;
        }

        .br-progress-fill {
          height: 100%;
          background: var(--accent);
          transition: width 0.4s ease;
        }

        .br-body {
          max-width: 700px;
          margin: 0 auto;
          padding: 52px 64px 32px;
        }

        .chapter-heading {
          margin-bottom: 28px;
          text-align: center;
          border-bottom: 1px solid var(--border);
          padding-bottom: 22px;
        }

        .chapter-kicker {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-light);
          margin-bottom: 8px;
        }

        .chapter-title {
          font-family: 'Lora', serif;
          font-size: 1.7rem;
          font-weight: 700;
          color: var(--ink);
          line-height: 1.25;
        }

        .br-text {
          font-family: 'EB Garamond', Georgia, serif;
          font-size: 1.25rem;
          line-height: 2.15;
          color: var(--ink);
          letter-spacing: 0.01em;
          text-align: justify;
          hyphens: auto;
          white-space: normal;
          word-break: normal;
          overflow-wrap: normal;
        }

        .word-btn {
          display: inline;
          font-family: inherit;
          font-size: inherit;
          font-weight: inherit;
          line-height: inherit;
          letter-spacing: inherit;
          color: inherit;
          background: transparent;
          border: 0;
          padding: 0 2px;
          margin: 0 1px;
          border-radius: 5px;
          cursor: pointer;
          text-align: inherit;
          vertical-align: baseline;
          appearance: none;
          -webkit-appearance: none;
          transition: background 0.12s, color 0.12s, box-shadow 0.12s;
        }

        .word-btn:hover {
          background: rgba(254, 240, 138, 0.72);
          color: #713f12;
          box-shadow: 0 0 0 1px rgba(202, 138, 4, 0.16);
        }

        .word-btn:focus {
          outline: none;
        }

        .word-btn:focus-visible {
          background: rgba(254, 240, 138, 0.78);
          color: #713f12;
          box-shadow: 0 0 0 2px rgba(202, 138, 4, 0.28);
        }

        .word-btn.active {
          background: rgba(253, 224, 71, 0.74);
          color: #713f12;
          font-weight: 800;
          box-shadow:
            0 0 0 1px rgba(202, 138, 4, 0.28),
            inset 0 -2px 0 rgba(202, 138, 4, 0.38);
        }

        .word-btn.saved {
          background: #dbeafe;
          color: #1d4ed8;
          font-weight: 600;
          box-shadow: inset 0 -2px 0 #3b82f6;
        }

        .word-btn.mastered {
          background: #dcfce7;
          color: #15803d;
          font-weight: 700;
          box-shadow: inset 0 -2px 0 #22c55e;
        }

        .word-btn.saved:hover {
          background: #bfdbfe;
          color: #1e40af;
          box-shadow: 0 0 0 1px #3b82f6, inset 0 -2px 0 #2563eb;
        }

        .word-btn.mastered:hover {
          background: #bbf7d0;
          color: #166534;
          box-shadow: 0 0 0 1px #22c55e, inset 0 -2px 0 #16a34a;
        }

        .word-btn.active.saved,
        .word-btn.active.mastered {
          background: #f97316;
          color: #ffffff;
          box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.35);
        }

        .br-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 700px;
          margin: 32px auto 0;
          padding: 20px 64px 32px;
          border-top: 1px solid var(--border);
          gap: 12px;
        }

        .br-page-info {
          font-family: 'Lora', serif;
          font-size: 0.85rem;
          color: var(--ink-light);
          letter-spacing: 0.08em;
          text-align: center;
          flex: 1;
          line-height: 1.7;
        }

        .br-page-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          border-radius: 100px;
          border: 1.5px solid var(--border);
          background: #fff;
          color: var(--ink);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .br-page-btn:hover:not(:disabled) {
          border-color: var(--accent);
          background: #fdf8f0;
          color: var(--accent);
        }

        .br-page-btn:disabled {
          opacity: 0.3;
          cursor: default;
        }

        .br-root {
          --paper: #f6eddc;
          --paper-page: #fffaf0;
          --paper-soft: #efe2cb;
          --ink: #221a12;
          --ink-light: #766a5b;
          --accent: #16a34a;
          --accent-soft: #dcfce7;
          --border: rgba(121, 97, 65, 0.2);
          min-height: 100vh;
          padding-bottom: 112px;
          background:
            radial-gradient(circle at 18% 0%, rgba(22, 163, 74, 0.14), transparent 26rem),
            linear-gradient(180deg, #f4ead8 0%, var(--paper) 42%, #eee1cc 100%);
          color: var(--ink);
          font-family: 'DM Sans', sans-serif;
        }

        .br-root.br-theme-white {
          --paper: #f7faf8;
          --paper-page: #ffffff;
          --paper-soft: #edf2f0;
          --ink: #111827;
          --ink-light: #647067;
          --border: rgba(17, 24, 39, 0.12);
          background: linear-gradient(180deg, #f8fafc 0%, #eef5f1 100%);
        }

        .br-root.br-theme-dark {
          --paper: #101815;
          --paper-page: #17211d;
          --paper-soft: #223028;
          --ink: #f3eadb;
          --ink-light: #b8ad9b;
          --border: rgba(255, 255, 255, 0.13);
          --accent-soft: rgba(34, 197, 94, 0.18);
          background:
            radial-gradient(circle at 70% 0%, rgba(34, 197, 94, 0.12), transparent 24rem),
            linear-gradient(180deg, #0d1512 0%, #131d19 100%);
        }

        .br-topbar {
          display: grid;
          gap: 9px;
          padding: 10px max(14px, env(safe-area-inset-left)) 9px max(14px, env(safe-area-inset-right));
          border-bottom: 1px solid var(--border);
          background: color-mix(in srgb, var(--paper-page) 88%, transparent);
          position: sticky;
          top: 0;
          z-index: 40;
          backdrop-filter: blur(18px);
          box-shadow: 0 8px 24px rgba(72, 50, 24, 0.08);
        }

        .br-header-main {
          display: grid;
          grid-template-columns: 38px minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
        }

        .br-icon-link {
          width: 38px;
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: 1px solid var(--border);
          color: var(--ink);
          background: var(--paper-page);
          text-decoration: none;
          box-shadow: 0 6px 18px rgba(60, 40, 10, 0.08);
        }

        .br-book-meta {
          min-width: 0;
        }

        .br-title {
          overflow: hidden;
          color: var(--ink);
          font-family: 'Lora', serif;
          font-size: clamp(1rem, 3.6vw, 1.22rem);
          font-weight: 800;
          line-height: 1.15;
          text-overflow: ellipsis;
          white-space: nowrap;
          letter-spacing: 0;
        }

        .br-author {
          margin-top: 2px;
          color: var(--ink-light);
          font-size: 0.75rem;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .br-profile-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          padding: 6px 9px;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--paper-page);
          color: var(--ink);
          font-size: 0.73rem;
          font-weight: 900;
          white-space: nowrap;
        }

        .br-profile-pill img {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          object-fit: cover;
        }

        .br-progress-row {
          display: grid;
          grid-template-columns: minmax(58px, auto) minmax(80px, 1fr) auto;
          align-items: center;
          gap: 9px;
          color: var(--ink-light);
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .br-progress-row span:first-child {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .br-progress-bar {
          height: 6px;
          overflow: hidden;
          border-radius: 999px;
          background: var(--paper-soft);
        }

        .br-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #22c55e, #84cc16);
          transition: width 0.4s ease;
        }

        .br-action-row {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding-bottom: 1px;
          scrollbar-width: none;
        }

        .br-action-row::-webkit-scrollbar {
          display: none;
        }

        .br-vocab-btn,
        .chapter-select {
          min-height: 34px;
          width: auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex: 0 0 auto;
          padding: 7px 11px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--paper-page);
          color: var(--ink);
          box-shadow: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 900;
          text-decoration: none;
          white-space: nowrap;
        }

        .chapter-select {
          max-width: min(250px, 68vw);
          outline: none;
        }

        .br-vocab-count {
          background: var(--accent);
          color: #fff;
          font-size: 0.65rem;
          font-weight: 900;
          padding: 1px 7px;
          border-radius: 100px;
        }

        .reader-toolbar {
          position: fixed;
          right: 16px;
          bottom: 92px;
          z-index: 120;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }

        .reader-settings-button {
          width: 48px;
          height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(22, 163, 74, 0.28);
          border-radius: 999px;
          background: #16a34a;
          color: #fff;
          box-shadow: 0 16px 36px rgba(22, 163, 74, 0.3);
          padding: 0;
        }

        .reader-settings-panel {
          width: min(330px, calc(100vw - 32px));
          padding: 14px;
          border: 1px solid var(--border);
          border-radius: 20px;
          background: color-mix(in srgb, var(--paper-page) 96%, transparent);
          color: var(--ink);
          box-shadow: 0 24px 70px rgba(40, 28, 12, 0.2);
          backdrop-filter: blur(18px);
        }

        .settings-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 0;
        }

        .settings-row + .settings-row {
          border-top: 1px solid var(--border);
        }

        .settings-label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--ink-light);
          font-size: 0.78rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .settings-stepper,
        .theme-segments {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px;
          border-radius: 999px;
          background: var(--paper-soft);
        }

        .settings-stepper button,
        .theme-segments button {
          width: auto;
          min-width: 34px;
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: var(--ink);
          box-shadow: none;
          padding: 5px 9px;
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: capitalize;
        }

        .settings-stepper span {
          min-width: 44px;
          color: var(--ink);
          text-align: center;
          font-size: 0.76rem;
          font-weight: 900;
        }

        .theme-segments button.active {
          background: var(--paper-page);
          color: var(--accent);
          box-shadow: 0 3px 10px rgba(60, 40, 10, 0.1);
        }

        .br-body {
          width: min(100%, 820px);
          margin: 0 auto;
          padding: 22px 14px 18px;
        }

        .chapter-heading {
          width: min(100%, 700px);
          margin: 0 auto 0;
          padding: clamp(24px, 7vw, 44px) clamp(18px, 6vw, 54px) 18px;
          border: 1px solid var(--border);
          border-bottom: 0;
          border-radius: 28px 28px 0 0;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.34), transparent),
            var(--paper-page);
          box-shadow: 0 18px 45px rgba(72, 50, 24, 0.11);
          text-align: center;
        }

        .chapter-kicker {
          margin-bottom: 8px;
          color: var(--accent);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .chapter-title {
          margin: 0;
          color: var(--ink);
          font-family: 'Lora', Georgia, serif;
          font-size: clamp(1.55rem, 7vw, 2.5rem);
          font-weight: 800;
          line-height: 1.16;
          letter-spacing: 0;
        }

        .chapter-author {
          margin: 10px 0 0;
          color: var(--ink-light);
          font-size: 0.86rem;
          font-weight: 800;
        }

        .br-text {
          width: min(100%, 700px);
          margin: 0 auto;
          padding: clamp(24px, 7vw, 54px) clamp(19px, 6vw, 58px);
          border: 1px solid var(--border);
          border-top: 0;
          border-radius: 0 0 28px 28px;
          background:
            linear-gradient(90deg, rgba(121, 97, 65, 0.05), transparent 9%, transparent 91%, rgba(121, 97, 65, 0.04)),
            radial-gradient(circle at 12% 18%, rgba(255,255,255,0.36), transparent 12rem),
            var(--paper-page);
          box-shadow:
            inset 8px 0 18px rgba(121, 97, 65, 0.045),
            0 26px 60px rgba(72, 50, 24, 0.14);
          color: var(--ink);
          font-family: 'EB Garamond', Georgia, serif;
          font-size: var(--reader-font-size);
          line-height: var(--reader-line-height);
          letter-spacing: 0;
          word-spacing: normal;
          text-align: left;
          word-break: normal;
          overflow-wrap: break-word;
          hyphens: auto;
        }

        .reader-paragraph {
          margin: 0 0 1.15em;
        }

        .reader-paragraph + .reader-paragraph {
          text-indent: 1.2em;
        }

        .word-btn {
          display: inline;
          font-family: inherit;
          font-size: inherit;
          font-weight: inherit;
          line-height: inherit;
          letter-spacing: inherit;
          color: inherit;
          background: transparent;
          border: 0;
          border-radius: 8px;
          box-shadow: inset 0 -0.13em rgba(22, 163, 74, 0.23);
          padding: 0 0.05em;
          margin: 0;
          cursor: pointer;
          text-align: inherit;
          vertical-align: baseline;
          appearance: none;
          -webkit-appearance: none;
          transition: background 0.12s, color 0.12s, box-shadow 0.12s;
        }

        .word-btn:hover,
        .word-btn:focus-visible {
          outline: none;
          background: rgba(187, 247, 208, 0.58);
          color: var(--ink);
          box-shadow: inset 0 -0.34em rgba(34, 197, 94, 0.28);
        }

        .word-btn.active {
          background: rgba(34, 197, 94, 0.2);
          color: var(--ink);
          font-weight: 700;
          box-shadow:
            inset 0 -0.48em rgba(34, 197, 94, 0.34),
            0 0 0 2px rgba(34, 197, 94, 0.12);
        }

        .word-btn.saved {
          color: var(--ink);
          font-weight: 600;
          box-shadow: inset 0 -0.18em rgba(59, 130, 246, 0.32);
        }

        .word-btn.mastered {
          color: var(--ink);
          font-weight: 700;
          box-shadow: inset 0 -0.18em rgba(22, 163, 74, 0.45);
        }

        .br-pagination {
          width: min(100%, 700px);
          display: grid;
          grid-template-columns: minmax(92px, 1fr) auto minmax(92px, 1fr);
          align-items: center;
          gap: 10px;
          margin: 18px auto 0;
          padding: 0 2px;
          border-top: 0;
        }

        .br-page-info {
          color: var(--ink-light);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.05em;
          line-height: 1.45;
          text-align: center;
          text-transform: uppercase;
        }

        .br-page-btn {
          width: auto;
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 14px;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--paper-page);
          color: var(--ink);
          box-shadow: 0 8px 22px rgba(72, 50, 24, 0.08);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 900;
        }

        .popup {
          --paper-page: #fff9ec;
          --paper-soft: #eadcc5;
          --ink: #211b13;
          --ink-light: #716554;
          --accent: var(--primary, var(--ds-primary, #16a34a));
          --accent-soft: var(--primary-soft, var(--ds-primary-soft, #e8f7ed));
          --border: rgba(91, 73, 49, 0.18);
          --popup-surface: var(--paper-page);
          --popup-muted: color-mix(in srgb, var(--paper-soft) 72%, var(--paper-page));
          --popup-featured: color-mix(in srgb, var(--accent-soft) 64%, var(--paper-page));
          font-family: 'DM Sans', sans-serif;
          background: var(--popup-surface);
          color: var(--ink);
          border: 1px solid var(--border);
          border-radius: 28px;
          box-shadow: 0 24px 64px rgba(20, 31, 24, 0.26);
          animation: sheetIn 0.22s cubic-bezier(0.22, 1, 0.36, 1);
          position: fixed;
          left: 50%;
          right: auto;
          bottom: 18px;
          width: min(calc(100vw - 32px), 520px);
          max-height: min(86vh, 720px);
          transform: translateX(-50%);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          opacity: 1;
          z-index: 10000;
          isolation: isolate;
        }

        .popup.popup-theme-white {
          --paper-page: #ffffff;
          --paper-soft: #e8eee8;
          --ink: #111827;
          --ink-light: #64748b;
          --border: rgba(17, 24, 39, 0.12);
        }

        .popup.popup-theme-dark {
          --paper-page: #18231e;
          --paper-soft: #253229;
          --ink: #f5ead9;
          --ink-light: #c1b5a4;
          --accent-soft: #123323;
          --border: rgba(255, 255, 255, 0.14);
        }

        .popup::before {
          content: "";
          display: block;
          width: 42px;
          height: 4px;
          flex: 0 0 auto;
          margin: 12px auto 4px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--ink-light) 34%, transparent);
        }

        .popup-header {
          padding: 10px 18px 0;
          background: var(--popup-surface);
          color: var(--ink);
          flex: 0 0 auto;
        }

        .popup-topline {
          color: var(--ink-light);
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        .popup-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding-right: 38px;
        }

        .popup-badges {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
        }

        .popup-body {
          padding: 14px 18px max(18px, env(safe-area-inset-bottom));
          max-height: none;
          overflow-y: auto;
          overscroll-behavior: contain;
          background: var(--popup-surface);
          color: var(--ink);
          flex: 1 1 auto;
        }

        .popup-word {
          font-family: 'Lora', serif;
          font-size: clamp(2rem, 7vw, 2.75rem);
          font-weight: 800;
          color: var(--ink);
          letter-spacing: 0;
          line-height: 1.05;
        }

        .popup-base,
        .popup-ipa,
        .popup-source {
          font-size: 0.82rem;
          color: var(--ink-light);
          margin-top: 2px;
        }

        .popup-base {
          font-style: italic;
        }

        .label {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--ink-light);
          margin-bottom: 5px;
        }

        .primary-trans {
          font-family: 'Lora', serif;
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--ink);
          line-height: 1.35;
        }

        .trans-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          padding: 7px 0;
          border-bottom: 1px solid #eadfce;
        }

        .trans-row:last-child {
          border-bottom: none;
        }

        .trans-mn {
          font-weight: 800;
          font-size: 0.95rem;
          color: #111111;
          min-width: 80px;
        }

        .trans-en {
          font-size: 0.82rem;
          color: #111111;
          font-style: italic;
          flex: 1;
        }

        .trans-ctx {
          font-size: 0.7rem;
          color: #111111;
          background: #f0ebe0;
          padding: 1px 7px;
          border-radius: 100px;
          white-space: nowrap;
        }

        .section {
          margin-bottom: 12px;
        }

        .mn-explanation {
          margin: 0;
          color: var(--ink);
          font-size: 0.9rem;
          line-height: 1.7;
        }

        .ai-loading {
          padding: 18px;
          background: var(--popup-surface);
        }

        .ai-loading-head {
          display: grid;
          gap: 7px;
          margin-bottom: 16px;
        }

        .ai-skeleton-line {
          height: 12px;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            color-mix(in srgb, var(--paper-soft) 78%, transparent) 25%,
            color-mix(in srgb, var(--paper-page) 92%, white) 50%,
            color-mix(in srgb, var(--paper-soft) 78%, transparent) 75%
          );
          background-size: 200% 100%;
          animation: skeletonShimmer 1.35s ease-in-out infinite;
        }

        .ai-skeleton-line.short {
          width: 46%;
        }

        .ai-skeleton-line.mid {
          width: 72%;
        }

        .ai-error-state {
          padding: 20px 18px;
          background: var(--popup-surface);
        }

        .ai-error-title {
          margin: 0 0 6px;
          color: var(--ink);
          font-size: 1rem;
          font-weight: 900;
        }

        .ai-error-text {
          margin: 0 0 14px;
          color: var(--ink-light);
          font-size: 0.86rem;
          line-height: 1.6;
        }

        .ai-error-actions {
          display: flex;
          gap: 8px;
        }

        .ai-retry-btn {
          width: auto;
          min-height: 36px;
          padding: 8px 13px;
          border: 0;
          border-radius: 999px;
          background: var(--accent);
          color: #fff;
          box-shadow: none;
          font-size: 0.78rem;
          font-weight: 900;
        }

        @keyframes skeletonShimmer {
          0% {
            background-position: 120% 0;
          }
          100% {
            background-position: -120% 0;
          }
        }

        .grammar-box {
          background: var(--popup-muted);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 10px;
        }

        .grammar-form {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #111111;
          background: #fde68a;
          padding: 2px 8px;
          border-radius: 100px;
          display: inline-block;
          margin-bottom: 6px;
        }

        .grammar-rule {
          font-size: 0.82rem;
          font-weight: 700;
          color: #111111;
          font-family: 'Lora', serif;
          margin-bottom: 4px;
        }

        .grammar-mn,
        .grammar-explain {
          font-size: 0.85rem;
          color: #111111;
          line-height: 1.6;
        }

        .grammar-explain {
          margin-top: 8px;
        }

        .phrase-card {
          background: var(--popup-muted);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 10px 12px;
          margin-bottom: 8px;
        }

        .phrase-card:last-child {
          margin-bottom: 0;
        }

        .phrase-text {
          font-family: 'Lora', serif;
          font-size: 0.95rem;
          font-weight: 800;
          font-style: italic;
          color: #111111;
        }

        .phrase-trans {
          font-size: 0.82rem;
          font-weight: 800;
          color: #111111;
          margin-top: 2px;
        }

        .phrase-ex-en {
          font-size: 0.78rem;
          color: #111111;
          margin-top: 6px;
          font-style: italic;
        }

        .phrase-ex-mn {
          font-size: 0.75rem;
          color: #111111;
          margin-top: 2px;
        }

        .example-box {
          background: var(--popup-muted);
          border: 1px solid var(--border);
          border-left: 5px solid #f97316;
          border-radius: 12px;
          padding: 12px 14px;
          margin-top: 12px;
        }

        .example-en {
          font-family: 'Lora', serif;
          font-style: italic;
          font-size: 0.92rem;
          color: #111111;
          line-height: 1.55;
        }

        .example-mn {
          font-size: 0.84rem;
          color: #111111;
          margin-top: 5px;
          line-height: 1.45;
        }

        .divider {
          border: none;
          height: 1px;
          background: linear-gradient(to right, transparent, var(--border), transparent);
          margin: 10px 0;
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid var(--border);
          margin-top: 10px;
          padding: 0 18px;
          gap: 2px;
        }

        .tab-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 8px 12px 7px;
          border: none;
          background: none;
          cursor: pointer;
          color: #111111;
          border-bottom: 2px solid transparent;
          transition: color 0.15s, border-color 0.15s;
          margin-bottom: -1px;
          border-radius: 4px 4px 0 0;
          position: relative;
        }

        .tab-btn:hover {
          color: #7a3410;
        }

        .tab-btn.active {
          color: #7a3410;
          border-bottom-color: #7a3410;
          font-weight: 900;
        }

        .tab-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 6px;
          height: 6px;
          background: var(--accent);
          border-radius: 50%;
        }

        .popup p,
        .popup span,
        .popup div,
        .popup li,
        .popup strong,
        .popup em {
          color: inherit;
        }

        .badge {
          font-size: 0.63rem;
          font-weight: 800;
          padding: 2px 9px;
          border-radius: 100px;
          letter-spacing: 0.06em;
          text-transform: capitalize;
        }

        .badge-type {
          background: #ede9fe;
          color: #111111;
        }

        .badge-cache {
          background: #d1fae5;
          color: #111111;
        }

        .save-word-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          min-height: 36px;
          padding: 8px 12px;
          border-radius: 100px;
          border: 1px solid rgba(22, 163, 74, 0.28);
          background: var(--accent);
          color: #ffffff;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s;
          width: 100%;
          justify-content: center;
          box-shadow: none;
        }

        .save-word-btn:hover:not(.saved) {
          border-color: #15803d;
          color: #ffffff;
          background: #15803d;
        }

        .save-word-btn.saved {
          border-color: #86efac;
          color: #166534;
          background: #f0fdf4;
          cursor: default;
        }

        .word-popover-actions {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 8px;
          margin-top: 12px;
        }

        .listen-word-btn {
          width: auto;
          min-height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--paper-page);
          color: var(--ink);
          box-shadow: none;
          font-size: 0.75rem;
          font-weight: 900;
        }

        .word-sheet-listen {
          width: 38px;
          height: 38px;
          min-height: 38px;
          padding: 0;
          flex-shrink: 0;
          background: var(--accent-soft);
          color: var(--accent);
          border-color: rgba(22, 163, 74, 0.18);
        }

        .word-sheet-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 14px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }

        .word-sheet-actions::-webkit-scrollbar {
          display: none;
        }

        .word-sheet-actions .save-word-btn,
        .word-sheet-actions .listen-word-btn {
          width: auto;
          flex: 0 0 auto;
        }

        .word-sheet-actions .save-word-btn {
          min-height: 40px;
          padding: 9px 14px;
          background: var(--accent);
          border-color: transparent;
        }

        .word-sheet-actions .listen-word-btn {
          min-height: 40px;
          padding: 9px 13px;
        }

        .explanation-stack {
          display: grid;
          gap: 12px;
        }

        .explain-card {
          border: 1px solid var(--border);
          border-radius: 20px;
          background: var(--popup-muted);
          padding: 14px;
          box-shadow: 0 8px 20px rgba(20, 31, 24, 0.08);
        }

        .explain-card.featured {
          border-color: color-mix(in srgb, var(--accent) 28%, var(--border));
          background: var(--popup-featured);
        }

        .explain-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
        }

        .explain-card-title {
          margin: 0;
          color: var(--ink);
          font-size: 0.8rem;
          font-weight: 950;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .explain-card-text {
          margin: 0;
          color: var(--ink);
          font-size: 0.96rem;
          line-height: 1.72;
          overflow-wrap: anywhere;
        }

        .explain-card-text.primary {
          font-size: 1.05rem;
          font-weight: 750;
        }

        .translation-main {
          font-family: 'Lora', serif;
          color: var(--ink);
          font-size: 1.45rem;
          font-weight: 850;
          line-height: 1.25;
          margin: 0;
        }

        .translation-chips,
        .similar-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 10px;
        }

        .translation-chip,
        .similar-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          max-width: 100%;
          border-radius: 999px;
          padding: 6px 10px;
          background: var(--accent-soft);
          color: var(--ink);
          font-size: 0.78rem;
          font-weight: 850;
          overflow-wrap: anywhere;
        }

        .example-card-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .example-card-copy {
          min-width: 0;
          flex: 1;
        }

        .sheet-empty-note {
          margin: 0;
          color: var(--ink-light);
          font-size: 0.88rem;
          line-height: 1.55;
        }

        .loading-dots span {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          margin: 0 2px;
          animation: bounce 1.2s infinite;
        }

        .loading-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .loading-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes popIn {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .close-btn {
          position: absolute;
          right: 12px;
          top: 12px;
          width: 30px;
          height: 30px;
          background: var(--paper-soft);
          border: 1px solid var(--border);
          cursor: pointer;
          color: var(--ink);
          font-size: 1.35rem;
          font-weight: 800;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, transform 0.15s;
        }

        .close-btn:hover {
          background: #f0d47a;
          transform: scale(1.05);
        }

        .vocab-overlay {
          position: fixed;
          inset: 0;
          background: rgba(26,22,18,0.28);
          z-index: 200;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.18s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .vocab-panel {
          position: fixed;
          right: 0;
          top: 0;
          bottom: 0;
          width: min(420px, 100vw);
          background: #fffaf2;
          color: #1f2937;
          border-left: 1px solid var(--border);
          box-shadow: -12px 0 40px rgba(60,40,10,0.18);
          z-index: 201;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.22s cubic-bezier(0.22,1,0.36,1);
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .vocab-header {
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .vocab-title {
          font-family: 'Lora', serif;
          font-size: 1.2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .vocab-stats {
          display: flex;
          gap: 10px;
          padding: 12px 20px;
          border-bottom: 1px solid var(--border);
          background: #fdf8f0;
        }

        .vocab-stat {
          flex: 1;
          text-align: center;
          padding: 10px 8px;
          border-radius: 12px;
          background: #fff;
          border: 1px solid var(--border);
        }

        .vocab-stat-val {
          font-size: 1.4rem;
          font-weight: 700;
          color: #1f2937;
          font-family: 'Lora', serif;
        }

        .vocab-stat-label {
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6b7280;
          margin-top: 2px;
        }

        .vocab-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .vocab-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          background: #fff;
          border: 1px solid var(--border);
          transition: border-color 0.15s;
        }

        .vocab-item.mastered {
          border-color: #86efac;
          background: #f0fdf4;
        }

        .vocab-item-word {
          font-family: 'Lora', serif;
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
        }

        .vocab-item-trans {
          font-size: 0.8rem;
          color: #4b5563;
          margin-top: 2px;
        }

        .vocab-item-source {
          font-size: 0.72rem;
          color: #7c6f5f;
          margin-top: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .vocab-check-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1.5px solid var(--border);
          background: #fff;
          cursor: pointer;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s;
        }

        .vocab-check-btn:hover {
          border-color: #16a34a;
          background: #f0fdf4;
        }

        .vocab-check-btn.mastered {
          border-color: #16a34a;
          background: #16a34a;
          color: #fff;
        }

        .vocab-remove-btn {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 0.9rem;
          color: var(--ink-light);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: color 0.15s, background 0.15s;
        }

        .vocab-remove-btn:hover {
          color: #c0392b;
          background: #fef2f2;
        }

        .vocab-empty {
          text-align: center;
          padding: 48px 20px;
          color: #ffffff;
        }

        .vocab-empty p {
          font-size: 0.9rem;
          margin-top: 8px;
          line-height: 1.6;
        }

        .br-toast {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--ink);
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 100px;
          z-index: 300;
          white-space: nowrap;
          box-shadow: 0 8px 24px rgba(0,0,0,0.24);
          animation: toastIn 0.25s cubic-bezier(0.22,1,0.36,1);
        }

        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .empty-book-box {
          text-align: center;
          padding: 64px 24px;
          border: 1px dashed var(--border);
          border-radius: 22px;
          background: #fffaf0;
        }

        .empty-book-icon {
          font-size: 3rem;
          margin-bottom: 14px;
        }

        .empty-book-title {
          font-family: 'Lora', serif;
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 8px;
        }

        .empty-book-text {
          max-width: 460px;
          margin: 0 auto 20px;
          font-size: 0.92rem;
          line-height: 1.7;
          color: var(--ink-light);
        }

        .empty-book-error {
          color: #c0392b;
          font-size: 0.86rem;
          margin-bottom: 14px;
        }

        .import-main-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 11px 20px;
          border-radius: 999px;
          border: 1.5px solid var(--accent);
          background: var(--accent);
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .import-main-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(122,52,16,0.22);
        }

        .empty-book-actions {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        @media (max-width: 720px) {
          .br-topbar {
            display: grid;
            align-items: stretch;
          }

          .br-left {
            width: 100%;
          }

          .br-back-btn {
            flex-shrink: 0;
          }

          .br-topbar-right {
            width: 100%;
            flex-wrap: wrap;
          }

          .chapter-select {
            max-width: none;
            flex: 1;
            min-width: 180px;
          }
        }

        @media (max-width: 640px) {
          .br-body {
            padding: 18px 10px 18px;
          }

          .br-pagination {
            padding: 0 2px;
          }
        }

        @media (max-width: 520px) {
          .br-root {
            padding-bottom: 128px;
          }

          .br-topbar {
            padding-top: max(8px, env(safe-area-inset-top));
          }

          .br-header-main {
            grid-template-columns: 34px minmax(0, 1fr) auto;
            gap: 8px;
          }

          .br-icon-link {
            width: 34px;
            height: 34px;
          }

          .br-profile-pill span {
            display: none;
          }

          .br-progress-row {
            grid-template-columns: minmax(40px, 0.5fr) minmax(80px, 1fr) auto;
            gap: 7px;
          }

          .br-action-row {
            margin-inline: -2px;
          }

          .chapter-heading,
          .br-text {
            border-radius: 22px 22px 0 0;
          }

          .br-text {
            border-radius: 0 0 22px 22px;
          }

          .reader-paragraph + .reader-paragraph {
            text-indent: 0.85em;
          }

          .br-pagination {
            grid-template-columns: 1fr;
          }

          .br-page-info {
            order: -1;
          }

          .br-page-btn {
            width: 100%;
          }

          .reader-toolbar {
            right: 12px;
            bottom: 88px;
          }

          .popup {
            width: min(calc(100vw - 32px), 520px) !important;
          }
        }

        @media (min-width: 761px) {
          .popup {
            max-height: min(86vh, 720px);
          }
        }

        @media (max-width: 760px) {
          .popup {
            left: 12px !important;
            right: 12px !important;
            top: auto !important;
            bottom: 12px !important;
            transform: none;
            width: auto !important;
            max-width: calc(100vw - 24px);
            max-height: min(88vh, 720px);
            border-radius: 24px;
            box-shadow: 0 -18px 48px rgba(20, 31, 24, 0.26);
            animation: sheetInMobile 0.22s cubic-bezier(0.22, 1, 0.36, 1);
          }

          .popup::before {
            display: block;
          }

          .popup-header {
            padding: 10px 18px 0;
          }

          .popup-body {
            padding-bottom: max(18px, env(safe-area-inset-bottom));
          }

          .close-btn {
            top: 14px;
          }

          .word-popover-actions {
            grid-template-columns: 1fr 1fr;
          }
        }

        @keyframes sheetIn {
          from {
            transform: translate(-50%, 100%);
          }
          to {
            transform: translate(-50%, 0);
          }
        }

        @keyframes sheetInMobile {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        /* Reader page redesign layer: scoped overrides, logic untouched. */
        .br-root {
          --reader-shell: var(--ds-bg, #f5f3ed);
          --paper: #f2e7d4;
          --paper-page: #fff9ec;
          --paper-soft: #eadcc5;
          --ink: #211b13;
          --ink-light: #716554;
          --accent: var(--ds-primary, #16a34a);
          --accent-soft: var(--ds-primary-soft, #e8f7ed);
          --border: rgba(91, 73, 49, 0.18);
          background:
            radial-gradient(circle at 16% 0%, rgba(22, 163, 74, 0.08), transparent 24rem),
            linear-gradient(180deg, #f7efe2 0%, #efe2cd 58%, #e7dac5 100%);
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-x: hidden;
        }

        .br-content-shell {
          width: min(100%, 920px);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-sizing: border-box;
        }

        .br-root.br-theme-white {
          --paper: #f6f8f5;
          --paper-page: #ffffff;
          --paper-soft: #e8eee8;
        }

        .br-root.br-theme-dark {
          --paper: #0f1713;
          --paper-page: #18231e;
          --paper-soft: #253229;
          --ink: #f5ead9;
          --ink-light: #c1b5a4;
          --border: rgba(255, 255, 255, 0.12);
        }

        .br-topbar {
          width: 100%;
          align-self: center;
          box-sizing: border-box;
          border-bottom: 1px solid var(--border);
          background: color-mix(in srgb, var(--paper-page) 90%, transparent);
          box-shadow: 0 10px 30px rgba(55, 38, 18, 0.08);
        }

        .br-icon-link,
        .br-vocab-btn,
        .chapter-select,
        .br-profile-pill {
          border-color: var(--border);
          background: color-mix(in srgb, var(--paper-page) 92%, transparent);
        }

        .br-icon-link:hover,
        .br-vocab-btn:hover {
          border-color: rgba(22, 163, 74, 0.28);
          background: var(--accent-soft);
          color: var(--accent);
        }

        .br-progress-bar {
          background: color-mix(in srgb, var(--paper-soft) 82%, transparent);
        }

        .br-progress-fill {
          background: linear-gradient(90deg, #15803d, #22c55e, #a3e635);
        }

        .br-body {
          width: min(100%, 860px);
          margin-inline: auto;
          padding-top: clamp(16px, 4vw, 30px);
        }

        .br-pagination {
          align-self: center;
          margin-inline: auto;
        }

        .chapter-heading {
          width: min(100%, 720px);
          border-color: var(--border);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.42), transparent 54%),
            radial-gradient(circle at 50% -10%, rgba(22, 163, 74, 0.08), transparent 14rem),
            var(--paper-page);
          box-shadow: 0 18px 44px rgba(73, 50, 24, 0.1);
        }

        .chapter-title {
          max-width: 620px;
          margin-inline: auto;
          font-size: clamp(1.45rem, 6vw, 2.35rem);
        }

        .chapter-author {
          font-weight: 700;
        }

        .br-text {
          width: min(100%, 720px);
          min-height: min(68vh, 780px);
          border-color: var(--border);
          background:
            linear-gradient(90deg, rgba(91,73,49,0.04), transparent 10%, transparent 90%, rgba(91,73,49,0.035)),
            radial-gradient(circle at 24% 12%, rgba(255,255,255,0.42), transparent 13rem),
            linear-gradient(180deg, var(--paper-page), color-mix(in srgb, var(--paper-page) 92%, var(--paper-soft)));
          box-shadow:
            inset 10px 0 24px rgba(91, 73, 49, 0.045),
            inset -10px 0 22px rgba(91, 73, 49, 0.025),
            0 28px 70px rgba(73, 50, 24, 0.13);
          font-size: clamp(18px, 4.6vw, var(--reader-font-size));
          line-height: var(--reader-line-height);
        }

        .reader-paragraph {
          margin-bottom: 1.22em;
        }

        .word-btn {
          border-radius: 0.42em;
          box-shadow: inset 0 -0.12em rgba(22, 163, 74, 0.2);
        }

        .word-btn:hover,
        .word-btn:focus-visible {
          background: rgba(236, 253, 245, 0.82);
          box-shadow: inset 0 -0.42em rgba(34, 197, 94, 0.24);
        }

        .word-btn.active {
          background: rgba(255, 237, 166, 0.5);
          box-shadow:
            inset 0 -0.55em rgba(250, 204, 21, 0.32),
            0 0 0 2px rgba(22, 163, 74, 0.11);
        }

        .word-btn.saved {
          box-shadow: inset 0 -0.2em rgba(14, 165, 233, 0.28);
        }

        .word-btn.mastered {
          box-shadow: inset 0 -0.2em rgba(22, 163, 74, 0.42);
        }

        .br-pagination {
          width: min(100% - 20px, 720px);
          margin-top: 14px;
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: color-mix(in srgb, var(--paper-page) 90%, transparent);
          box-shadow: 0 18px 42px rgba(73, 50, 24, 0.1);
          backdrop-filter: blur(16px);
        }

        .br-page-btn {
          min-height: 40px;
          border-color: transparent;
          background: transparent;
          box-shadow: none;
        }

        .br-page-btn:hover:not(:disabled) {
          background: var(--accent-soft);
          color: var(--accent);
        }

        .reader-toolbar {
          bottom: calc(24px + env(safe-area-inset-bottom));
        }

        .reader-settings-button {
          background: var(--accent);
          box-shadow: 0 14px 34px rgba(22, 163, 74, 0.28);
        }

        .reader-settings-panel {
          border-radius: 18px;
          background: color-mix(in srgb, var(--paper-page) 97%, transparent);
        }

        @media (min-width: 900px) {
          .br-content-shell {
            padding-inline: 24px;
          }

          .br-topbar {
            margin-top: 12px;
            border: 1px solid var(--border);
            border-radius: 24px;
          }

          .br-action-row {
            justify-content: center;
            overflow-x: visible;
            flex-wrap: wrap;
          }
        }

        .empty-book-box {
          width: min(100%, 680px);
          margin: 22px auto 0;
          padding: clamp(34px, 8vw, 58px) 22px;
          border: 1px dashed var(--border);
          background:
            radial-gradient(circle at 50% 0%, rgba(22, 163, 74, 0.1), transparent 14rem),
            var(--paper-page);
          box-shadow: 0 20px 52px rgba(73, 50, 24, 0.1);
        }

        .empty-book-icon {
          width: 58px;
          height: 74px;
          display: grid;
          place-items: center;
          margin: 0 auto 18px;
          border-radius: 12px;
          background: linear-gradient(145deg, #2f5f43, #d88a2d);
          color: #fff;
          font-size: 1.6rem;
          box-shadow: inset -9px 0 16px rgba(0,0,0,0.16);
        }

        .empty-book-title {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(1.25rem, 5vw, 1.65rem);
          font-weight: 900;
        }

        .empty-book-text {
          color: var(--ink-light);
        }

        .import-main-btn {
          border: 0;
          background: var(--accent);
          box-shadow: 0 12px 28px rgba(22, 163, 74, 0.2);
        }

        @media (max-width: 640px) {
          .br-root {
            padding-bottom: calc(72px + env(safe-area-inset-bottom));
          }

          .br-topbar {
            gap: 8px;
            padding-inline: 10px;
          }

          .br-title {
            font-size: 0.98rem;
          }

          .br-author {
            font-size: 0.7rem;
          }

          .br-action-row {
            padding-bottom: 2px;
          }

          .br-vocab-btn,
          .chapter-select {
            min-height: 32px;
            padding: 6px 10px;
            font-size: 0.72rem;
          }

          .chapter-heading {
            padding: 22px 18px 15px;
          }

          .br-text {
            min-height: 62vh;
            padding: 26px 20px 32px;
          }

          .br-pagination {
            position: sticky;
            bottom: calc(10px + env(safe-area-inset-bottom));
            z-index: 35;
            grid-template-columns: 1fr auto 1fr;
            border-radius: 22px;
          }

          .br-page-info {
            order: initial;
            font-size: 0.64rem;
          }

          .br-page-btn {
            width: auto;
            min-width: 82px;
            padding-inline: 10px;
          }
        }

        @media (max-width: 420px) {
          .br-pagination {
            grid-template-columns: 1fr;
            border-radius: 20px;
          }

          .br-page-info {
            order: -1;
          }

          .br-page-btn {
            width: 100%;
          }
        }
      `}</style>

      <ReaderShell preferences={preferences}>
        <ReaderHeader
          title={book?.title || "Номын Уншигч"}
          author={book?.authors?.trim() || "Unknown author"}
          chapterTitle={chapters[chapterIndex]?.title || "Ready to read"}
          chapterIndex={chapterIndex}
          chapterCount={chapters.length}
          progress={totalProgress}
          totalSaved={totalSaved}
          chapters={chapters}
          onChapterChange={goToChapter}
          onOpenVocab={() => setVocabOpen(true)}
          user={readerDisplayUser}
        />

        <ReaderToolbar
          preferences={preferences}
          onPreferencesChange={setPreferences}
          open={settingsOpen}
          onToggleOpen={() => setSettingsOpen((open) => !open)}
        />

        <div className="br-body" ref={bodyRef}>
          {chapters.length > 0 && bookText && (
            <div className="chapter-heading">
              <div className="chapter-kicker">
                Chapter {chapterIndex + 1} / {chapters.length}
              </div>

              <h1 className="chapter-title">
                {book?.title || chapters[chapterIndex]?.title}
              </h1>

              <p className="chapter-author">
                {book?.authors?.trim() || "Unknown author"}
              </p>
            </div>
          )}

          {bookText ? (
            <div className="br-text">
              {pageParagraphs.map((paragraph) => (
                <p key={paragraph.id} className="reader-paragraph">
                  {paragraph.tokens.map((part, i) => {
                    const isWord = /^[a-zA-Z']+$/.test(part);

                    if (!isWord) {
                      return <span key={`${paragraph.id}-${i}`}>{part}</span>;
                    }

                    const key = cleanWord(part).toLowerCase();
                    const isActive = key === highlightedWord;
                    const savedEntry = savedWords.find((word) => word.key === key);
                    const isMemorized = savedEntry?.status === "memorized";

                    return (
                      <span
                        key={`${paragraph.id}-${i}`}
                        data-word-btn
                        role="button"
                        tabIndex={0}
                        className={`word-btn${isActive ? " active" : ""}${
                          isMemorized
                            ? " mastered"
                            : savedEntry
                              ? " saved"
                              : ""
                        }`}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleWordClick(part);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            void handleWordClick(part);
                          }
                        }}
                      >
                        {part}
                      </span>
                    );
                  })}
                </p>
              ))}
            </div>
          ) : (
            <div className="empty-book-box">
              <div className="empty-book-icon">📚</div>

              <h2 className="empty-book-title">
                {loadError
                  ? "Ном нээгдсэнгүй"
                  : bookId
                    ? "Ном ачаалж байна..."
                    : "Унших ном сонгоогүй байна"}
              </h2>

              <p className="empty-book-text">
                {loadError
                  ? "Номын сан руу буцаад өөр ном сонгох эсвэл өөрийн файл import хийгээрэй."
                  : bookId
                    ? "Номын текстийг татаж байна. Түр хүлээнэ үү."
                    : "PDF, EPUB, DOCX эсвэл TXT номоо import хийгээд үгэн дээр дарж AI тайлбар, орчуулга харна."}
              </p>

              {loadError && <p className="empty-book-error">{loadError}</p>}

              {!bookId && (
                <div className="empty-book-actions">
                  <label className="import-main-btn">
                    {importingBook ? "Уншиж байна..." : "Ном сонгох"}
                    <input
                      type="file"
                      accept=".txt,.pdf,.epub,.docx"
                      onChange={handleBookUpload}
                      style={{ display: "none" }}
                    />
                  </label>

                  <Link className="import-main-btn" href="/?view=library">
                    Номын сангаас сонгох
                  </Link>
                </div>
              )}

              {bookId && loadError && (
                <div className="empty-book-actions">
                  <Link className="import-main-btn" href="/?view=library">
                    Номын сан руу буцах
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {bookText && (
          <div className="br-pagination">
            <button
              className="br-page-btn"
              disabled={isFirstPage}
              onClick={() => {
                if (pageIndex > 0) {
                  changePage(pageIndex - 1);
                } else {
                  goToPrevChapter();
                }
              }}
            >
              <ChevronLeft size={17} />
              Өмнөх
            </button>

            <div className="br-page-info">
              Chapter {chapterIndex + 1} / {Math.max(chapters.length, 1)}
              <br />
              Page {pageIndex + 1} / {Math.max(pages.length, 1)}
            </div>

            <button
              className="br-page-btn"
              disabled={isLastPage}
              onClick={() => {
                if (pageIndex < pages.length - 1) {
                  changePage(pageIndex + 1);
                } else {
                  goToNextChapter();
                }
              }}
            >
              Дараах
              <ChevronRight size={17} />
            </button>
          </div>
        )}
      </ReaderShell>

      {popup.visible && (
        <div
          ref={popupRef}
          className={`popup popup-theme-${preferences.theme}`}
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedWord || "Үг"} тайлбар`}
        >
          <button
            className="close-btn"
            onClick={closePopup}
            aria-label="Тайлбар хаах"
          >
            ×
          </button>

          {loading ? (
            <div className="ai-loading">
              <div className="popup-topline">Үгийн тайлбар</div>
              <p className="popup-word">{selectedWord}</p>

              <div className="ai-loading-head">
                <span className="ai-skeleton-line mid" />
                <span className="ai-skeleton-line" />
                <span className="ai-skeleton-line short" />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="loading-dots">
                  <span />
                  <span />
                  <span />
                </div>

                <span style={{ fontSize: "0.8rem", color: "var(--ink-light)" }}>
                  Тайлбарлаж байна...
                </span>
              </div>
            </div>
          ) : apiError ? (
            <div className="ai-error-state">
              <div className="popup-topline">Үгийн тайлбар</div>
              <p className="popup-word">{selectedWord}</p>
              <p className="ai-error-title">Тайлбар авч чадсангүй</p>
              <p className="ai-error-text">{apiError}</p>
              <div className="ai-error-actions">
                <button
                  className="ai-retry-btn"
                  onClick={() => selectedWord && explainWord(selectedWord)}
                >
                  Дахин оролдох
                </button>
                <button className="listen-word-btn" onClick={closePopup}>
                  Хаах
                </button>
              </div>
            </div>
          ) : wordData ? (
            <>
              <div className="popup-header">
                <div className="popup-title-row">
                  <div>
                    <div className="popup-topline">Сонгосон үг</div>
                    <p className="popup-word">{wordData.word}</p>

                    {wordData.base_form &&
                      wordData.base_form !== wordData.word && (
                        <p className="popup-base">← {wordData.base_form}</p>
                      )}

                    {wordData.pronunciation && (
                      <p className="popup-ipa">/{wordData.pronunciation}/</p>
                    )}
                  </div>

                  <button
                    className="listen-word-btn word-sheet-listen"
                    onClick={() => listenToWord(wordData.word)}
                    aria-label={`${wordData.word} сонсох`}
                    title="Сонсох"
                  >
                    <Headphones size={17} />
                  </button>
                </div>

                <div className="popup-badges">
                  {wordData.word_type && (
                    <span className="badge badge-type">
                      {wordData.word_type}
                    </span>
                  )}

                  {wordData.difficulty && (
                    <span
                      className="badge"
                      style={{
                        background:
                          DIFFICULTY_COLORS[wordData.difficulty]?.bg ??
                          "#f3f4f6",
                        color:
                          DIFFICULTY_COLORS[wordData.difficulty]?.text ??
                          "#374151",
                      }}
                    >
                      {wordData.difficulty}
                    </span>
                  )}

                  {fromCache && (
                    <span className="badge badge-cache">Cached</span>
                  )}
                </div>

                <div className="word-sheet-actions">
                  <button
                    className={`save-word-btn${isWordSaved ? " saved" : ""}`}
                    onClick={() => !isWordSaved && saveWord(wordData)}
                  >
                    {isWordSaved ? "Үгийн санд хадгалсан" : "Үгийн санд хадгалах"}
                  </button>

                  {currentSavedWord && (
                    <button
                      className="listen-word-btn"
                      onClick={() => toggleMastered(currentSavedWord.key)}
                    >
                      {currentSavedWord.status === "memorized"
                        ? "Цээжлээгүй болгох"
                        : "Цээжилсэн болгох"}
                    </button>
                  )}

                  <button
                    className="listen-word-btn"
                    onClick={() => listenToWord(wordData.word)}
                  >
                    <Headphones size={15} />
                    Сонсох
                  </button>
                </div>
              </div>

              <div className="popup-body">
                <div className="explanation-stack">
                  {wordData.mongolian_explanation && (
                    <section className="explain-card featured">
                      <div className="explain-card-head">
                        <h3 className="explain-card-title">Энгийн тайлбар</h3>
                      </div>
                      <p className="explain-card-text primary">
                        {wordData.mongolian_explanation}
                      </p>
                    </section>
                  )}

                  <section className="explain-card">
                    <div className="explain-card-head">
                      <h3 className="explain-card-title">Орчуулга</h3>
                    </div>
                    {wordData.primary_translation ? (
                      <p className="translation-main">
                        {wordData.primary_translation}
                      </p>
                    ) : (
                      <p className="sheet-empty-note">Орчуулга олдсонгүй.</p>
                    )}

                    {(wordData.all_translations?.length ?? 0) > 0 && (
                      <div className="translation-chips">
                        {wordData.all_translations
                          .filter((translation) => translation.mongolian)
                          .slice(0, 6)
                          .map((translation, index) => (
                            <span key={index} className="translation-chip">
                              {translation.mongolian}
                              {translation.usage_context
                                ? ` · ${translation.usage_context}`
                                : ""}
                            </span>
                          ))}
                      </div>
                    )}
                  </section>

                  {(wordData.example_sentence_en || wordData.example_sentence_mn) && (
                    <section className="explain-card">
                      <div className="explain-card-head">
                        <h3 className="explain-card-title">Жишээ өгүүлбэр</h3>
                        {wordData.example_sentence_en && (
                          <button
                            className="listen-word-btn word-sheet-listen"
                            onClick={() => listenToWord(wordData.example_sentence_en)}
                            aria-label="Жишээ өгүүлбэр сонсох"
                            title="Сонсох"
                          >
                            <Headphones size={16} />
                          </button>
                        )}
                      </div>

                      <div className="example-card-row">
                        <div className="example-card-copy">
                          {wordData.example_sentence_en && (
                            <p className="example-en">
                              &quot;{wordData.example_sentence_en}&quot;
                            </p>
                          )}

                          {wordData.example_sentence_mn && (
                            <p className="example-mn">
                              {wordData.example_sentence_mn}
                            </p>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {memoryTip && (
                    <section className="explain-card">
                      <div className="explain-card-head">
                        <h3 className="explain-card-title">Санах арга</h3>
                      </div>

                      <p className="explain-card-text">{memoryTip}</p>
                    </section>
                  )}

                  {similarWords.length > 0 && (
                    <section className="explain-card">
                      <div className="explain-card-head">
                        <h3 className="explain-card-title">Ижил төстэй үгс</h3>
                      </div>

                      <div className="similar-chips">
                        {similarWords.slice(0, 8).map((similarWord, index) => (
                          <span key={index} className="similar-chip">
                            {similarWord}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {hasGrammar && (
                    <section className="explain-card">
                      <div className="explain-card-head">
                        <h3 className="explain-card-title">Дүрмийн тэмдэглэл</h3>
                      </div>

                      <div className="grammar-box">
                        <span className="grammar-form">
                          {FORM_LABELS[wordData.inflection!.form!] ??
                            wordData.inflection!.form}
                        </span>

                        <p className="grammar-rule">
                          {wordData.inflection!.rule_en}
                        </p>

                        <p className="grammar-mn">
                          {wordData.inflection!.rule_mn}
                        </p>

                        {wordData.inflection!.explanation_mn && (
                          <p className="grammar-explain">
                            {wordData.inflection!.explanation_mn}
                          </p>
                        )}
                      </div>
                    </section>
                  )}

                  {hasPhrases && (
                    <section className="explain-card">
                      <div className="explain-card-head">
                        <h3 className="explain-card-title">Хэллэг</h3>
                      </div>

                      <div className="explanation-stack">
                        {wordData.phrases.slice(0, 6).map((phrase, index) => (
                          <div key={index} className="phrase-card">
                            <p className="phrase-text">{phrase.phrase}</p>
                            <p className="phrase-trans">{phrase.translation}</p>
                            {phrase.example_en && (
                              <p className="phrase-ex-en">
                                &quot;{phrase.example_en}&quot;
                              </p>
                            )}
                            {phrase.example_mn && (
                              <p className="phrase-ex-mn">{phrase.example_mn}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {(book?.title || chapters[chapterIndex]?.title) && (
                    <section className="explain-card">
                      <div className="explain-card-head">
                        <h3 className="explain-card-title">Эх сурвалж</h3>
                      </div>
                      <p className="popup-source">
                        {book?.title ?? chapters[chapterIndex]?.title}
                      </p>
                    </section>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {vocabOpen && (
        <>
          <div
            className="vocab-overlay"
            onClick={() => setVocabOpen(false)}
          />

          <div className="vocab-panel">
            <div className="vocab-header">
              <div className="vocab-title">📚 Үгийн сан</div>

              <button
                className="close-btn"
                style={{ position: "static" }}
                onClick={() => setVocabOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="vocab-stats">
              <div className="vocab-stat">
                <div className="vocab-stat-val">{totalSaved}</div>
                <div className="vocab-stat-label">Нийт үг</div>
              </div>

              <div className="vocab-stat">
                <div className="vocab-stat-val" style={{ color: "#16a34a" }}>
                  {masteredCount}
                </div>
                <div className="vocab-stat-label">Цээжилсэн</div>
              </div>

              <div className="vocab-stat">
                <div className="vocab-stat-val" style={{ color: "#f59e0b" }}>
                  {totalSaved - masteredCount}
                </div>
                <div className="vocab-stat-label">Үлдсэн</div>
              </div>
            </div>

            <div className="vocab-list">
              {savedWords.length === 0 ? (
                <div className="vocab-empty">
                  <div style={{ fontSize: "2.5rem" }}>📖</div>

                  <p>
                    Үг дараад <strong>&quot;+ Үгийн санд нэмэх&quot;</strong> товч дарж
                    цуглуулаарай.
                  </p>
                </div>
              ) : (
                savedWords.map((word) => {
                  const isMemorized = word.status === "memorized";

                  return (
                    <div
                      key={word.key}
                      className={`vocab-item${isMemorized ? " mastered" : ""}`}
                    >
                      <button
                        className={`vocab-check-btn${
                          isMemorized ? " mastered" : ""
                        }`}
                        onClick={() => toggleMastered(word.key)}
                        title={
                          isMemorized
                            ? "Цээжлээгүй болгох"
                            : "Цээжилсэн болгох"
                        }
                      >
                        {isMemorized ? "✓" : "○"}
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="vocab-item-word">{word.word}</div>
                        <div className="vocab-item-trans">
                          {word.meaning || word.translation || "Тайлбар хадгалагдсан"}
                        </div>
                        {word.sourceBookTitle && (
                          <div className="vocab-item-source">
                            Ном: {word.sourceBookTitle}
                          </div>
                        )}
                      </div>

                      <button
                        className="vocab-remove-btn"
                        onClick={() => removeWord(word.key)}
                        title="Жагсаалтаас хасах"
                      >
                        ×
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {selectionPopup.visible && (
        <div
          className={`popup popup-theme-${preferences.theme}`}
          role="dialog"
          aria-modal="true"
          aria-label="Орчуулга"
        >
          <button
            className="close-btn"
            onClick={closeSelectionPopup}
            aria-label="Орчуулга хаах"
          >
            ×
          </button>

          <div className="popup-topline">Орчуулга</div>
          <p className="popup-word">{selectionPopup.text}</p>

          {selectionPopup.loading ? (
            <div className="ai-loading">
              <div className="ai-loading-head">
                <span className="ai-skeleton-line mid" />
                <span className="ai-skeleton-line" />
              </div>
            </div>
          ) : selectionPopup.error ? (
            <p className="ai-error-title">{selectionPopup.error}</p>
          ) : (
            <p>{selectionPopup.translation}</p>
          )}
        </div>
      )}

      {toast && <div className="br-toast">{toast}</div>}
    </>
  );
}

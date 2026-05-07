"use client";

import { WordData } from "@/lib/push";
import Link from "next/link";
import { AuthModal } from "./AuthModal";
import type {
  ChangeEvent,
  Key,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import { useEffect, useMemo, useRef, useState } from "react";

function splitText(text: string) {
  return text.split(/(\s+|[.,!?;:"""''()[\]—\-]+)/g).filter(Boolean);
}

function cleanWord(word: string) {
  return word.replace(/[^a-zA-Z']/g, "").trim();
}

function getSentenceAroundWord(fullText: string, word: string) {
  const sentences = fullText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  const lowerWord = word.toLowerCase();

  return (
    sentences.find((sentence) => sentence.toLowerCase().includes(lowerWord)) ||
    ""
  ).trim();
}

const WORDS_PER_PAGE = 120;

function paginateTokens(tokens: string[]): string[][] {
  const pages: string[][] = [];
  let page: string[] = [];
  let wordCount = 0;

  for (const token of tokens) {
    page.push(token);

    if (/^[a-zA-Z']+$/.test(token)) {
      wordCount++;
    }

    if (wordCount >= WORDS_PER_PAGE) {
      pages.push(page);
      page = [];
      wordCount = 0;
    }
  }

  if (page.length) {
    pages.push(page);
  }

  return pages;
}

type SavedWord = {
  key: string;
  word: string;
  translation: string;
  mastered: boolean;
  addedAt: number;
};

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
};

type UserStateResponse = {
  state: Record<string, unknown> | null;
};

type ReaderAuthUser = {
  id: string;
  name: string;
  email?: string;
  avatar: string | null;
  bio: string;
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

export default function BookReader({ bookId }: { bookId?: string }) {
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
  const [apiError, setApiError] = useState("");
  const [highlightedWord, setHighlightedWord] = useState("");
  const [fromCache, setFromCache] = useState(false);
  const [popup, setPopup] = useState({ visible: false, x: 0, y: 0 });
  const [activeTab, setActiveTab] =
    useState<"meaning" | "grammar" | "phrases">("meaning");

  const [pageIndex, setPageIndex] = useState(0);

  const [vocabOpen, setVocabOpen] = useState(false);
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [toast, setToast] = useState("");
  const [readerStateLoaded, setReaderStateLoaded] = useState(false);

  const bodyRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

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
    setPopup({ visible: false, x: 0, y: 0 });
    setSelectedWord("");
    setHighlightedWord("");
    setWordData(null);
    setApiError("");
    setLoading(false);
  }

  function splitImportedTextIntoOneChapter(text: string, fileName: string) {
    return [
      {
        index: 0,
        title: fileName.replace(/\.txt$/i, "") || "Imported Book",
        text,
      },
    ];
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
    const importedChapters = splitImportedTextIntoOneChapter(
      saved.text,
      saved.name
    );

    setBook({
      id: saved.importedAt,
      title: saved.name.replace(/\.txt$/i, ""),
      authors: "Imported book",
      cover: null,
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
      const currentBooks = raw ? (JSON.parse(raw) as ImportedBookState[]) : [];
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

  function handleBookUpload(event: ChangeEvent<HTMLInputElement>) {
    if (!readerAuthUser) {
      event.target.value = "";
      setLoadError("Ном import хийж уншихын тулд эхлээд бүртгүүлнэ үү.");
      return;
    }

    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["text/plain", "application/octet-stream"];
    const isTxtFile = file.name.toLowerCase().endsWith(".txt");

    if (!isTxtFile && !allowedTypes.includes(file.type)) {
      setLoadError("Одоогоор зөвхөн .txt ном оруулна.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const text = String(reader.result || "");

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
      };

      applyImportedBook(importedBook);
      saveImportedBookToLibrary(importedBook);

      localStorage.setItem(
        "last-imported-book",
        JSON.stringify(importedBook)
      );
      localStorage.setItem("selected-imported-book", JSON.stringify(importedBook));
      void saveUserState("last-imported-book", importedBook);
    };

    reader.onerror = () => {
      setLoadError("Ном унших үед алдаа гарлаа.");
    };

    reader.readAsText(file);
  }

  function loadLastImportedBook() {
    try {
      const raw = localStorage.getItem("last-imported-book");

      if (!raw) {
        setLoadError("Өмнө import хийсэн ном олдсонгүй.");
        return;
      }

      applyImportedBook(JSON.parse(raw) as ImportedBookState);
    } catch {
      setLoadError("Хадгалсан ном уншиж чадсангүй.");
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
    if (!bookId || !readerAuthUser) return;

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

        const data: LoadedBook = await res.json();

        const loadedChapters =
          data.chapters && data.chapters.length > 0
            ? data.chapters
            : [
                {
                  index: 0,
                  title: "Full Book",
                  text: data.text,
                },
              ];

        setBook(data);
        setChapters(loadedChapters);
        setChapterIndex(0);
        setBookText(loadedChapters[0]?.text || data.text || "");
        setPageIndex(0);
        scrollToTop("auto");
      } catch {
        setLoadError("Ном ачаалж чадсангүй.");
      }
    }

    loadBook();
  }, [bookId, readerAuthUser]);

  useEffect(() => {
    if (bookId || !readerAuthUser) return;

    try {
      const raw = localStorage.getItem("selected-imported-book");

      if (!raw) return;

      applyImportedBook(JSON.parse(raw) as ImportedBookState);
    } catch {
      setLoadError("Сонгосон import номыг уншиж чадсангүй.");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, readerAuthUser]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("reader-vocab");

      if (raw) {
        setSavedWords(JSON.parse(raw) as SavedWord[]);
      }
    } catch {
      // ignore
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

        if (Array.isArray(state["reader-vocab"])) {
          setSavedWords(state["reader-vocab"] as SavedWord[]);
          localStorage.setItem(
            "reader-vocab",
            JSON.stringify(state["reader-vocab"])
          );
        }

        const importedBook = state["last-imported-book"];

        if (
          importedBook &&
          typeof importedBook === "object" &&
          "name" in importedBook &&
          "text" in importedBook &&
          "importedAt" in importedBook
        ) {
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

  const allTokens = useMemo(() => splitText(bookText), [bookText]);
  const pages = useMemo(() => paginateTokens(allTokens), [allTokens]);
  const pageTokens = pages[pageIndex] ?? [];

  const masteredCount = savedWords.filter((word) => word.mastered).length;
  const totalSaved = savedWords.length;

  async function handleWordClick(
    event: ReactMouseEvent<HTMLElement>,
    rawWord: string
  ) {
    const clickedWord = cleanWord(rawWord);

    if (!clickedWord) return;

    setHighlightedWord(clickedWord.toLowerCase());
    setSelectedWord(clickedWord);
    setWordData(null);
    setApiError("");
    setLoading(true);
    setActiveTab("meaning");
    setFromCache(false);

    const rect = event.currentTarget.getBoundingClientRect();

    setPopup({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.bottom,
    });

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
        }),
      });

      if (!res.ok) {
        throw new Error("Failed");
      }

      const data = await res.json();

      if (data.from_cache) {
        setFromCache(true);
      }

      setWordData(data);
    } catch {
      setApiError("AI тайлбар авахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  function saveWord(data: WordData) {
    const key = data.word.toLowerCase();

    setSavedWords((prev) => {
      if (prev.some((word) => word.key === key)) {
        setToast(`"${data.word}" аль хэдийн нэмэгдсэн байна`);
        return prev;
      }

      setToast(`✓ "${data.word}" үгийн санд нэмэгдлээ`);

      return [
        {
          key,
          word: data.word,
          translation: data.primary_translation,
          mastered: false,
          addedAt: Date.now(),
        },
        ...prev,
      ];
    });
  }

  function toggleMastered(key: string) {
    setSavedWords((prev) =>
      prev.map((word) =>
        word.key === key ? { ...word, mastered: !word.mastered } : word
      )
    );
  }

  function removeWord(key: string) {
    setSavedWords((prev) => prev.filter((word) => word.key !== key));
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

  function getPopupStyle() {
    const W = typeof window !== "undefined" ? window.innerWidth : 800;
    const H = typeof window !== "undefined" ? window.innerHeight : 700;

    const popupWidth = 390;
    const popupHeight = 430;

    let left = popup.x - popupWidth / 2;
    let top = popup.y + 14;

    if (left < 16) {
      left = 16;
    }

    if (left + popupWidth > W - 16) {
      left = W - popupWidth - 16;
    }

    if (top + popupHeight > H - 16) {
      top = Math.max(16, H - popupHeight - 16);
    }

    return { left, top };
  }

  const hasGrammar = wordData?.is_inflected && wordData.inflection?.form;
  const hasPhrases = (wordData?.phrases?.length ?? 0) > 0;
  const isWordSaved = wordData
    ? savedWords.some((word) => word.key === wordData.word.toLowerCase())
    : false;

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

  if (!readerAuthUser) {
    return <AuthModal onAuth={(user) => setReaderAuthUser(user)} />;
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
          color: #ffffff;
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
          background: #ffe08a;
          color: #7a3410;
          box-shadow: 0 0 0 1px rgba(122, 52, 16, 0.18);
        }

        .word-btn:focus {
          outline: none;
        }

        .word-btn:focus-visible {
          background: #ffe08a;
          color: #7a3410;
          box-shadow: 0 0 0 2px rgba(122, 52, 16, 0.35);
        }

        .word-btn.active {
          background: #ea580c;
          color: #ffffff;
          font-weight: 800;
          box-shadow:
            0 0 0 2px rgba(234, 88, 12, 0.35),
            0 4px 10px rgba(234, 88, 12, 0.25);
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

        .popup {
          font-family: 'DM Sans', sans-serif;
          background: #ffffff;
          color: #111111;
          border: 2px solid #7a3410;
          border-radius: 20px;
          box-shadow:
            0 24px 80px rgba(0, 0, 0, 0.35),
            0 0 0 9999px rgba(0, 0, 0, 0.06);
          animation: popIn 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
          opacity: 1;
        }

        .popup-header {
          padding: 18px 20px 0;
          background: #ffffff;
          color: #111111;
        }

        .popup-body {
          padding: 16px 20px 18px;
          max-height: 340px;
          overflow-y: auto;
          background: #ffffff;
          color: #111111;
        }

        .popup-word {
          font-family: 'Lora', serif;
          font-size: 1.55rem;
          font-weight: 800;
          color: #111111;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .popup-base,
        .popup-ipa {
          font-size: 0.82rem;
          color: #111111;
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
          color: #111111;
          margin-bottom: 5px;
        }

        .primary-trans {
          font-family: 'Lora', serif;
          font-size: 1.35rem;
          font-weight: 800;
          color: #111111;
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

        .grammar-box {
          background: #fef9ec;
          border: 1px solid #f0d88a;
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
          background: #fff7ed;
          border: 1px solid #fed7aa;
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
          background: #fff7ed;
          border: 1px solid #fed7aa;
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
          color: #111111;
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
          padding: 8px 14px;
          border-radius: 100px;
          border: 1.5px solid var(--border);
          background: #fff;
          color: #111111;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s;
          margin-top: 10px;
          width: 100%;
          justify-content: center;
        }

        .save-word-btn:hover:not(.saved) {
          border-color: #16a34a;
          color: #111111;
          background: #f0fdf4;
        }

        .save-word-btn.saved {
          border-color: #86efac;
          color: #111111;
          background: #f0fdf4;
          cursor: default;
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
          background: #f3e7d8;
          border: 1px solid #d4c5a9;
          cursor: pointer;
          color: #111111;
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
          background: rgba(26,22,18,0.45);
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
          background: var(--paper);
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
          color: var(--ink);
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
          color: var(--ink);
          font-family: 'Lora', serif;
        }

        .vocab-stat-label {
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--ink-light);
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
          color: var(--ink);
        }

        .vocab-item-trans {
          font-size: 0.8rem;
          color: var(--ink-light);
          margin-top: 2px;
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
          color: var(--ink-light);
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
            align-items: flex-start;
            flex-direction: column;
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
            padding: 32px 24px 24px;
          }

          .br-pagination {
            padding: 16px 24px 24px;
          }
        }
      `}</style>

      <div className="br-root">
        <div className="br-topbar">
          <div className="br-left">
            <Link href="/" className="br-back-btn">
            ← Library
            </Link>

            <div className="br-book-meta">
              <div className="br-title">📖 {book?.title || "Номын Уншигч"}</div>
              {book?.authors && <div className="br-author">{book.authors}</div>}
            </div>
          </div>

          <div className="br-topbar-right">
            {chapters.length > 1 && (
              <select
                className="chapter-select"
                value={chapterIndex}
                onChange={(e) => goToChapter(Number(e.target.value))}
              >
                {chapters.map((chapter, index) => (
                  <option key={chapter.index} value={index}>
                    {chapter.title}
                  </option>
                ))}
              </select>
            )}

            <label className="br-vocab-btn">
              Ном import
              <input
                type="file"
                accept=".txt,text/plain"
                onChange={handleBookUpload}
                style={{ display: "none" }}
              />
            </label>

            <button className="br-vocab-btn" onClick={loadLastImportedBook}>
              Сүүлд уншсан
            </button>

            <Link className="br-vocab-btn" href="/?view=library">
              Номын сан
            </Link>

            <button className="br-vocab-btn" onClick={() => setVocabOpen(true)}>
              Үгийн сан
              {totalSaved > 0 && (
                <span className="br-vocab-count">{totalSaved}</span>
              )}
            </button>
          </div>
        </div>

        {bookText && (
          <div className="br-progress-bar">
            <div
              className="br-progress-fill"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        )}

        <div className="br-body" ref={bodyRef}>
          {chapters.length > 0 && bookText && (
            <div className="chapter-heading">
              <div className="chapter-kicker">
                Chapter {chapterIndex + 1} / {chapters.length}
              </div>

              <h1 className="chapter-title">
                {chapters[chapterIndex]?.title}
              </h1>
            </div>
          )}

          {bookText ? (
            <div className="br-text">
              {pageTokens.map((part, i) => {
                const isWord = /^[a-zA-Z']+$/.test(part);

                if (!isWord) {
                  return <span key={i}>{part}</span>;
                }

                const key = cleanWord(part).toLowerCase();
                const isActive = key === highlightedWord;
                const savedEntry = savedWords.find((word) => word.key === key);

                return (
                  <span
                    key={i}
                    data-word-btn
                    role="button"
                    tabIndex={0}
                    className={`word-btn${isActive ? " active" : ""}${
                      savedEntry?.mastered
                        ? " mastered"
                        : savedEntry
                          ? " saved"
                          : ""
                    }`}
                    onClick={(e) => handleWordClick(e, part)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleWordClick(
                          e as unknown as ReactMouseEvent<HTMLElement>,
                          part
                        );
                      }
                    }}
                  >
                    {part}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="empty-book-box">
              <div className="empty-book-icon">📚</div>

              <h2 className="empty-book-title">
                {bookId ? "Ном ачаалж байна..." : "Ном import хийгээгүй байна"}
              </h2>

              <p className="empty-book-text">
                {bookId
                  ? "Номын текстийг татаж байна. Түр хүлээнэ үү."
                  : ".txt хэлбэртэй English ном оруулаад үгэн дээр дарж AI тайлбар, орчуулга, жишээ өгүүлбэр харна."}
              </p>

              {loadError && <p className="empty-book-error">{loadError}</p>}

              {!bookId && (
                <div className="empty-book-actions">
                  <label className="import-main-btn">
                    .txt ном сонгох
                    <input
                      type="file"
                      accept=".txt,text/plain"
                      onChange={handleBookUpload}
                      style={{ display: "none" }}
                    />
                  </label>

                  <Link className="import-main-btn" href="/?view=library">
                    Номын сангаас сонгох
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
              ← Өмнөх
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
              Дараах →
            </button>
          </div>
        )}
      </div>

      {popup.visible && (
        <div
          ref={popupRef}
          className="popup"
          style={{
            position: "fixed",
            width: 390,
            zIndex: 9999,
            ...getPopupStyle(),
          }}
        >
          <button className="close-btn" onClick={closePopup}>
            ×
          </button>

          {loading ? (
            <div style={{ padding: "20px 18px 22px" }}>
              <p className="popup-word">{selectedWord}</p>

              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div className="loading-dots">
                  <span />
                  <span />
                  <span />
                </div>

                <span style={{ fontSize: "0.8rem", color: "#111111" }}>
                  Тайлбарлаж байна...
                </span>
              </div>
            </div>
          ) : apiError ? (
            <div style={{ padding: "20px 18px" }}>
              <p style={{ fontSize: "0.85rem", color: "#c0392b" }}>
                {apiError}
              </p>
            </div>
          ) : wordData ? (
            <>
              <div className="popup-header">
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    paddingRight: 32,
                  }}
                >
                  <div>
                    <p className="popup-word">{wordData.word}</p>

                    {wordData.base_form &&
                      wordData.base_form !== wordData.word && (
                        <p className="popup-base">← {wordData.base_form}</p>
                      )}

                    {wordData.pronunciation && (
                      <p className="popup-ipa">/{wordData.pronunciation}/</p>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 4,
                      marginTop: 2,
                    }}
                  >
                    <span className="badge badge-type">
                      {wordData.word_type}
                    </span>

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

                    {fromCache && (
                      <span className="badge badge-cache">⚡ cached</span>
                    )}
                  </div>
                </div>

                <button
                  className={`save-word-btn${isWordSaved ? " saved" : ""}`}
                  onClick={() => !isWordSaved && saveWord(wordData)}
                >
                  {isWordSaved
                    ? "✓ Үгийн санд нэмэгдсэн"
                    : "+ Үгийн санд нэмэх"}
                </button>

                <div className="tabs">
                  <button
                    className={`tab-btn${
                      activeTab === "meaning" ? " active" : ""
                    }`}
                    onClick={() => setActiveTab("meaning")}
                  >
                    Орчуулга
                  </button>

                  <button
                    className={`tab-btn${
                      activeTab === "grammar" ? " active" : ""
                    }`}
                    onClick={() => setActiveTab("grammar")}
                    style={{ opacity: hasGrammar ? 1 : 0.45 }}
                  >
                    Дүрэм
                    {hasGrammar && <span className="tab-badge" />}
                  </button>

                  <button
                    className={`tab-btn${
                      activeTab === "phrases" ? " active" : ""
                    }`}
                    onClick={() => setActiveTab("phrases")}
                    style={{ opacity: hasPhrases ? 1 : 0.45 }}
                  >
                    Хэллэг
                    {hasPhrases && <span className="tab-badge" />}
                  </button>
                </div>
              </div>

              <div className="popup-body">
                {activeTab === "meaning" && (
                  <>
                    <div className="section">
                      <p className="label">Үндсэн орчуулга</p>

                      <p className="primary-trans">
                        {wordData.primary_translation}
                      </p>
                    </div>

                    {(wordData.all_translations?.length ?? 0) > 1 && (
                      <div className="section">
                        <p className="label">Бүх орчуулга</p>

                        <div style={{ marginTop: 4 }}>
                          {wordData.all_translations.map(
                            (
                              translation: {
                                mongolian: ReactNode;
                                english_sense: ReactNode;
                                usage_context: ReactNode;
                              },
                              index: Key | null | undefined
                            ) => (
                              <div key={index} className="trans-row">
                                <span className="trans-mn">
                                  {translation.mongolian}
                                </span>

                                <span className="trans-en">
                                  {translation.english_sense}
                                </span>

                                {translation.usage_context && (
                                  <span className="trans-ctx">
                                    {translation.usage_context}
                                  </span>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    <hr className="divider" />

                    <div className="section">
                      <p className="label">Монгол тайлбар</p>

                      <p
                        style={{
                          fontSize: "0.88rem",
                          color: "#111111",
                          lineHeight: 1.6,
                        }}
                      >
                        {wordData.mongolian_explanation}
                      </p>
                    </div>

                    <div className="example-box">
                      <p className="example-en">
                        &quot;{wordData.example_sentence_en}&quot;
                      </p>

                      <p className="example-mn">
                        {wordData.example_sentence_mn}
                      </p>
                    </div>
                  </>
                )}

                {activeTab === "grammar" &&
                  (hasGrammar ? (
                    <>
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

                      <div className="section">
                        <p className="label">English Meaning</p>

                        <p
                          style={{
                            fontSize: "0.88rem",
                            color: "#111111",
                            lineHeight: 1.6,
                          }}
                        >
                          {wordData.simple_english_meaning}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "24px 0",
                        color: "#111111",
                      }}
                    >
                      <p style={{ fontSize: "1.5rem", marginBottom: 8 }}>
                        📖
                      </p>

                      <p style={{ fontSize: "0.85rem" }}>
                        <strong>{wordData.word}</strong> нь хувираагүй үндсэн
                        хэлбэр юм.
                      </p>
                    </div>
                  ))}

                {activeTab === "phrases" &&
                  (hasPhrases ? (
                    wordData.phrases.map(
                      (
                        phrase: {
                          phrase: ReactNode;
                          translation: ReactNode;
                          example_en: ReactNode;
                          example_mn: ReactNode;
                        },
                        index: Key | null | undefined
                      ) => (
                        <div key={index} className="phrase-card">
                          <p className="phrase-text">{phrase.phrase}</p>
                          <p className="phrase-trans">
                            {phrase.translation}
                          </p>
                          <p className="phrase-ex-en">
                            &quot;{phrase.example_en}&quot;
                          </p>
                          <p className="phrase-ex-mn">
                            {phrase.example_mn}
                          </p>
                        </div>
                      )
                    )
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "24px 0",
                        color: "#111111",
                      }}
                    >
                      <p style={{ fontSize: "1.5rem", marginBottom: 8 }}>
                        🔍
                      </p>

                      <p style={{ fontSize: "0.85rem" }}>Хэллэг олдсонгүй.</p>
                    </div>
                  ))}
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
                savedWords.map((word) => (
                  <div
                    key={word.key}
                    className={`vocab-item${
                      word.mastered ? " mastered" : ""
                    }`}
                  >
                    <button
                      className={`vocab-check-btn${
                        word.mastered ? " mastered" : ""
                      }`}
                      onClick={() => toggleMastered(word.key)}
                      title={
                        word.mastered
                          ? "Цээжилсэн болсон"
                          : "Цээжилсэн тэмдэглэх"
                      }
                    >
                      {word.mastered ? "✓" : "○"}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="vocab-item-word">{word.word}</div>
                      <div className="vocab-item-trans">
                        {word.translation}
                      </div>
                    </div>

                    <button
                      className="vocab-remove-btn"
                      onClick={() => removeWord(word.key)}
                      title="Устгах"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {toast && <div className="br-toast">{toast}</div>}
    </>
  );
}

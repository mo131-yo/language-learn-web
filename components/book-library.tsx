"use client";

import Link from "next/link";
import { ChangeEvent, CSSProperties, useEffect, useRef, useState } from "react";
import { parseBookFile } from "@/lib/parseBook";

type Book = {
  id: number;
  title: string;
  authors: string;
  cover: string | null;
  downloadCount: number;
  category: string;
  subjects: string[];
};

type ImportedBook = {
  id: string;
  name: string;
  text: string;
  importedAt: number;
};

type UserStateResponse = {
  state: Record<string, unknown> | null;
};

function isImportedBook(value: unknown): value is ImportedBook {
  if (!value || typeof value !== "object") return false;

  const book = value as Partial<ImportedBook>;
  return (
    typeof book.id === "string" &&
    typeof book.name === "string" &&
    typeof book.text === "string" &&
    typeof book.importedAt === "number"
  );
}

function getImportedBooks(value: unknown) {
  return Array.isArray(value) ? value.filter(isImportedBook) : [];
}

function getDisplayBookName(name: string) {
  return (
    name
      .replace(/\.(txt|pdf|epub|docx)$/i, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Imported book"
  );
}

function getBookWordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

function getBookCoverTheme(seed: string) {
  const palettes = [
    ["#31513f", "#83a05f", "#f7d99b"],
    ["#6d2f2f", "#c86f4a", "#ffe0b5"],
    ["#253957", "#5b7cb2", "#d9e7ff"],
    ["#4f3a67", "#9b7cc0", "#f4dcff"],
    ["#2d5a5a", "#56a4a0", "#d6fff6"],
    ["#5a432b", "#b07a3f", "#ffe2ab"],
    ["#223b2f", "#2f7d54", "#d8f3dc"],
    ["#5b3148", "#d0799f", "#ffe0ee"],
  ];

  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const palette = palettes[hash % palettes.length];
  const pattern = hash % 4;

  return {
    "--cover-start": palette[0],
    "--cover-end": palette[1],
    "--cover-accent": palette[2],
    "--cover-pattern": String(pattern),
  } as CSSProperties;
}

function getImportedBookProgress() {
  return 0;
}

function BookProgress({ progress }: { progress: number }) {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="shelf-progress" aria-label={`Уншсан явц ${safeProgress}%`}>
      <div className="shelf-progress-top">
        <span>Уншсан</span>
        <strong>{safeProgress}%</strong>
      </div>
      <div className="shelf-progress-track">
        <div
          className="shelf-progress-fill"
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
}

function ImportedBookCover({ book }: { book: ImportedBook }) {
  const title = getDisplayBookName(book.name);
  const themeStyle = getBookCoverTheme(`${book.id}-${title}`);
  const titleParts = title.split(/\s+/).filter(Boolean).slice(0, 4);

  return (
    <div className="generated-book-cover" style={themeStyle}>
      <div className="cover-shine" />
      <div className="cover-spine" />
      <div className="cover-mark">{title.charAt(0).toUpperCase()}</div>
      <div className="cover-title">{titleParts.join(" ") || title}</div>
      <div className="cover-author">Тодорхойгүй зохиогч</div>
    </div>
  );
}

function AddBookCard({
  importingBook,
  onClick,
}: {
  importingBook: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="shelf-book-card add-book-card"
      onClick={onClick}
      disabled={importingBook}
    >
      <div className="add-book-cover">
        <span className="add-book-plus">＋</span>
        <span className="add-book-label">Ном нэмэх</span>
        <span className="add-book-sub">PDF, EPUB, TXT</span>
      </div>
      <div className="shelf-book-info">
        <h3 className="shelf-book-title">
          {importingBook ? "Уншиж байна..." : "Ном нэмэх"}
        </h3>
        <p className="shelf-book-author">Файлаас import хийх</p>
      </div>
    </button>
  );
}

function ImportedBookCard({
  book,
  onOpen,
}: {
  book: ImportedBook;
  onOpen: (book: ImportedBook) => void;
}) {
  const title = getDisplayBookName(book.name);
  const progress = getImportedBookProgress();

  return (
    <button
      type="button"
      className="shelf-book-card"
      onClick={() => onOpen(book)}
    >
      <ImportedBookCover book={book} />
      <div className="shelf-book-info">
        <h3 className="shelf-book-title">{title}</h3>
        <p className="shelf-book-author">Тодорхойгүй зохиогч</p>
        <BookProgress progress={progress} />
        <p className="shelf-book-meta">
          {getBookWordCount(book.text).toLocaleString()} үг
        </p>
      </div>
    </button>
  );
}

const TOPICS = [
  { label: "All", value: "all", icon: "✦" },
  { label: "Fiction", value: "fiction", icon: "📚" },
  { label: "Adventure", value: "adventure", icon: "🗺️" },
  { label: "Children", value: "children", icon: "🧒" },
  { label: "Detective", value: "detective", icon: "🔎" },
  { label: "Mystery", value: "mystery", icon: "🕯️" },
  { label: "Romance", value: "romance", icon: "♡" },
  { label: "Sci-Fi", value: "science fiction", icon: "🚀" },
  { label: "Fantasy", value: "fantasy", icon: "🐉" },
  { label: "Gothic", value: "gothic", icon: "🦇" },
  { label: "History", value: "history", icon: "🏛️" },
  { label: "Poetry", value: "poetry", icon: "✍️" },
  { label: "Drama", value: "drama", icon: "🎭" },
  { label: "Philosophy", value: "philosophy", icon: "💭" },
  { label: "Christmas", value: "christmas", icon: "🎄" },
  { label: "Sea", value: "sea stories", icon: "🌊" },
  { label: "War", value: "war", icon: "⚔️" },
  { label: "Western", value: "western", icon: "🤠" },
];

const QUICK_SEARCHES = [
  "Alice",
  "Sherlock Holmes",
  "Pride and Prejudice",
  "Frankenstein",
  "Dracula",
  "Moby Dick",
  "Jane Eyre",
  "The Time Machine",
  "Treasure Island",
  "Peter Pan",
  "Oliver Twist",
  "Little Women",
  "Great Expectations",
  "The Secret Garden",
  "Anne of Green Gables",
  "A Christmas Carol",
  "The Jungle Book",
  "Around the World in Eighty Days",
];

type BookLibraryProps = {
  onReadBook?: (bookId: number) => boolean;
  onReadImportedBook?: () => boolean;
  onImportBook?: () => boolean;
};

export default function BookLibrary({
  onReadBook,
  onReadImportedBook,
  onImportBook,
}: BookLibraryProps = {}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [importedBooks, setImportedBooks] = useState<ImportedBook[]>([]);
  const [search, setSearch] = useState<string>("");
  const [activeSearch, setActiveSearch] = useState<string>("");
  const [topic, setTopic] = useState<string>("fiction");
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [importError, setImportError] = useState<string>("");
  const [importingBook, setImportingBook] = useState<boolean>(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  function saveImportedBooks(nextBooks: ImportedBook[]) {
    localStorage.setItem("imported-books", JSON.stringify(nextBooks));

    fetch("/api/user-state", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key: "imported-books", value: nextBooks }),
    }).catch(() => {
      // Browser storage remains the fallback.
    });
  }

  function openImportedBook(book: ImportedBook) {
    if (onReadImportedBook && !onReadImportedBook()) return;

    localStorage.setItem("selected-imported-book", JSON.stringify(book));
    localStorage.setItem("last-imported-book", JSON.stringify(book));
    window.location.href = `/?view=reader&importedBookId=${encodeURIComponent(book.id)}`;
  }

  function requestImportFile() {
    if (onImportBook && !onImportBook()) return;
    setImportError("");
    importInputRef.current?.click();
  }

  async function handleImportBook(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setImportError("");
    setImportingBook(true);

    try {
      const text = await parseBookFile(file);

      if (!text.trim()) {
        setImportError("Файл хоосон байна.");
        return;
      }

      const importedBook: ImportedBook = {
        id: `imported-${Date.now()}`,
        name: file.name,
        text,
        importedAt: Date.now(),
      };

      setImportedBooks((prev) => {
        const nextBooks = [
          importedBook,
          ...prev.filter((book) => book.name !== importedBook.name),
        ];
        saveImportedBooks(nextBooks);
        return nextBooks;
      });

      openImportedBook(importedBook);
    } catch {
      setImportError("Файл уншихад алдаа гарлаа. Өөр файл оруулна уу.");
    } finally {
      setImportingBook(false);
    }
  }

  async function loadBooks(options?: {
    query?: string;
    topicValue?: string;
    pageValue?: number;
    append?: boolean;
  }) {
    const query = options?.query ?? activeSearch ?? "";
    const topicValue = options?.topicValue ?? topic ?? "fiction";
    const pageValue = options?.pageValue ?? page ?? 1;
    const append = options?.append ?? false;

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      setError("");

      const params = new URLSearchParams();
      params.set("page", String(pageValue));
      params.set("pages", "3");

      if (query.trim()) {
        params.set("search", query.trim());
      } else {
        params.set("topic", topicValue);
      }

      const res = await fetch(`/api/books?${params.toString()}`);

      if (!res.ok) {
        throw new Error("Failed to load books");
      }

      const data = await res.json();

      setBooks((prev) => {
        const incoming: Book[] = Array.isArray(data.books) ? data.books : [];

        if (!append) {
          return incoming;
        }

        const existingIds = new Set(prev.map((book) => book.id));
        const newBooks = incoming.filter((book) => !existingIds.has(book.id));

        return [...prev, ...newBooks];
      });

      setPage(data.nextPage || pageValue + 3);
      setHasMore(Boolean(data.hasMore));
    } catch {
      setError("Номын жагсаалт ачаалж чадсангүй.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadBooks({
      query: "",
      topicValue: "fiction",
      pageValue: 1,
      append: false,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("imported-books");
      if (raw) {
        setImportedBooks(getImportedBooks(JSON.parse(raw)));
      }
    } catch {
      // ignore
    }

    fetch("/api/user-state?key=imported-books")
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as UserStateResponse;
      })
      .then((data) => {
        const imported = data?.state?.["imported-books"];

        const safeImportedBooks = getImportedBooks(imported);

        if (safeImportedBooks.length > 0 || Array.isArray(imported)) {
          setImportedBooks(safeImportedBooks);
          localStorage.setItem("imported-books", JSON.stringify(safeImportedBooks));
        }
      })
      .catch(() => {
        // Local imported books still work while logged out/offline.
      });
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const query = (search ?? "").trim();

    setActiveSearch(query);
    setPage(1);

    loadBooks({
      query,
      topicValue: topic,
      pageValue: 1,
      append: false,
    });
  }

  function handleTopicChange(nextTopic: string) {
    const safeTopic = nextTopic || "fiction";

    setTopic(safeTopic);
    setActiveSearch("");
    setSearch("");
    setPage(1);

    loadBooks({
      query: "",
      topicValue: safeTopic,
      pageValue: 1,
      append: false,
    });
  }

  function handleQuickSearch(query: string) {
    const safeQuery = query ?? "";

    setSearch(safeQuery);
    setActiveSearch(safeQuery);
    setPage(1);

    loadBooks({
      query: safeQuery,
      topicValue: topic,
      pageValue: 1,
      append: false,
    });
  }

  function loadMoreBooks() {
    loadBooks({
      query: activeSearch ?? "",
      topicValue: topic ?? "fiction",
      pageValue: page,
      append: true,
    });
  }

  const currentTopicLabel =
    TOPICS.find((item) => item.value === topic)?.label || "Books";
  const continueBook = importedBooks[0] ?? null;
  const hasDiscoveryResults = books.length > 0 && !loading && !error;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');

        .lib-root *,
        .lib-root *::before,
        .lib-root *::after {
          box-sizing: border-box;
        }

        .lib-root {
          min-height: 100vh;
          background: #0a0908;
          color: #f0ebe2;
          font-family: 'DM Sans', sans-serif;
        }

        .lib-hero {
          position: relative;
          overflow: hidden;
          padding: 48px 0 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }

        .lib-hero-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 15% 0%, rgba(180,100,30,0.28) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 85% 0%, rgba(245,178,51,0.12) 0%, transparent 55%),
            radial-gradient(ellipse 100% 80% at 50% 100%, rgba(10,9,8,0.9) 0%, transparent 70%);
          pointer-events: none;
        }

        .lib-hero-noise {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.6;
        }

        .lib-hero-inner {
          position: relative;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 28px 40px;
        }

        .lib-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #f0b429;
          margin-bottom: 18px;
          padding: 6px 14px;
          border: 1px solid rgba(240,180,41,0.25);
          border-radius: 100px;
          background: rgba(240,180,41,0.06);
        }

        .lib-eyebrow::before {
          content: '';
          width: 6px;
          height: 6px;
          background: #f0b429;
          border-radius: 50%;
        }

        .lib-headline {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.4rem, 6vw, 4.2rem);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: #f5f0e8;
          margin: 0 0 10px;
          max-width: 760px;
        }

        .lib-headline em {
          font-style: italic;
          color: #f0b429;
        }

        .lib-subline {
          font-size: 0.95rem;
          color: rgba(240,235,226,0.5);
          margin-bottom: 32px;
          max-width: 540px;
          line-height: 1.65;
          font-weight: 400;
        }

        .lib-search-form {
          display: block;
          width: 100%;
          max-width: 620px;
        }

        .lib-search-wrap {
          display: flex;
          align-items: center;
          width: 100%;
          background: rgba(255,255,255,0.07);
          border: 1.5px solid rgba(255,255,255,0.14);
          border-radius: 16px;
          padding: 5px 5px 5px 14px;
          transition: border-color 0.2s, background 0.2s;
        }

        .lib-search-wrap:focus-within {
          border-color: rgba(240,180,41,0.55);
          background: rgba(255,255,255,0.1);
        }

        .lib-search-icon {
          display: flex;
          align-items: center;
          color: rgba(240,235,226,0.4);
          font-size: 1.05rem;
          flex-shrink: 0;
          margin-right: 8px;
        }

        .lib-search-input {
          flex: 1 1 0%;
          min-width: 0;
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.92rem;
          font-weight: 500;
          color: #f5f0e8;
          padding: 10px 8px 10px 0;
        }

        .lib-search-input::placeholder {
          color: rgba(240,235,226,0.3);
        }

        .lib-search-btn {
          flex-shrink: 0;
          padding: 11px 22px;
          border-radius: 11px;
          background: #f0b429;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.84rem;
          font-weight: 800;
          color: #1a0f00;
          cursor: pointer;
          transition: background 0.15s, transform 0.12s;
          white-space: nowrap;
        }

        .lib-search-btn:hover {
          background: #f7c752;
          transform: scale(1.02);
        }

        .lib-quick {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          gap: 8px;
          overflow-x: auto;
          overflow-y: visible;
          padding: 16px 0 4px;
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
        }

        .lib-quick::-webkit-scrollbar {
          display: none;
        }

        .lib-quick-btn {
          flex-shrink: 0;
          padding: 7px 14px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: rgba(240,235,226,0.6);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .lib-quick-btn:hover {
          border-color: rgba(240,180,41,0.5);
          background: rgba(240,180,41,0.08);
          color: #f0b429;
        }

        .lib-body {
          max-width: 1200px;
          margin: 0 auto;
          padding: 36px 28px 64px;
        }

        .lib-filters {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          gap: 8px;
          overflow-x: auto;
          overflow-y: visible;
          padding-bottom: 6px;
          margin-bottom: 36px;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .lib-filters::-webkit-scrollbar {
          display: none;
        }

        .lib-filter-btn {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(240,235,226,0.55);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s;
          white-space: nowrap;
        }

        .lib-filter-btn:hover {
          border-color: rgba(240,180,41,0.4);
          background: rgba(240,180,41,0.06);
          color: rgba(240,235,226,0.9);
        }

        .lib-filter-btn.active {
          border-color: #f0b429;
          background: rgba(240,180,41,0.15);
          color: #f0b429;
        }

        .lib-filter-icon {
          font-size: 0.88rem;
        }

        .lib-section-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .lib-section-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.9rem;
          font-weight: 800;
          color: #f5f0e8;
          letter-spacing: -0.02em;
          line-height: 1.15;
          margin: 0;
        }

        .lib-section-count {
          font-size: 0.82rem;
          color: rgba(240,235,226,0.4);
          font-weight: 500;
          margin-top: 4px;
        }

        .lib-more-top-btn {
          flex-shrink: 0;
          padding: 9px 20px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: rgba(240,235,226,0.6);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }

        .lib-more-top-btn:hover:not(:disabled) {
          border-color: rgba(240,180,41,0.5);
          color: #f0b429;
        }

        .lib-more-top-btn:disabled {
          opacity: 0.35;
          cursor: default;
        }

        .lib-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 28px 24px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .lib-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 24px 18px;
          }
        }

        @media (max-width: 560px) {
          .lib-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .lib-body {
            padding: 28px 18px 48px;
          }

          .lib-hero-inner {
            padding: 0 18px 32px;
          }

          .lib-search-wrap {
            padding-left: 12px;
          }

          .lib-search-btn {
            padding: 11px 15px;
          }
        }

        .book-card {
          display: block;
          text-decoration: none;
          color: inherit;
          position: relative;
          min-width: 0;
        }

        .book-card-cover-wrap {
          position: relative;
          aspect-ratio: 2 / 3;
          border-radius: 14px;
          overflow: hidden;
          background: #1c1810;
          box-shadow: 0 4px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05) inset;
          transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.28s ease;
        }

        .book-card:hover .book-card-cover-wrap {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(240,180,41,0.25);
        }

        .book-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }

        .book-card:hover .book-card-img {
          transform: scale(1.05);
        }

        .book-card-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, #221a10, #120e08);
        }

        .book-card-placeholder-letter {
          font-family: 'Playfair Display', serif;
          font-size: 3.5rem;
          font-weight: 900;
          color: rgba(240,180,41,0.2);
          line-height: 1;
        }

        .book-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, transparent 100%);
          opacity: 0;
          transition: opacity 0.25s;
          display: flex;
          align-items: flex-end;
          padding: 18px;
        }

        .book-card:hover .book-card-overlay {
          opacity: 1;
        }

        .book-card-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #f0b429;
          color: #1a0f00;
          border-radius: 100px;
          font-size: 0.78rem;
          font-weight: 900;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.03em;
          transform: translateY(6px);
          transition: transform 0.2s ease 0.05s;
        }

        .book-card:hover .book-card-cta {
          transform: translateY(0);
        }

        .book-card-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          padding: 4px 11px;
          background: rgba(0,0,0,0.72);
          backdrop-filter: blur(6px);
          border-radius: 100px;
          font-size: 0.64rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #f0b429;
          border: 1px solid rgba(240,180,41,0.2);
        }

        .book-card-info {
          padding: 14px 2px 0;
        }

        .book-card-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.08rem;
          font-weight: 800;
          color: #f5f0e8;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;    
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin: 0 0 5px;
          transition: color 0.15s;
        }

        .book-card:hover .book-card-title {
          color: #f0b429;
        }

        .book-card-author {
          font-size: 0.78rem;
          font-weight: 500;
          color: rgba(240,235,226,0.45);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0 0 8px;
        }

        .book-card-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .book-card-reads {
          font-size: 0.7rem;
          font-weight: 700;
          color: rgba(240,235,226,0.35);
          background: rgba(255,255,255,0.05);
          border-radius: 100px;
          padding: 3px 10px;
        }

        .skeleton-card {
          animation: pulse 1.6s ease-in-out infinite;
        }

        .skeleton-cover {
          aspect-ratio: 2/3;
          border-radius: 14px;
          background: linear-gradient(90deg, #1c1810 25%, #252015 50%, #1c1810 75%);
          background-size: 200% 100%;
        }

        .skeleton-line {
          border-radius: 6px;
          background: linear-gradient(90deg, #1c1810 25%, #252015 50%, #1c1810 75%);
          background-size: 200% 100%;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.65;
          }
          50% {
            opacity: 1;
          }
        }

        .lib-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 80px 24px;
          border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 24px;
          background: rgba(255,255,255,0.02);
        }

        .lib-empty-icon {
          font-size: 3.5rem;
          margin-bottom: 16px;
        }

        .lib-empty-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 800;
          color: #f5f0e8;
          margin-bottom: 8px;
        }

        .lib-empty-text {
          font-size: 0.88rem;
          color: rgba(240,235,226,0.4);
          line-height: 1.65;
        }

        .lib-error {
          grid-column: 1 / -1;
          padding: 18px 22px;
          border-radius: 14px;
          border: 1px solid rgba(220,50,50,0.3);
          background: rgba(220,50,50,0.08);
          color: #fca5a5;
          font-size: 0.88rem;
        }

        .lib-load-more {
          margin-top: 52px;
          text-align: center;
        }

        .lib-load-more-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 36px;
          border-radius: 16px;
          border: 1px solid rgba(240,180,41,0.3);
          background: rgba(240,180,41,0.08);
          color: #f0b429;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }

        .lib-load-more-btn:hover:not(:disabled) {
          background: rgba(240,180,41,0.16);
          border-color: rgba(240,180,41,0.6);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(240,180,41,0.15);
        }

        .lib-load-more-btn:disabled {
          opacity: 0.4;
          cursor: default;
        }

        .lib-load-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(240,180,41,0.3);
          border-top-color: #f0b429;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .my-books-band {
          margin-bottom: 34px;
          padding: 22px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          background:
            linear-gradient(135deg, rgba(240,180,41,0.12), rgba(99,102,241,0.08)),
            rgba(255,255,255,0.04);
          box-shadow: 0 18px 60px rgba(0,0,0,0.18);
        }

        .my-books-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .my-books-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.45rem, 3vw, 2rem);
          font-weight: 900;
          color: #fff9e8;
          letter-spacing: -0.02em;
        }

        .my-books-sub {
          margin-top: 3px;
          color: rgba(255,255,255,0.62);
          font-size: 0.92rem;
        }

        .import-book-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: auto;
          padding: 10px 16px;
          border: 1px solid rgba(240,180,41,0.36);
          border-radius: 999px;
          background: linear-gradient(135deg, #f0b429, #f59e0b);
          color: #1c1202;
          font-weight: 900;
          font-size: 0.9rem;
          box-shadow: 0 12px 28px rgba(240,180,41,0.2);
        }

        .my-books-row {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 14px;
        }

        .my-book-card {
          min-height: 190px;
          padding: 16px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 18px;
          background:
            radial-gradient(circle at top right, rgba(240,180,41,0.18), transparent 48%),
            rgba(11, 18, 32, 0.82);
          color: #ffffff;
          text-align: left;
          box-shadow: 0 12px 32px rgba(0,0,0,0.18);
          transition: transform 0.16s, border-color 0.16s, box-shadow 0.16s;
        }

        .my-book-card:hover {
          transform: translateY(-3px);
          border-color: rgba(240,180,41,0.45);
          box-shadow: 0 18px 44px rgba(0,0,0,0.26);
        }

        .my-book-icon {
          width: 46px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
          border-radius: 12px;
          background: linear-gradient(135deg, #f0b429, #6366f1);
          font-size: 1.4rem;
        }

        .my-book-name {
          color: #fff9e8;
          font-weight: 900;
          line-height: 1.25;
          font-size: 1rem;
        }

        .my-book-meta {
          margin-top: 8px;
          color: rgba(255,255,255,0.58);
          font-size: 0.78rem;
          line-height: 1.5;
        }

        .my-books-empty {
          padding: 18px;
          border: 1px dashed rgba(255,255,255,0.16);
          border-radius: 18px;
          color: rgba(255,255,255,0.58);
          font-size: 0.92rem;
          line-height: 1.6;
        }

        .lib-root {
          min-height: auto;
          background: transparent;
          color: #172033;
          font-family: 'Nunito', 'Segoe UI', sans-serif;
        }

        .lib-hero {
          overflow: visible;
          padding: 0;
          border-bottom: 0;
        }

        .lib-hero-bg,
        .lib-hero-noise {
          display: none;
        }

        .lib-hero-inner,
        .lib-body {
          max-width: none;
          width: 100%;
          margin: 0;
        }

        .lib-hero-inner {
          padding: 24px;
          border: 2px solid rgba(34, 197, 94, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(34, 197, 94, 0.16), transparent 34%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(240, 253, 244, 0.9));
          box-shadow: 0 18px 48px rgba(16, 185, 129, 0.11);
        }

        .lib-eyebrow {
          margin-bottom: 12px;
          padding: 7px 12px;
          border: 1px solid rgba(34, 197, 94, 0.2);
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
        }

        .lib-eyebrow::before {
          background: #16a34a;
        }

        .lib-headline,
        .lib-section-title,
        .my-books-title,
        .book-card-title,
        .lib-empty-title {
          font-family: 'Nunito', 'Segoe UI', sans-serif;
          letter-spacing: 0;
        }

        .lib-headline {
          max-width: 720px;
          margin-bottom: 10px;
          color: #111827;
          font-size: clamp(2rem, 4vw, 3.7rem);
          line-height: 1.02;
        }

        .lib-headline em {
          color: #16a34a;
          font-style: normal;
        }

        .lib-subline {
          max-width: 620px;
          margin-bottom: 22px;
          color: #64748b;
          font-size: 1rem;
          font-weight: 700;
        }

        .lib-search-form {
          max-width: 720px;
        }

        .lib-search-wrap {
          min-height: 54px;
          padding: 6px 8px 6px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
        }

        .lib-search-wrap:focus-within {
          border-color: #22c55e;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.14);
        }

        .lib-search-icon {
          color: #94a3b8;
        }

        .lib-search-input {
          color: #111827;
          font-family: 'Nunito', 'Segoe UI', sans-serif;
          font-size: 0.98rem;
          font-weight: 800;
        }

        .lib-search-input::placeholder {
          color: #94a3b8;
        }

        .lib-quick {
          padding-top: 14px;
        }

        .lib-quick-btn,
        .lib-filter-btn,
        .lib-more-top-btn {
          border: 1px solid #e5e7eb;
          background: rgba(255, 255, 255, 0.9);
          color: #475569;
          font-family: 'Nunito', 'Segoe UI', sans-serif;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
        }

        .lib-quick-btn:hover,
        .lib-filter-btn:hover,
        .lib-more-top-btn:hover:not(:disabled) {
          border-color: rgba(34, 197, 94, 0.35);
          background: #f0fdf4;
          color: #15803d;
        }

        .lib-filter-btn.active {
          border-color: rgba(34, 197, 94, 0.55);
          background: #dcfce7;
          color: #15803d;
          box-shadow: 0 10px 26px rgba(34, 197, 94, 0.16);
        }

        .lib-body {
          padding: 20px 0 96px;
        }

        .my-books-band {
          margin-bottom: 22px;
          padding: 22px;
          border: 2px solid rgba(251, 191, 36, 0.22);
          border-radius: 24px;
          background:
            radial-gradient(circle at top right, rgba(251, 191, 36, 0.16), transparent 32%),
            linear-gradient(135deg, #ffffff, #fffbeb);
          box-shadow: 0 16px 42px rgba(245, 158, 11, 0.1);
        }

        .my-books-title {
          color: #111827;
          font-size: clamp(1.35rem, 2.5vw, 2rem);
        }

        .my-books-sub,
        .my-books-empty,
        .my-book-meta,
        .lib-section-count,
        .book-card-author,
        .lib-empty-text {
          color: #64748b;
        }

        .import-book-btn {
          border: 0;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #111827;
          font-family: 'Nunito', 'Segoe UI', sans-serif;
          box-shadow: 0 12px 28px rgba(245, 158, 11, 0.22);
          cursor: pointer;
        }

        .my-books-row {
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
        }

        .my-book-card {
          min-height: 168px;
          border: 2px solid rgba(34, 197, 94, 0.14);
          background: #ffffff;
          color: #111827;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
          cursor: pointer;
        }

        .my-book-card:hover {
          border-color: rgba(34, 197, 94, 0.36);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
        }

        .my-book-icon {
          background: linear-gradient(135deg, #22c55e, #fbbf24);
        }

        .my-book-name {
          color: #111827;
        }

        .my-books-empty {
          border-color: rgba(148, 163, 184, 0.32);
          background: rgba(255, 255, 255, 0.62);
        }

        .lib-filters {
          margin-bottom: 24px;
          padding: 2px 0 8px;
        }

        .lib-section-title {
          color: #111827;
          font-size: 1.7rem;
        }

        .lib-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
        }

        .book-card {
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
          transition: transform 0.16s, border-color 0.16s, box-shadow 0.16s;
        }

        .book-card:hover {
          transform: translateY(-3px);
          border-color: rgba(34, 197, 94, 0.36);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
        }

        .book-card-cover-wrap {
          border-radius: 16px;
          background: #ecfdf5;
          box-shadow: none;
        }

        .book-card:hover .book-card-cover-wrap {
          transform: none;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.14);
        }

        .book-card-placeholder {
          background: linear-gradient(135deg, #dcfce7, #fef3c7);
        }

        .book-card-placeholder-letter {
          font-family: 'Nunito', 'Segoe UI', sans-serif;
          color: rgba(22, 163, 74, 0.28);
        }

        .book-card-title {
          color: #111827;
          font-size: 1rem;
        }

        .book-card:hover .book-card-title {
          color: #15803d;
        }

        .book-card-info {
          padding: 12px 2px 2px;
        }

        .book-card-reads {
          background: #f1f5f9;
          color: #64748b;
        }

        .book-card-badge {
          background: rgba(255, 255, 255, 0.86);
          color: #15803d;
          border-color: rgba(34, 197, 94, 0.22);
        }

        .book-card-overlay {
          background: linear-gradient(to top, rgba(15, 23, 42, 0.72), transparent 65%);
        }

        .book-card-cta,
        .lib-load-more-btn {
          background: #22c55e;
          color: #ffffff;
          border: 0;
          font-family: 'Nunito', 'Segoe UI', sans-serif;
        }

        .lib-load-more-btn:hover:not(:disabled) {
          background: #16a34a;
          border-color: transparent;
          box-shadow: 0 12px 28px rgba(34, 197, 94, 0.2);
        }

        .lib-load-spinner {
          border-color: rgba(255, 255, 255, 0.45);
          border-top-color: #ffffff;
        }

        .skeleton-cover,
        .skeleton-line {
          background: linear-gradient(90deg, #e5e7eb 25%, #f8fafc 50%, #e5e7eb 75%);
          background-size: 200% 100%;
        }

        .lib-empty {
          border-color: rgba(148, 163, 184, 0.32);
          background: rgba(255, 255, 255, 0.72);
        }

        .lib-empty-title {
          color: #111827;
        }

        .lib-error {
          border-color: rgba(239, 68, 68, 0.24);
          background: #fef2f2;
          color: #b91c1c;
        }

        @media (max-width: 1100px) {
          .lib-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 820px) {
          .lib-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 560px) {
          .lib-hero-inner {
            padding: 20px;
            border-radius: 22px;
          }

          .lib-body {
            padding: 18px 0 88px;
          }

          .lib-grid {
            grid-template-columns: 1fr;
          }
        }

        .lib-root {
          color: var(--ds-ink, #1f261f);
          font-family: var(--ds-font-sans, 'DM Sans', system-ui, sans-serif);
        }

        .lib-hero-inner {
          position: relative;
          display: grid;
          gap: 18px;
          padding: clamp(20px, 5vw, 34px);
          border: 1px solid var(--ds-line, rgba(49, 60, 47, 0.14));
          border-radius: var(--ds-radius-xl, 28px);
          background:
            linear-gradient(115deg, rgba(255,255,255,0.92), rgba(255,248,234,0.86)),
            radial-gradient(circle at 88% 12%, rgba(22, 163, 74, 0.12), transparent 30%);
          box-shadow: var(--ds-shadow-md, 0 10px 30px rgba(31, 38, 31, 0.08));
        }

        .lib-eyebrow {
          width: fit-content;
          margin-bottom: 10px;
          border-color: rgba(22, 163, 74, 0.18);
          background: var(--ds-primary-soft, #e8f7ed);
          color: var(--ds-primary-hover, #15803d);
          letter-spacing: 0.08em;
        }

        .lib-headline {
          max-width: 680px;
          color: var(--ds-ink, #1f261f);
          font-size: clamp(2rem, 9vw, 3.6rem);
          line-height: 1.04;
          letter-spacing: -0.035em;
        }

        .lib-headline em {
          color: var(--ds-primary, #16a34a);
        }

        .lib-subline {
          max-width: 620px;
          color: var(--ds-ink-soft, #596457);
          font-size: clamp(0.92rem, 2vw, 1.02rem);
          font-weight: 650;
          line-height: 1.65;
        }

        .lib-search-form {
          max-width: 760px;
        }

        .lib-search-wrap {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 8px;
          min-height: 56px;
          border: 1px solid var(--ds-line, rgba(49, 60, 47, 0.14));
          border-radius: 18px;
          background: var(--ds-surface-raised, #fff);
          box-shadow: var(--ds-shadow-sm, 0 1px 2px rgba(31, 38, 31, 0.06));
        }

        .lib-search-wrap:focus-within {
          border-color: color-mix(in srgb, var(--ds-primary, #16a34a) 42%, var(--ds-line, #d7ddd3));
          box-shadow: 0 0 0 4px var(--ds-focus, rgba(22, 163, 74, 0.28));
        }

        .lib-search-input {
          color: var(--ds-ink, #1f261f);
          font-family: var(--ds-font-sans, 'DM Sans', system-ui, sans-serif);
          font-weight: 750;
        }

        .lib-search-btn,
        .import-book-btn,
        .lib-load-more-btn {
          border-radius: 14px;
          background: var(--ds-primary, #16a34a);
          color: #fff;
          box-shadow: var(--ds-shadow-sm, 0 1px 2px rgba(31, 38, 31, 0.06));
        }

        .lib-search-btn:hover,
        .import-book-btn:hover,
        .lib-load-more-btn:hover:not(:disabled) {
          background: var(--ds-primary-hover, #15803d);
          transform: translateY(-1px);
        }

        .lib-quick {
          padding-top: 4px;
        }

        .lib-quick-btn,
        .lib-filter-btn,
        .lib-more-top-btn {
          border-color: var(--ds-line, rgba(49, 60, 47, 0.14));
          background: color-mix(in srgb, var(--ds-surface-raised, #fff) 90%, transparent);
          color: var(--ds-ink-soft, #596457);
          box-shadow: none;
        }

        .lib-filter-btn.active {
          border-color: rgba(22, 163, 74, 0.28);
          background: var(--ds-primary-soft, #e8f7ed);
          color: var(--ds-primary-hover, #15803d);
          box-shadow: none;
        }

        .lib-body {
          display: grid;
          gap: 24px;
          padding: 22px 0 34px;
        }

        .continue-band,
        .my-books-band,
        .discovery-band {
          border: 1px solid var(--ds-line, rgba(49, 60, 47, 0.14));
          border-radius: var(--ds-radius-xl, 28px);
          background: color-mix(in srgb, var(--ds-surface, #fffdf7) 94%, transparent);
          box-shadow: var(--ds-shadow-sm, 0 1px 2px rgba(31, 38, 31, 0.06));
        }

        .continue-band {
          display: grid;
          gap: 14px;
          padding: 18px;
          background:
            linear-gradient(135deg, rgba(255,248,234,0.92), rgba(232,247,237,0.82)),
            var(--ds-paper, #fff8ea);
        }

        .continue-card {
          display: grid;
          grid-template-columns: 52px minmax(0, 1fr) auto;
          align-items: center;
          gap: 14px;
        }

        .continue-cover {
          width: 52px;
          height: 68px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: linear-gradient(145deg, #2f5f43, #d88a2d);
          color: #fff;
          font-size: 1.35rem;
          box-shadow: inset -8px 0 14px rgba(0,0,0,0.16);
        }

        .continue-label,
        .library-label {
          color: var(--ds-primary-hover, #15803d);
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .continue-title {
          margin-top: 3px;
          color: var(--ds-ink, #1f261f);
          font-size: 1.02rem;
          font-weight: 900;
          line-height: 1.25;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .continue-meta {
          margin-top: 4px;
          color: var(--ds-ink-soft, #596457);
          font-size: 0.82rem;
          font-weight: 650;
        }

        .continue-action {
          width: auto;
          padding: 10px 14px;
          border: 0;
          border-radius: 999px;
          background: var(--ds-primary, #16a34a);
          color: #fff;
          font-weight: 900;
          white-space: nowrap;
        }

        .my-books-band {
          margin-bottom: 0;
          padding: clamp(18px, 4vw, 24px);
          background: var(--ds-surface, #fffdf7);
        }

        .my-books-head {
          align-items: flex-start;
        }

        .my-books-title,
        .lib-section-title {
          color: var(--ds-ink, #1f261f);
          font-family: var(--ds-font-sans, 'DM Sans', system-ui, sans-serif);
          font-size: clamp(1.25rem, 5vw, 1.75rem);
          letter-spacing: -0.02em;
        }

        .my-books-sub,
        .lib-section-count,
        .book-card-author,
        .my-book-meta,
        .lib-empty-text {
          color: var(--ds-ink-soft, #596457);
        }

        .my-books-row {
          grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          gap: 12px;
        }

        .my-book-card {
          min-height: 150px;
          border: 1px solid var(--ds-line, rgba(49, 60, 47, 0.14));
          border-radius: 18px;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,248,234,0.72)),
            var(--ds-surface-raised, #fff);
          color: var(--ds-ink, #1f261f);
          box-shadow: none;
        }

        .my-book-icon {
          width: 38px;
          height: 48px;
          margin-bottom: 14px;
          border-radius: 9px;
          background: linear-gradient(145deg, #2f5f43, #d88a2d);
          box-shadow: inset -7px 0 12px rgba(0,0,0,0.15);
        }

        .my-book-name,
        .book-card-title,
        .lib-empty-title {
          color: var(--ds-ink, #1f261f);
        }

        .discovery-band {
          padding: clamp(18px, 4vw, 24px);
        }

        .lib-section-head {
          margin-bottom: 18px;
        }

        .lib-filters {
          margin-bottom: 0;
          padding: 0 0 4px;
        }

        .lib-grid {
          grid-template-columns: repeat(auto-fill, minmax(154px, 1fr));
          gap: 14px;
        }

        .book-card {
          padding: 10px;
          border: 1px solid var(--ds-line, rgba(49, 60, 47, 0.14));
          border-radius: 18px;
          background: var(--ds-surface-raised, #fff);
          box-shadow: none;
        }

        .book-card:hover,
        .my-book-card:hover {
          border-color: rgba(22, 163, 74, 0.3);
          box-shadow: var(--ds-shadow-md, 0 10px 30px rgba(31, 38, 31, 0.08));
        }

        .book-card-cover-wrap {
          border-radius: 12px;
          background:
            linear-gradient(145deg, rgba(232,247,237,0.9), rgba(255,241,220,0.82));
        }

        .book-card-title {
          font-family: var(--ds-font-sans, 'DM Sans', system-ui, sans-serif);
          font-size: 0.96rem;
          line-height: 1.28;
        }

        .book-card-badge,
        .book-card-reads {
          background: var(--ds-primary-soft, #e8f7ed);
          color: var(--ds-primary-hover, #15803d);
          border-color: rgba(22, 163, 74, 0.14);
        }

        .book-card-cta {
          background: var(--ds-surface-raised, #fff);
          color: var(--ds-primary-hover, #15803d);
        }

        .lib-empty,
        .my-books-empty,
        .lib-error {
          border-radius: 18px;
        }

        .lib-empty {
          padding: 44px 18px;
          border-color: var(--ds-line, rgba(49, 60, 47, 0.14));
          background: var(--ds-surface, #fffdf7);
        }

        .my-books-band {
          overflow: hidden;
          border-color: rgba(115, 75, 35, 0.2);
          background:
            radial-gradient(circle at 12% 0%, rgba(255, 224, 166, 0.36), transparent 18rem),
            linear-gradient(180deg, #fff7e7 0%, #f5e5cc 100%);
        }

        .bookshelf {
          margin-top: 18px;
          display: grid;
          gap: 22px;
        }

        .bookshelf-row {
          position: relative;
          padding: 22px clamp(14px, 3vw, 26px) 30px;
          border: 1px solid rgba(113, 72, 32, 0.24);
          border-radius: 26px;
          background:
            radial-gradient(circle at 20% 0%, rgba(255, 231, 181, 0.36), transparent 20rem),
            linear-gradient(180deg, rgba(144, 88, 42, 0.88), rgba(104, 61, 29, 0.94)),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 18px);
          box-shadow:
            inset 0 1px 0 rgba(255, 241, 210, 0.32),
            inset 0 -18px 28px rgba(42, 22, 8, 0.18),
            0 22px 45px rgba(83, 50, 22, 0.18);
        }

        .bookshelf-row::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 28px;
          border-radius: 0 0 25px 25px;
          background:
            linear-gradient(180deg, rgba(255, 217, 151, 0.22), transparent 38%),
            linear-gradient(90deg, #5f3519, #9b6030 18%, #6f3d1b 52%, #b36f37 78%, #5d3218);
          box-shadow:
            inset 0 3px 0 rgba(255,255,255,0.1),
            0 -10px 20px rgba(47, 25, 10, 0.22);
        }

        .bookshelf-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(118px, 1fr));
          gap: clamp(14px, 2.8vw, 24px);
          align-items: end;
        }

        .shelf-book-card {
          display: grid;
          gap: 10px;
          min-width: 0;
          padding: 0;
          border: 0;
          background: transparent;
          color: #24160b;
          text-align: left;
          cursor: pointer;
        }

        .shelf-book-card:hover .generated-book-cover,
        .shelf-book-card:hover .add-book-cover {
          transform: translateY(-5px) rotate(-1deg);
          box-shadow:
            12px 18px 24px rgba(40, 20, 8, 0.32),
            inset 8px 0 18px rgba(255,255,255,0.12),
            inset -12px 0 18px rgba(0,0,0,0.16);
        }

        .generated-book-cover,
        .add-book-cover {
          position: relative;
          aspect-ratio: 2 / 3;
          width: 100%;
          max-width: 156px;
          margin-inline: auto;
          overflow: hidden;
          border-radius: 8px 12px 12px 8px;
          box-shadow:
            10px 14px 20px rgba(40, 20, 8, 0.28),
            inset 8px 0 16px rgba(255,255,255,0.12),
            inset -12px 0 18px rgba(0,0,0,0.16);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .generated-book-cover {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 16px 14px 14px 20px;
          background:
            radial-gradient(circle at 78% 18%, color-mix(in srgb, var(--cover-accent) 35%, transparent), transparent 34%),
            linear-gradient(145deg, var(--cover-start), var(--cover-end));
          color: #fff9ee;
        }

        .cover-shine {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(110deg, rgba(255,255,255,0.22), transparent 28%, transparent 70%, rgba(255,255,255,0.08));
          pointer-events: none;
        }

        .cover-spine {
          position: absolute;
          inset: 0 auto 0 0;
          width: 15px;
          background:
            linear-gradient(90deg, rgba(0,0,0,0.3), rgba(255,255,255,0.1), transparent);
        }

        .cover-mark {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,0.34);
          border-radius: 50%;
          background: rgba(255,255,255,0.14);
          color: var(--cover-accent);
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.25rem;
          font-weight: 900;
        }

        .cover-title {
          position: relative;
          z-index: 1;
          display: -webkit-box;
          overflow: hidden;
          color: #fff9ee;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(1rem, 4.3vw, 1.35rem);
          font-weight: 900;
          line-height: 1.08;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 10px rgba(0,0,0,0.22);
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
        }

        .cover-author {
          position: relative;
          z-index: 1;
          overflow: hidden;
          color: rgba(255,249,238,0.78);
          font-size: 0.66rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .add-book-cover {
          display: grid;
          place-items: center;
          align-content: center;
          gap: 6px;
          border: 2px dashed rgba(255, 249, 238, 0.64);
          background:
            linear-gradient(145deg, rgba(255,249,238,0.24), rgba(255,249,238,0.08)),
            rgba(74, 42, 18, 0.58);
          color: #fff9ee;
        }

        .add-book-plus {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(255,255,255,0.18);
          color: #dcfce7;
          font-size: 2rem;
          line-height: 1;
        }

        .add-book-label {
          font-size: 0.92rem;
          font-weight: 950;
        }

        .add-book-sub {
          color: rgba(255,249,238,0.7);
          font-size: 0.68rem;
          font-weight: 800;
        }

        .shelf-book-info {
          min-width: 0;
          padding: 0 4px;
          text-align: center;
        }

        .shelf-book-title {
          display: -webkit-box;
          min-height: 2.42em;
          overflow: hidden;
          color: #2b1b0d;
          font-size: 0.9rem;
          font-weight: 950;
          line-height: 1.2;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .shelf-book-author {
          overflow: hidden;
          margin-top: 3px;
          color: rgba(43, 27, 13, 0.62);
          font-size: 0.72rem;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .shelf-book-meta {
          margin-top: 6px;
          color: rgba(43, 27, 13, 0.56);
          font-size: 0.68rem;
          font-weight: 800;
        }

        .shelf-progress {
          margin-top: 8px;
        }

        .shelf-progress-top {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          color: rgba(43, 27, 13, 0.62);
          font-size: 0.65rem;
          font-weight: 900;
        }

        .shelf-progress-track {
          height: 5px;
          overflow: hidden;
          margin-top: 4px;
          border-radius: 999px;
          background: rgba(43, 27, 13, 0.14);
        }

        .shelf-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #15803d, #22c55e);
        }

        @media (min-width: 820px) {
          .bookshelf-grid {
            grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
          }
        }

        @media (max-width: 620px) {
          .lib-root {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
          }

          .lib-body {
            gap: 18px;
            padding-bottom: calc(36px + env(safe-area-inset-bottom));
          }

          .lib-hero-inner {
            padding: 18px;
            border-radius: 22px;
          }

          .lib-search-wrap {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .lib-search-btn {
            grid-column: 1 / -1;
            width: 100%;
          }

          .bookshelf-row {
            padding: 18px 12px 28px;
            border-radius: 20px;
          }

          .bookshelf-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px 12px;
          }

          .generated-book-cover,
          .add-book-cover {
            width: 100%;
            max-width: 128px;
          }

          .continue-card {
            grid-template-columns: 46px minmax(0, 1fr);
          }

          .continue-action {
            grid-column: 1 / -1;
            width: 100%;
          }

          .my-books-row,
          .lib-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .my-book-card,
          .book-card {
            width: 100%;
          }

          .lib-filters {
            display: flex;
            gap: 8px;
            max-width: 100%;
            overflow-x: auto;
            overflow-y: hidden;
            padding: 0 1px 8px;
            white-space: nowrap;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }

          .lib-filters::-webkit-scrollbar {
            display: none;
          }

          .lib-filter-btn {
            flex: 0 0 auto;
            white-space: nowrap;
          }
        }

        @media (max-width: 420px) {
          .lib-hero-inner,
          .continue-band,
          .my-books-band,
          .discovery-band {
            border-radius: 20px;
          }

          .my-books-row,
          .lib-grid {
            grid-template-columns: 1fr;
          }
        }

        .lib-root,
        .lib-hero,
        .lib-hero-inner,
        .lib-body,
        .continue-band,
        .my-books-band,
        .discovery-band,
        .bookshelf,
        .bookshelf-row,
        .bookshelf-grid {
          min-width: 0;
          max-width: 100%;
        }

        .lib-root,
        .bookshelf,
        .bookshelf-row,
        .bookshelf-grid {
          width: 100%;
        }

        .bookshelf-grid {
          grid-template-columns: repeat(auto-fit, minmax(min(132px, 100%), 1fr));
        }

        .shelf-book-card {
          width: 100%;
          max-width: 100%;
          justify-items: center;
        }

        .generated-book-cover,
        .add-book-cover {
          inline-size: 100%;
          block-size: auto;
        }

        @media (max-width: 620px) {
          .lib-root {
            overflow-x: hidden;
          }

          .lib-hero,
          .lib-body {
            width: 100%;
            max-width: 100%;
          }

          .lib-body {
            padding-inline: 0;
          }

          .continue-band,
          .my-books-band,
          .discovery-band {
            width: 100%;
            max-width: 100%;
            overflow: hidden;
          }

          .my-books-band {
            padding-inline: 12px;
          }

          .bookshelf {
            margin-inline: 0;
            overflow-x: hidden;
          }

          .bookshelf-row {
            padding: 14px 10px 26px;
            overflow: hidden;
          }

          .bookshelf-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px 10px;
          }

          .generated-book-cover,
          .add-book-cover {
            max-width: min(118px, 42vw);
          }

          .cover-title {
            font-size: clamp(0.9rem, 4vw, 1.08rem);
          }

          .shelf-book-title {
            font-size: 0.8rem;
          }
        }

        @media (max-width: 360px) {
          .bookshelf-grid {
            gap: 12px 8px;
          }

          .generated-book-cover,
          .add-book-cover {
            max-width: min(106px, 42vw);
          }
        }
      `}</style>

      <div className="lib-root">
        <section className="lib-hero">
          <div className="lib-hero-bg" />
          <div className="lib-hero-noise" />

          <div className="lib-hero-inner">
            <div>
              <div className="lib-eyebrow">Унших булан · Англи номын сан</div>

              <h1 className="lib-headline">
                Өнөөдөр унших
                <em> номоо сонгоё</em>
              </h1>

              <p className="lib-subline">
                Project Gutenberg-ийн англи сонгодог номоос хайж унших эсвэл
                өөрийн PDF, EPUB, DOCX, TXT номоо import хийгээд үгэн дээр дарж
                орчуулга, тайлбар авна.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="lib-search-form">
              <div className="lib-search-wrap">
                <span className="lib-search-icon">⌕</span>

                <input
                  className="lib-search-input"
                  type="text"
                  value={search ?? ""}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Номын нэр, зохиолч эсвэл сэдвээр хайх"
                  autoComplete="off"
                />

                <button type="submit" className="lib-search-btn">
                  Хайх
                </button>
              </div>
            </form>

            <div className="lib-quick">
              {QUICK_SEARCHES.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="lib-quick-btn"
                  onClick={() => handleQuickSearch(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="lib-body">
          <section className="continue-band">
            {continueBook ? (
              <div className="continue-card">
                <div className="continue-cover">📖</div>

                <div style={{ minWidth: 0 }}>
                  <div className="continue-label">Үргэлжлүүлэн унших</div>
                  <div className="continue-title">
                    {getDisplayBookName(continueBook.name)}
                  </div>
                  <div className="continue-meta">
                    {new Date(continueBook.importedAt).toLocaleDateString()} ·{" "}
                    {continueBook.text
                      .split(/\s+/)
                      .filter(Boolean)
                      .length.toLocaleString()}{" "}
                    үг
                  </div>
                </div>

                <button
                  type="button"
                  className="continue-action"
                  onClick={() => openImportedBook(continueBook)}
                >
                  Унших
                </button>
              </div>
            ) : (
              <div className="continue-card">
                <div className="continue-cover">＋</div>

                <div style={{ minWidth: 0 }}>
                  <div className="continue-label">Унших жагсаалт</div>
                  <div className="continue-title">Эхний номоо нэмээрэй</div>
                  <div className="continue-meta">
                    Файл import хийх эсвэл доороос Gutenberg ном сонгож уншина.
                  </div>
                </div>

                <button
                  type="button"
                  className="continue-action"
                  onClick={requestImportFile}
                  disabled={importingBook}
                >
                  Import
                </button>
              </div>
            )}
          </section>

          <section className="my-books-band">
            <div className="my-books-head">
              <div>
                <div className="library-label">Миний тавиур</div>
                <h2 className="my-books-title">Номын тавиур</h2>
                <p className="my-books-sub">
                  Таны import хийсэн номууд бодит тавиур дээрх ном шиг харагдана.
                </p>
              </div>

              <button
                type="button"
                className="import-book-btn"
                onClick={requestImportFile}
                disabled={importingBook}
              >
                {importingBook ? "Уншиж байна..." : "Ном импортлох"}
              </button>

              <input
                ref={importInputRef}
                type="file"
                accept=".txt,.pdf,.epub,.docx"
                onChange={handleImportBook}
                hidden
              />
            </div>

            {importError && <div className="lib-error">⚠ {importError}</div>}

            <div className="bookshelf">
              <div className="bookshelf-row">
                <div className="bookshelf-grid">
                  <AddBookCard
                    importingBook={importingBook}
                    onClick={requestImportFile}
                  />

                  {importedBooks.map((book) => (
                    <ImportedBookCard
                      key={book.id}
                      book={book}
                      onOpen={openImportedBook}
                    />
                  ))}
                </div>
              </div>
            </div>

            {importedBooks.length === 0 && (
              <div className="my-books-empty">
                Одоогоор import хийсэн ном алга. PDF, EPUB, DOCX эсвэл TXT
                файл оруулахын тулд тавиур дээрх “Ном нэмэх”-ийг дарна уу.
              </div>
            )}
          </section>

          <section className="discovery-band">
            <div className="lib-section-head">
              <div>
                <div className="library-label">Gutenberg нээлттэй сан</div>
                <h2 className="lib-section-title">
                  {activeSearch ? `"${activeSearch}" хайлт` : currentTopicLabel}
                </h2>

                <p className="lib-section-count">
                  {loading
                    ? "Номын сангаас хайж байна..."
                    : hasDiscoveryResults
                      ? `${books.length} ном уншихад бэлэн`
                      : "Илэрц олдсонгүй"}
                </p>
              </div>

              {hasMore && books.length > 0 && !loading && (
                <button
                  type="button"
                  className="lib-more-top-btn"
                  onClick={loadMoreBooks}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Уншиж байна..." : "Илүү ном"}
                </button>
              )}
            </div>

            <div className="lib-filters">
              {TOPICS.map((item) => {
                const active = !activeSearch && topic === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    className={`lib-filter-btn${active ? " active" : ""}`}
                    onClick={() => handleTopicChange(item.value)}
                  >
                    <span className="lib-filter-icon">{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="lib-grid">
            {error && <div className="lib-error">⚠ {error}</div>}

            {loading &&
              !error &&
              Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-cover" />

                  <div
                    style={{
                      padding: "14px 2px 0",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div
                      className="skeleton-line"
                      style={{ height: 16, width: "85%" }}
                    />

                    <div
                      className="skeleton-line"
                      style={{ height: 13, width: "55%" }}
                    />

                    <div
                      className="skeleton-line"
                      style={{ height: 11, width: "35%" }}
                    />
                  </div>
                </div>
              ))}

            {!loading && !error && books.length === 0 && (
              <div className="lib-empty">
                <div className="lib-empty-icon">⌕</div>
                <h3 className="lib-empty-title">Ном олдсонгүй</h3>
                <p className="lib-empty-text">
                  Өөр нэр, зохиолч эсвэл сэдэв сонгоод дахин хайгаарай.
                </p>
              </div>
            )}

            {!loading &&
              !error &&
              books.map((book) => (
                <Link
                  key={book.id}
                  href={`/reader/${book.id}`}
                  className="book-card"
                  onClick={(event) => {
                    if (onReadBook && !onReadBook(book.id)) {
                      event.preventDefault();
                    }
                  }}
                >
                  <div className="book-card-cover-wrap">
                    {book.cover ? (
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="book-card-img"
                      />
                    ) : (
                      <div className="book-card-placeholder">
                        <div className="book-card-placeholder-letter">
                          {book.title.charAt(0)}
                        </div>
                      </div>
                    )}

                    <div className="book-card-overlay">
                      <span className="book-card-cta">Унших →</span>
                    </div>

                    <div className="book-card-badge">{book.category}</div>
                  </div>

                  <div className="book-card-info">
                    <h3 className="book-card-title">{book.title}</h3>
                    <p className="book-card-author">{book.authors}</p>

                    <div className="book-card-meta">
                      <span className="book-card-reads">
                        {book.downloadCount.toLocaleString()} уншилт
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {!loading && hasMore && books.length > 0 && (
              <div className="lib-load-more">
                <button
                  type="button"
                  className="lib-load-more-btn"
                  onClick={loadMoreBooks}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <span className="lib-load-spinner" />
                      Нэмж ачаалж байна...
                    </>
                  ) : (
                    <>Дараагийн номнуудыг харах</>
                  )}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

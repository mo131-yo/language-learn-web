"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";

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

  function handleImportBook(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const allowedTypes = ["text/plain", "application/octet-stream"];
    const isTxtFile = file.name.toLowerCase().endsWith(".txt");

    if (!isTxtFile && !allowedTypes.includes(file.type)) {
      setImportError("Одоогоор зөвхөн .txt ном import хийнэ.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const text = String(reader.result || "");

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
    };

    reader.onerror = () => {
      setImportError("Ном унших үед алдаа гарлаа.");
    };

    reader.readAsText(file);
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
        const incoming: Book[] = data.books || [];

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
        setImportedBooks(JSON.parse(raw) as ImportedBook[]);
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

        if (Array.isArray(imported)) {
          setImportedBooks(imported as ImportedBook[]);
          localStorage.setItem("imported-books", JSON.stringify(imported));
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
      `}</style>

      <div className="lib-root">
        <section className="lib-hero">
          <div className="lib-hero-bg" />
          <div className="lib-hero-noise" />

          <div className="lib-hero-inner">
            <div>
              <div className="lib-eyebrow">BookFlix · AI Vocabulary Reader</div>

              <h1 className="lib-headline">
                Choose your
                <br />
                <em>next adventure</em>
              </h1>

              <p className="lib-subline">
                Thousands of classics, free. Click any word to get AI-powered
                explanations and Mongolian translations.
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
                  placeholder="Search by title or author..."
                  autoComplete="off"
                />
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
          <section className="my-books-band">
            <div className="my-books-head">
              <div>
                <h2 className="my-books-title">Миний import хийсэн ном</h2>
                <p className="my-books-sub">
                  Өөрийн .txt номоо оруулаад үгэн дээр дарж AI тайлбар харна.
                </p>
              </div>

              <button
                type="button"
                className="import-book-btn"
                onClick={requestImportFile}
              >
                + Өөрийн ном import
              </button>

              <input
                ref={importInputRef}
                type="file"
                accept=".txt,text/plain"
                onChange={handleImportBook}
                hidden
              />
            </div>

            {importError && <div className="lib-error">⚠ {importError}</div>}

            {importedBooks.length > 0 ? (
              <div className="my-books-row">
                {importedBooks.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    className="my-book-card"
                    onClick={() => openImportedBook(book)}
                  >
                    <div className="my-book-icon">📘</div>
                    <div className="my-book-name">
                      {book.name.replace(/\.txt$/i, "")}
                    </div>
                    <div className="my-book-meta">
                      Imported · {new Date(book.importedAt).toLocaleDateString()}
                      <br />
                      {book.text.split(/\s+/).filter(Boolean).length.toLocaleString()} words
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="my-books-empty">
                Одоогоор import хийсэн ном алга. .txt номоо import хийгээд эндээсээ сонгож уншина.
              </div>
            )}
          </section>

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

          <div className="lib-section-head">
            <div>
              <h2 className="lib-section-title">
                {activeSearch ? `"${activeSearch}"` : currentTopicLabel}
              </h2>

              <p className="lib-section-count">
                {loading
                  ? "Loading books..."
                  : `${books.length} book${books.length !== 1 ? "s" : ""} available`}
              </p>
            </div>

            {hasMore && books.length > 0 && !loading && (
              <button
                type="button"
                className="lib-more-top-btn"
                onClick={loadMoreBooks}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load more ↓"}
              </button>
            )}
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
                <div className="lib-empty-icon">🔍</div>
                <h3 className="lib-empty-title">No books found</h3>
                <p className="lib-empty-text">
                  Try a different title, author, or category.
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
                      <span className="book-card-cta">Read now →</span>
                    </div>

                    <div className="book-card-badge">{book.category}</div>
                  </div>

                  <div className="book-card-info">
                    <h3 className="book-card-title">{book.title}</h3>
                    <p className="book-card-author">{book.authors}</p>

                    <div className="book-card-meta">
                      <span className="book-card-reads">
                        {book.downloadCount.toLocaleString()} reads
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
                    Loading more...
                  </>
                ) : (
                  <>Show more books</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

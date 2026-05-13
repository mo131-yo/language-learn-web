"use client";

import { ChangeEvent, CSSProperties, FormEvent, useEffect, useRef, useState } from "react";
import { extractBookCover, parseBookFile } from "@/lib/parseBook";

type ImportedBook = {
  id: string;
  name: string;
  text: string;
  importedAt: number;
  coverUrl?: string | null;
  coverImage?: string | null;
};

type UserStateResponse = {
  state: Record<string, unknown> | null;
};

type BookLibraryProps = {
  onReadImportedBook?: () => boolean;
  onImportBook?: () => boolean;
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

function getBookFormat(name: string) {
  const match = name.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toUpperCase() ?? "BOOK";
}

function getBookWordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

function getBookInitials(title: string) {
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "N";
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function getBookCoverTheme(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const angle = 125 + (hash % 70);

  return {
    "--cover-angle": `${angle}deg`,
  } as CSSProperties;
}

function getImportedBookProgress() {
  return 0;
}

function BookProgress({ progress }: { progress: number }) {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="library-progress" aria-label={`Уншсан явц ${safeProgress}%`}>
      <div className="library-progress-top">
        <span>Явц</span>
        <strong>{safeProgress}%</strong>
      </div>
      <div className="library-progress-track">
        <div className="library-progress-fill" style={{ width: `${safeProgress}%` }} />
      </div>
    </div>
  );
}

function ImportedBookCover({ book, compact = false }: { book: ImportedBook; compact?: boolean }) {
  const title = getDisplayBookName(book.name);
  const coverImage = book.coverUrl || book.coverImage;

  return (
    <div
      className={`imported-cover${compact ? " compact" : ""}`}
      style={getBookCoverTheme(`${book.id}-${title}`)}
    >
      {coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="imported-cover-img" src={coverImage} alt={title} />
      ) : (
        <>
          <span className="imported-cover-mark">{getBookInitials(title)}</span>
          <span className="imported-cover-title">{title}</span>
        </>
      )}
    </div>
  );
}

function ContinueReadingCard({
  book,
  importingBook,
  onImport,
  onOpen,
}: {
  book: ImportedBook | null;
  importingBook: boolean;
  onImport: () => void;
  onOpen: (book: ImportedBook) => void;
}) {
  if (!book) {
    return (
      <section className="continue-card empty">
        <div className="continue-book-icon">+</div>
        <div className="continue-copy">
          <div className="library-label">Үргэлжлүүлэн унших</div>
          <h2>Эхний номоо нэмээрэй</h2>
          <p>PDF, EPUB, DOCX, TXT файл дэмжинэ.</p>
        </div>
        <button type="button" className="library-primary-btn" onClick={onImport} disabled={importingBook}>
          Ном импортлох
        </button>
      </section>
    );
  }

  return (
    <section className="continue-card">
      <ImportedBookCover book={book} compact />
      <div className="continue-copy">
        <div className="library-label">Үргэлжлүүлэн унших</div>
        <h2>{getDisplayBookName(book.name)}</h2>
        <p>
          {new Date(book.importedAt).toLocaleDateString()} ·{" "}
          {getBookWordCount(book.text).toLocaleString()} үг
        </p>
      </div>
      <button type="button" className="library-primary-btn" onClick={() => onOpen(book)}>
        Унших
      </button>
    </section>
  );
}

function BookImportDropzone({
  importingBook,
  onImport,
}: {
  importingBook: boolean;
  onImport: () => void;
}) {
  return (
    <button type="button" className="import-dropzone" onClick={onImport} disabled={importingBook}>
      <span className="import-plus">+</span>
      <span className="import-title">{importingBook ? "Уншиж байна..." : "Ном нэмэх"}</span>
      <span className="import-sub">PDF, EPUB, DOCX, TXT файл оруулна уу.</span>
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
    <article className="shelf-book-card">
      <ImportedBookCover book={book} />
      <div className="shelf-book-body">
        <div className="book-format-pill">{getBookFormat(book.name)}</div>
        <h3>{title}</h3>
        <p>Зохиогч тодорхойгүй</p>
        <BookProgress progress={progress} />
        <div className="shelf-book-footer">
          <span>{getBookWordCount(book.text).toLocaleString()} үг</span>
          <button type="button" onClick={() => onOpen(book)}>
            Унших
          </button>
        </div>
      </div>
    </article>
  );
}

function LibraryHero({
  search,
  importingBook,
  onSearchChange,
  onSubmit,
  onImport,
}: {
  search: string;
  importingBook: boolean;
  onSearchChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onImport: () => void;
}) {
  return (
    <section className="library-hero">
      <div className="library-hero-copy">
        <div className="library-label">Library</div>
        <h1>Номын сан</h1>
        <p>Номоо импортлоод уншиж, үгээ хадгалж, ахицаа үргэлжлүүл.</p>
      </div>

      <form className="library-search-form" onSubmit={onSubmit}>
        <label className="library-search">
          <span>⌕</span>
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Импортолсон номоос хайх"
            autoComplete="off"
          />
        </label>
        <button type="submit" className="library-primary-btn">
          Хайх
        </button>
        <button
          type="button"
          className="library-secondary-btn"
          onClick={onImport}
          disabled={importingBook}
        >
          {importingBook ? "Уншиж байна..." : "Ном импортлох"}
        </button>
      </form>
    </section>
  );
}

export default function BookLibrary({
  onReadImportedBook,
  onImportBook,
}: BookLibraryProps = {}) {
  const [importedBooks, setImportedBooks] = useState<ImportedBook[]>([]);
  const [search, setSearch] = useState<string>("");

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
      const [text, coverUrl] = await Promise.all([
        parseBookFile(file),
        extractBookCover(file, file.name),
      ]);

      if (!text.trim()) {
        setImportError("Файл хоосон байна.");
        return;
      }

      const importedBook: ImportedBook = {
        id: `imported-${Date.now()}`,
        name: file.name,
        text,
        importedAt: Date.now(),
        coverUrl,
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem("imported-books");
      if (raw) {
        setImportedBooks(getImportedBooks(JSON.parse(raw)));
      }
    } catch {
      // ignore malformed local storage
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

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  const continueBook = importedBooks[0] ?? null;
  const normalizedSearch = search.trim().toLowerCase();
  const visibleImportedBooks = normalizedSearch
    ? importedBooks.filter((book) =>
        getDisplayBookName(book.name).toLowerCase().includes(normalizedSearch) ||
        getBookFormat(book.name).toLowerCase().includes(normalizedSearch)
      )
    : importedBooks;

  return (
    <>
      <style>{`
        .lib-root,
        .lib-root * {
          box-sizing: border-box;
        }

        .lib-root {
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
          padding: 28px 28px 64px;
          color: var(--text, #111827);
          font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }

        .library-hero,
        .continue-card,
        .shelf-section {
          border: 1px solid color-mix(in srgb, var(--border, #e5e7eb) 88%, transparent);
          border-radius: 24px;
          background: var(--bg-secondary, #ffffff);
          box-shadow: 0 14px 38px color-mix(in srgb, var(--card-shadow, rgba(15, 23, 42, 0.1)) 72%, transparent);
        }

        .library-hero {
          position: relative;
          display: grid;
          gap: 18px;
          overflow: hidden;
          padding: clamp(22px, 4vw, 34px);
          background:
            radial-gradient(circle at 86% 12%, color-mix(in srgb, var(--accent, #f59e0b) 22%, transparent), transparent 28%),
            radial-gradient(circle at 12% 0%, color-mix(in srgb, var(--primary, #16a34a) 18%, transparent), transparent 28%),
            var(--card-gradient, linear-gradient(180deg, #ffffff 0%, #f8fafc 100%));
        }

        .library-hero-copy {
          max-width: 680px;
          min-width: 0;
        }

        .library-label {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          margin-bottom: 8px;
          border-radius: 999px;
          color: var(--primary, #16a34a);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .library-hero h1 {
          margin: 0;
          color: var(--text, #111827);
          font-size: clamp(2rem, 5vw, 3.25rem);
          font-weight: 950;
          letter-spacing: -0.04em;
          line-height: 1.04;
        }

        .library-hero p,
        .section-subtitle,
        .continue-copy p,
        .shelf-book-body p,
        .empty-state p {
          color: var(--text-secondary, #6b7280);
        }

        .library-hero p {
          max-width: 620px;
          margin: 8px 0 0;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.55;
        }

        .library-search-form {
          display: grid;
          grid-template-columns: minmax(220px, 1fr) auto auto;
          gap: 10px;
          width: 100%;
          max-width: 830px;
          align-items: center;
        }

        .library-search {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 10px;
          min-height: 48px;
          padding: 0 14px;
          border: 1.5px solid var(--border, #e5e7eb);
          border-radius: 16px;
          background: color-mix(in srgb, var(--bg-secondary, #fff) 94%, transparent);
          color: var(--text-secondary, #6b7280);
          transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
        }

        .library-search:focus-within {
          border-color: var(--primary, #16a34a);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary, #16a34a) 18%, transparent);
          background: var(--bg-secondary, #fff);
        }

        .library-search input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--text, #111827);
          font-size: 15px;
          font-weight: 800;
        }

        .library-search input::placeholder {
          color: var(--muted-text, #9ca3af);
        }

        .library-primary-btn,
        .library-secondary-btn,
        .shelf-book-footer button,
        .empty-import-btn {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 14px;
          border: 0;
          padding: 0 18px;
          font-size: 14px;
          font-weight: 900;
          text-decoration: none;
          white-space: nowrap;
          cursor: pointer;
          transition: transform 0.14s ease, box-shadow 0.14s ease, background 0.14s ease, color 0.14s ease;
        }

        .library-primary-btn,
        .shelf-book-footer button,
        .empty-import-btn {
          background: var(--primary, #16a34a);
          color: #fff;
          box-shadow: 0 10px 24px color-mix(in srgb, var(--primary, #16a34a) 22%, transparent);
        }

        .library-secondary-btn {
          border: 1px solid color-mix(in srgb, var(--primary, #16a34a) 32%, var(--border, #e5e7eb));
          background: var(--primary-soft, #f0fdf4);
          color: var(--primary-dark, #15803d);
        }

        .library-primary-btn:hover:not(:disabled),
        .library-secondary-btn:hover:not(:disabled),
        .shelf-book-footer button:hover,
        .empty-import-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 14px 28px color-mix(in srgb, var(--primary, #16a34a) 26%, transparent);
        }

        .library-primary-btn:hover:not(:disabled),
        .shelf-book-footer button:hover,
        .empty-import-btn:hover:not(:disabled) {
          background: var(--primary-dark, #15803d);
        }

        button:disabled {
          cursor: default;
          opacity: 0.58;
        }

        .library-helper {
          width: fit-content;
          border-radius: 999px;
          padding: 7px 11px;
          background: color-mix(in srgb, var(--accent-soft, #fef3c7) 72%, transparent);
          color: var(--text-secondary, #6b7280);
          font-size: 12px;
          font-weight: 850;
        }

        .library-stack {
          display: grid;
          gap: 18px;
          margin-top: 18px;
        }

        .continue-card {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 14px;
          padding: 16px;
        }

        .continue-card.empty {
          background:
            linear-gradient(135deg, color-mix(in srgb, var(--primary-soft, #f0fdf4) 76%, transparent), transparent),
            var(--bg-secondary, #fff);
        }

        .continue-book-icon {
          width: 54px;
          height: 68px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: linear-gradient(145deg, var(--primary, #16a34a), var(--accent, #f59e0b));
          color: #fff;
          font-size: 28px;
          font-weight: 950;
          box-shadow: inset -8px 0 16px rgba(0,0,0,0.14);
        }

        .continue-copy {
          min-width: 0;
        }

        .continue-copy h2 {
          overflow: hidden;
          margin: 0;
          color: var(--text, #111827);
          font-size: 18px;
          font-weight: 950;
          line-height: 1.25;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .continue-copy p {
          margin: 4px 0 0;
          font-size: 13px;
          font-weight: 750;
        }

        .shelf-section {
          padding: clamp(18px, 3vw, 24px);
        }

        .section-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .section-title {
          margin: 0;
          color: var(--text, #111827);
          font-size: clamp(1.28rem, 3vw, 1.7rem);
          font-weight: 950;
          letter-spacing: -0.03em;
        }

        .section-subtitle {
          margin: 4px 0 0;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.45;
        }

        .import-error {
          margin-bottom: 14px;
          border: 1px solid var(--error-soft-border, #fecaca);
          border-radius: 16px;
          padding: 12px 14px;
          background: var(--error-soft, #fef2f2);
          color: var(--error, #ef4444);
          font-size: 14px;
          font-weight: 850;
        }

        .shelf-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(178px, 1fr));
          gap: 14px;
        }

        .import-dropzone {
          min-height: 268px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1.5px dashed color-mix(in srgb, var(--primary, #16a34a) 36%, var(--border, #e5e7eb));
          border-radius: 20px;
          background: color-mix(in srgb, var(--primary-soft, #f0fdf4) 58%, var(--bg-secondary, #fff));
          color: var(--text, #111827);
          text-align: center;
          cursor: pointer;
          transition: transform 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease;
        }

        .import-dropzone:hover:not(:disabled) {
          transform: translateY(-2px);
          border-color: var(--primary, #16a34a);
          box-shadow: 0 14px 30px color-mix(in srgb, var(--primary, #16a34a) 16%, transparent);
        }

        .import-plus {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: var(--primary, #16a34a);
          color: #fff;
          font-size: 26px;
          font-weight: 950;
        }

        .import-title {
          color: var(--text, #111827);
          font-size: 16px;
          font-weight: 950;
        }

        .import-sub {
          max-width: 180px;
          color: var(--text-secondary, #6b7280);
          font-size: 13px;
          font-weight: 750;
          line-height: 1.35;
        }

        .shelf-book-card {
          min-width: 0;
          overflow: hidden;
          border: 1px solid color-mix(in srgb, var(--border, #e5e7eb) 88%, transparent);
          border-radius: 20px;
          background: color-mix(in srgb, var(--bg-secondary, #fff) 96%, transparent);
          color: inherit;
          text-decoration: none;
          box-shadow: 0 8px 22px color-mix(in srgb, var(--card-shadow, rgba(15, 23, 42, 0.1)) 46%, transparent);
          transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
        }

        .shelf-book-card:hover {
          transform: translateY(-3px);
          border-color: color-mix(in srgb, var(--primary, #16a34a) 38%, var(--border, #e5e7eb));
          box-shadow: 0 16px 34px color-mix(in srgb, var(--card-shadow, rgba(15, 23, 42, 0.1)) 80%, transparent);
        }

        .shelf-book-card {
          display: grid;
          grid-template-rows: auto 1fr;
        }

        .imported-cover {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 76% 16%, color-mix(in srgb, var(--accent, #f59e0b) 34%, transparent), transparent 34%),
            linear-gradient(var(--cover-angle, 145deg), var(--primary, #16a34a), var(--accent, #f59e0b));
        }

        .imported-cover {
          aspect-ratio: 4 / 5;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 18px;
          color: #fff;
        }

        .imported-cover.compact {
          width: 54px;
          height: 70px;
          flex: 0 0 auto;
          border-radius: 12px;
          padding: 8px;
          box-shadow: inset -8px 0 16px rgba(0,0,0,0.14);
        }

        .imported-cover::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 16px;
          background: linear-gradient(90deg, rgba(0,0,0,0.22), rgba(255,255,255,0.12), transparent);
        }

        .imported-cover-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .imported-cover-mark {
          position: relative;
          z-index: 1;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,0.34);
          border-radius: 14px;
          background: rgba(255,255,255,0.16);
          font-size: 16px;
          font-weight: 950;
        }

        .imported-cover.compact .imported-cover-mark {
          width: 28px;
          height: 28px;
          border-radius: 9px;
          font-size: 12px;
        }

        .imported-cover-title {
          position: relative;
          z-index: 1;
          display: -webkit-box;
          overflow: hidden;
          color: #fff;
          font-size: 17px;
          font-weight: 950;
          line-height: 1.12;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
        }

        .imported-cover.compact .imported-cover-title {
          display: none;
        }

        .shelf-book-body {
          display: grid;
          gap: 8px;
          padding: 14px;
        }

        .book-format-pill {
          width: fit-content;
          border-radius: 999px;
          background: var(--primary-soft, #f0fdf4);
          color: var(--primary-dark, #15803d);
          font-size: 11px;
          font-weight: 950;
          line-height: 1;
        }

        .book-format-pill {
          padding: 6px 8px;
        }

        .shelf-book-body h3 {
          display: -webkit-box;
          overflow: hidden;
          margin: 0;
          color: var(--text, #111827);
          font-size: 16px;
          font-weight: 950;
          line-height: 1.22;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .shelf-book-body p {
          overflow: hidden;
          margin: 0;
          font-size: 13px;
          font-weight: 750;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .library-progress {
          display: grid;
          gap: 5px;
        }

        .library-progress-top,
        .shelf-book-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          min-width: 0;
        }

        .library-progress-top {
          color: var(--text-secondary, #6b7280);
          font-size: 11px;
          font-weight: 850;
        }

        .library-progress-top strong {
          color: var(--primary, #16a34a);
        }

        .library-progress-track {
          height: 7px;
          overflow: hidden;
          border-radius: 999px;
          background: var(--muted, #f3f4f6);
        }

        .library-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, var(--primary, #16a34a), var(--accent, #f59e0b));
        }

        .shelf-book-footer span {
          overflow: hidden;
          color: var(--text-secondary, #6b7280);
          font-size: 12px;
          font-weight: 850;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .shelf-book-footer button {
          min-height: 36px;
          padding: 0 12px;
          font-size: 12px;
          box-shadow: none;
        }

        .empty-state {
          grid-column: 1 / -1;
          display: grid;
          justify-items: center;
          gap: 8px;
          border: 1.5px dashed var(--border, #e5e7eb);
          border-radius: 20px;
          padding: 38px 18px;
          background: color-mix(in srgb, var(--muted, #f3f4f6) 54%, transparent);
          text-align: center;
        }

        .empty-state h3 {
          margin: 0;
          color: var(--text, #111827);
          font-size: 18px;
          font-weight: 950;
        }

        .empty-state p {
          margin: 0;
          max-width: 360px;
          font-size: 14px;
          font-weight: 750;
          line-height: 1.45;
        }

        @media (max-width: 899px) {
          .lib-root {
            max-width: 760px;
            padding: 18px 16px 42px;
          }

          .library-search-form {
            grid-template-columns: minmax(0, 1fr) auto;
          }

          .library-secondary-btn {
            grid-column: 1 / -1;
          }

          .section-head {
            align-items: stretch;
          }
        }

        @media (max-width: 560px) {
          .lib-root {
            padding-inline: 12px;
          }

          .library-hero,
          .continue-card,
          .shelf-section {
            border-radius: 20px;
          }

          .library-search-form,
          .continue-card,
          .section-head {
            grid-template-columns: 1fr;
          }

          .library-search-form {
            gap: 8px;
          }

          .library-primary-btn,
          .library-secondary-btn {
            width: 100%;
          }

          .continue-card {
            justify-items: start;
          }

          .continue-card .library-primary-btn {
            width: 100%;
          }

          .continue-copy h2 {
            white-space: normal;
          }

          .shelf-grid {
            grid-template-columns: 1fr;
          }

          .import-dropzone {
            min-height: 190px;
          }
        }
      `}</style>

      <div className="lib-root">
        <LibraryHero
          search={search}
          importingBook={importingBook}
          onSearchChange={setSearch}
          onSubmit={handleSubmit}
          onImport={requestImportFile}
        />

        <div className="library-stack">
          <ContinueReadingCard
            book={continueBook}
            importingBook={importingBook}
            onImport={requestImportFile}
            onOpen={openImportedBook}
          />

          <section className="shelf-section">
            <div className="section-head">
              <div>
                <div className="library-label">Миний тавиур</div>
                <h2 className="section-title">Миний номууд</h2>
                <p className="section-subtitle">Импортолсон болон хадгалсан номууд энд харагдана.</p>
              </div>

              <button
                type="button"
                className="library-secondary-btn"
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

            {importError && <div className="import-error">{importError}</div>}

            <div className="shelf-grid">
              <BookImportDropzone importingBook={importingBook} onImport={requestImportFile} />

              {visibleImportedBooks.map((book) => (
                <ImportedBookCard key={book.id} book={book} onOpen={openImportedBook} />
              ))}

              {importedBooks.length > 0 && visibleImportedBooks.length === 0 && (
                <div className="empty-state">
                  <h3>Ном олдсонгүй</h3>
                  <p>Импортолсон номын нэр эсвэл файлын төрлөөр дахин хайгаарай.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

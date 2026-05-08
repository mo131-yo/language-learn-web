import { NextRequest, NextResponse } from "next/server";

type GutendexBook = {
  id: number;
  title: string;
  authors?: { name: string }[];
  subjects?: string[];
  bookshelves?: string[];
  languages?: string[];
  formats: Record<string, string>;
  download_count: number;
};

function getTextUrl(book: GutendexBook) {
  return (
    book.formats["text/plain; charset=utf-8"] ||
    book.formats["text/plain"] ||
    book.formats["text/plain; charset=us-ascii"] ||
    null
  );
}

function getCover(book: GutendexBook) {
  return book.formats["image/jpeg"] || null;
}

function getShortCategory(book: GutendexBook) {
  const subjects = book.subjects || [];
  const shelves = book.bookshelves || [];
  const combined = [...shelves, ...subjects].join(" ").toLowerCase();

  if (combined.includes("children")) return "Children";
  if (combined.includes("adventure")) return "Adventure";
  if (combined.includes("detective")) return "Detective";
  if (combined.includes("mystery")) return "Mystery";
  if (combined.includes("science fiction")) return "Sci-Fi";
  if (combined.includes("romance")) return "Romance";
  if (combined.includes("gothic")) return "Gothic";
  if (combined.includes("fantasy")) return "Fantasy";
  if (combined.includes("history")) return "History";
  if (combined.includes("poetry")) return "Poetry";
  if (combined.includes("drama")) return "Drama";
  if (combined.includes("philosophy")) return "Philosophy";
  if (combined.includes("christmas")) return "Christmas";
  if (combined.includes("sea")) return "Sea";
  if (combined.includes("war")) return "War";
  if (combined.includes("western")) return "Western";

  return "Classic";
}

function normalizeBook(book: GutendexBook) {
  const textUrl = getTextUrl(book);

  if (!textUrl) return null;

  return {
    id: book.id,
    title: book.title,
    authors:
      book.authors?.map((author) => author.name).join(", ") ||
      "Unknown author",
    cover: getCover(book),
    textUrl,
    downloadCount: book.download_count,
    category: getShortCategory(book),
    subjects: book.subjects?.slice(0, 3) || [],
  };
}

async function fetchGutendexPage(options: {
  search: string;
  topic: string;
  page: number;
}) {
  const { search, topic, page } = options;

  const url = new URL("https://gutendex.com/books/");
  url.searchParams.set("languages", "en");
  url.searchParams.set("copyright", "false");
  url.searchParams.set("mime_type", "text/plain");
  url.searchParams.set("sort", "popular");
  url.searchParams.set("page", String(page));

  if (search.trim()) {
    url.searchParams.set("search", search.trim());
  } else if (topic.trim() && topic !== "all") {
    url.searchParams.set("topic", topic.trim());
  }

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(10000),
    next: {
      revalidate: 60 * 60 * 24,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Gutendex page");
  }

  return res.json();
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const search = searchParams.get("search") || "";
    const topic = searchParams.get("topic") || "fiction";

    const startPage = Number(searchParams.get("page") || "1");
    const perRequestPages = Number(searchParams.get("pages") || "3");

    const safeStartPage =
      Number.isFinite(startPage) && startPage > 0 ? startPage : 1;

    const safePages =
      Number.isFinite(perRequestPages) && perRequestPages > 0
        ? Math.min(perRequestPages, 5)
        : 3;

    const pageNumbers = Array.from(
      { length: safePages },
      (_, index) => safeStartPage + index
    );

    const responses = await Promise.all(
      pageNumbers.map((pageNumber) =>
        fetchGutendexPage({
          search,
          topic,
          page: pageNumber,
        }).catch((error) => {
          console.error("Gutendex page fetch failed:", error);
          return { results: [], count: 0, next: null };
        })
      )
    );

    const allResults = responses.flatMap((data) => data.results || []);

    const uniqueBooksMap = new Map<
      number,
      NonNullable<ReturnType<typeof normalizeBook>>
    >();

    for (const book of allResults) {
      const normalized = normalizeBook(book);

      if (normalized) {
        uniqueBooksMap.set(normalized.id, normalized);
      }
    }

    const books = Array.from(uniqueBooksMap.values());
    const lastResponse = responses[responses.length - 1];

    return NextResponse.json({
      books,
      count: responses[0]?.count || 0,
      currentPage: safeStartPage,
      nextPage: safeStartPage + safePages,
      loadedPages: pageNumbers,
      hasMore: Boolean(lastResponse?.next),
    });
  } catch (error) {
    console.error("Books API error:", error);

    return NextResponse.json(
      { error: "Failed to load books" },
      { status: 500 }
    );
  }
}

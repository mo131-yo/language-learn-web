import { NextResponse } from "next/server";

type GutendexBookDetail = {
  id: number;
  title: string;
  authors?: Array<{ name: string }>;
  formats: Record<string, string>;
};

function cleanGutenbergText(text: string) {
  const startMarkers = [
    "*** START OF THE PROJECT GUTENBERG EBOOK",
    "*** START OF THIS PROJECT GUTENBERG EBOOK",
    "*** START OF THE PROJECT GUTENBERG",
  ];

  const endMarkers = [
    "*** END OF THE PROJECT GUTENBERG EBOOK",
    "*** END OF THIS PROJECT GUTENBERG EBOOK",
    "*** END OF THE PROJECT GUTENBERG",
  ];

  let cleaned = text;

  for (const marker of startMarkers) {
    const index = cleaned.indexOf(marker);

    if (index !== -1) {
      const afterMarker = cleaned.indexOf("\n", index);
      cleaned = cleaned.slice(afterMarker + 1);
      break;
    }
  }

  for (const marker of endMarkers) {
    const index = cleaned.indexOf(marker);

    if (index !== -1) {
      cleaned = cleaned.slice(0, index);
      break;
    }
  }

  return cleaned
    .replace(/\r\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function splitIntoChapters(text: string) {
  const lines = text.split("\n");
  const chapterIndexes: number[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    const isChapterTitle =
      /^chapter\s+([ivxlcdm]+|\d+)/i.test(trimmed) ||
      /^book\s+([ivxlcdm]+|\d+)/i.test(trimmed) ||
      /^part\s+([ivxlcdm]+|\d+)/i.test(trimmed);

    if (isChapterTitle) {
      chapterIndexes.push(index);
    }
  });

  if (chapterIndexes.length === 0) {
    return [
      {
        index: 0,
        title: "Full Book",
        text,
      },
    ];
  }

  const chapters: Array<{ index: number; title: string; text: string }> = [];

  const openingLines = lines.slice(0, chapterIndexes[0]);
  const openingText = openingLines.join("\n").trim();

  if (openingText.length > 50) {
    chapters.push({
      index: 0,
      title: "Opening",
      text: openingText,
    });
  }

  chapterIndexes.forEach((startLine, chapterIndex) => {
    const endLine = chapterIndexes[chapterIndex + 1] ?? lines.length;
    const chapterLines = lines.slice(startLine, endLine);
    const title = chapterLines[0]?.trim() || `Chapter ${chapterIndex + 1}`;

    chapters.push({
      index: chapters.length,
      title,
      text: chapterLines.join("\n").trim(),
    });
  });

  return chapters.filter((chapter) => chapter.text.length > 50);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params;

    const metaRes = await fetch(`https://gutendex.com/books/${bookId}`, {
      next: {
        revalidate: 60 * 60 * 24 * 7,
      },
    });

    if (!metaRes.ok) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const book = (await metaRes.json()) as GutendexBookDetail;

    const textUrl =
      book.formats["text/plain; charset=utf-8"] ||
      book.formats["text/plain"] ||
      book.formats["text/plain; charset=us-ascii"];

    if (!textUrl) {
      return NextResponse.json(
        { error: "Plain text version not available" },
        { status: 404 }
      );
    }

    const textRes = await fetch(textUrl, {
      next: {
        revalidate: 60 * 60 * 24 * 7,
      },
    });

    if (!textRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch book text" },
        { status: 500 }
      );
    }

    const rawText = await textRes.text();
    const text = cleanGutenbergText(rawText);
    const chapters = splitIntoChapters(text);

    return NextResponse.json({
      id: book.id,
      title: book.title,
      authors: book.authors?.map((author) => author.name).join(", ") || "Unknown",
      cover: book.formats["image/jpeg"] || null,
      text,
      chapters,
    });
  } catch (error) {
    console.error("Book detail API error:", error);

    return NextResponse.json(
      { error: "Failed to load book" },
      { status: 500 }
    );
  }
}

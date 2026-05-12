type PdfTextItem = {
  str: string;
};

type EpubSection = {
  load: (request?: (path: string) => Promise<unknown>) => Document | Promise<Document>;
  unload: () => void;
};

type EpubBook = {
  load: (path: string) => Promise<unknown>;
  coverUrl?: () => Promise<string | null>;
  spine: {
    each: (callback: (section: EpubSection) => void) => void;
  };
  destroy?: () => void;
};

const PARSE_ERROR_MESSAGE = "Файл уншихад алдаа гарлаа. Өөр файл оруулна уу.";

function getExtension(fileName: string) {
  return fileName.toLowerCase().split(".").pop() ?? "";
}

function getDisplayBookTitle(fileName: string) {
  return (
    fileName
      .replace(/\.(txt|pdf|epub|docx)$/i, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Imported book"
  );
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (context.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;

    if (lines.length === maxLines - 1) {
      break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}

async function blobToDataUrl(blob: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function urlToDataUrl(url: string) {
  if (url.startsWith("data:")) return url;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to load cover image");
  }

  return blobToDataUrl(await response.blob());
}

function generateFallbackCover(title?: string, author?: string) {
  if (typeof document === "undefined") return null;

  const safeTitle = getDisplayBookTitle(title || "Imported book");
  const safeAuthor = (author || "Unknown author").trim() || "Unknown author";
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
  for (let i = 0; i < safeTitle.length; i += 1) {
    hash = (hash * 31 + safeTitle.charCodeAt(i)) >>> 0;
  }

  const [start, end, accent] = palettes[hash % palettes.length];
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 900;
  const context = canvas.getContext("2d");

  if (!context) return null;

  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, start);
  gradient.addColorStop(1, end);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(255,255,255,0.14)";
  context.beginPath();
  context.arc(470, 160, 180, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "rgba(0,0,0,0.24)";
  context.fillRect(0, 0, 58, canvas.height);

  context.strokeStyle = "rgba(255,255,255,0.32)";
  context.lineWidth = 3;
  context.strokeRect(74, 76, canvas.width - 148, canvas.height - 152);

  context.fillStyle = accent;
  context.font = "900 72px Georgia, serif";
  context.textAlign = "left";
  context.fillText(safeTitle.charAt(0).toUpperCase(), 104, 172);

  context.fillStyle = "#fff9ee";
  context.font = "900 58px Georgia, serif";
  const titleLines = wrapCanvasText(context, safeTitle, 390, 5);
  titleLines.forEach((line, index) => {
    context.fillText(line, 104, 340 + index * 66);
  });

  context.fillStyle = "rgba(255,249,238,0.78)";
  context.font = "800 24px Arial, sans-serif";
  context.fillText(safeAuthor.toUpperCase(), 104, 792);

  return canvas.toDataURL("image/jpeg", 0.86);
}

async function extractEpubCover(file: File) {
  const epubModule = await import("epubjs");
  const createBook = epubModule.default;
  const book = createBook(await file.arrayBuffer()) as unknown as EpubBook;
  let coverUrl: string | null = null;

  try {
    coverUrl = (await book.coverUrl?.()) ?? null;

    if (!coverUrl) return null;

    return await urlToDataUrl(coverUrl);
  } finally {
    if (coverUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(coverUrl);
    }

    book.destroy?.();
  }
}

async function extractPdfFirstPageCover(file: File) {
  if (typeof document === "undefined") return null;

  const pdfjs = await import("pdfjs-dist");

  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).toString();

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    useWorkerFetch: false,
    isEvalSupported: false,
  });
  const pdf = await loadingTask.promise;

  try {
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const coverWidth = 600;
    const coverHeight = 900;
    const scale = Math.min(coverWidth / viewport.width, coverHeight / viewport.height);
    const scaledViewport = page.getViewport({ scale });

    const renderCanvas = document.createElement("canvas");
    renderCanvas.width = Math.ceil(scaledViewport.width);
    renderCanvas.height = Math.ceil(scaledViewport.height);

    const renderContext = renderCanvas.getContext("2d");
    if (!renderContext) return null;

    await page.render({
      canvas: renderCanvas,
      canvasContext: renderContext,
      viewport: scaledViewport,
    }).promise;

    const coverCanvas = document.createElement("canvas");
    coverCanvas.width = coverWidth;
    coverCanvas.height = coverHeight;

    const coverContext = coverCanvas.getContext("2d");
    if (!coverContext) return null;

    coverContext.fillStyle = "#f8f3e7";
    coverContext.fillRect(0, 0, coverWidth, coverHeight);
    coverContext.drawImage(
      renderCanvas,
      Math.round((coverWidth - renderCanvas.width) / 2),
      Math.round((coverHeight - renderCanvas.height) / 2)
    );

    return coverCanvas.toDataURL("image/jpeg", 0.86);
  } finally {
    await pdf.destroy();
  }
}

async function parsePdf(file: File) {
  const pdfjs = await import("pdfjs-dist");

  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
    useWorkerFetch: false,
    isEvalSupported: false,
  });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? (item as PdfTextItem).str : ""))
      .join(" ");

    pages.push(pageText);
  }

  await pdf.destroy();
  return pages.join("\n\n");
}

async function parseEpub(file: File) {
  const epubModule = await import("epubjs");
  const createBook = epubModule.default;
  const arrayBuffer = await file.arrayBuffer();
  const book = createBook(arrayBuffer) as unknown as EpubBook;
  const sections: EpubSection[] = [];

  book.spine.each((section) => {
    sections.push(section);
  });

  const chapterTexts: string[] = [];

  for (const section of sections) {
    const document = await section.load(book.load.bind(book));
    const text = document.body?.textContent?.replace(/\s+/g, " ").trim() ?? "";

    if (text) {
      chapterTexts.push(text);
    }

    section.unload();
  }

  book.destroy?.();
  return chapterTexts.join("\n\n");
}

async function parseDocx(file: File) {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export async function parseBookFile(file: File): Promise<string> {
  const extension = getExtension(file.name);

  try {
    if (extension === "txt") {
      return await file.text();
    }

    if (extension === "pdf") {
      return await parsePdf(file);
    }

    if (extension === "epub") {
      return await parseEpub(file);
    }

    if (extension === "docx") {
      return await parseDocx(file);
    }

    throw new Error(PARSE_ERROR_MESSAGE);
  } catch {
    throw new Error(PARSE_ERROR_MESSAGE);
  }
}

export async function extractBookCover(
  file: File,
  title?: string,
  author?: string
): Promise<string | null> {
  const extension = getExtension(file.name);
  const safeTitle = title || file.name;

  try {
    if (extension === "epub") {
      return (
        (await extractEpubCover(file)) ??
        generateFallbackCover(safeTitle, author)
      );
    }

    if (extension === "pdf") {
      return (
        (await extractPdfFirstPageCover(file)) ??
        generateFallbackCover(safeTitle, author)
      );
    }

    if (extension === "txt" || extension === "docx") {
      return generateFallbackCover(safeTitle, author);
    }

    return generateFallbackCover(safeTitle, author);
  } catch {
    return generateFallbackCover(safeTitle, author);
  }
}

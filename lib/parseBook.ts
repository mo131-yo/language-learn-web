type PdfTextItem = {
  str: string;
};

type EpubSection = {
  load: (request?: (path: string) => Promise<unknown>) => Document | Promise<Document>;
  unload: () => void;
};

type EpubBook = {
  load: (path: string) => Promise<unknown>;
  spine: {
    each: (callback: (section: EpubSection) => void) => void;
  };
  destroy?: () => void;
};

const PARSE_ERROR_MESSAGE = "Файл уншихад алдаа гарлаа. Өөр файл оруулна уу.";

function getExtension(fileName: string) {
  return fileName.toLowerCase().split(".").pop() ?? "";
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

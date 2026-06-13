// Client-side only. Extract plain text from PDF / DOCX — never store binary (PRD §F11).
import { wordCount } from './utils';

export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
export const SHORT_TEXT_WORDS = 50;

export interface ExtractResult {
  text: string;
  words: number;
  warning?: string;
}

export class ExtractionError extends Error {}

function validateFile(file: File): void {
  const name = file.name.toLowerCase();
  const isPdf = file.type === 'application/pdf' || name.endsWith('.pdf');
  const isDocx =
    name.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (!isPdf && !isDocx) {
    throw new ExtractionError('Unsupported file type. Please use PDF or DOCX.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ExtractionError('File is larger than 5 MB. Please use a smaller file or paste the text.');
  }
}

async function extractPDFText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  // Worker served from CDN, version-matched — reliable on Vercel, no bundling headaches.
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = await Promise.all(
    Array.from({ length: pdf.numPages }, (_, i) =>
      pdf.getPage(i + 1)
        .then((p) => p.getTextContent())
        .then((c) => c.items.map((item) => ('str' in item ? item.str : '')).join(' ')),
    ),
  );
  return pages.join('\n').trim();
}

async function extractDOCXText(file: File): Promise<string> {
  const mammoth = (await import('mammoth')).default ?? (await import('mammoth'));
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

export async function extractFileText(file: File): Promise<ExtractResult> {
  validateFile(file);
  const name = file.name.toLowerCase();
  let text = '';
  try {
    if (name.endsWith('.docx')) {
      text = await extractDOCXText(file);
    } else {
      text = await extractPDFText(file);
    }
  } catch (err) {
    if (err instanceof ExtractionError) throw err;
    throw new ExtractionError(
      'Could not extract text. Try copying and pasting the content instead.',
    );
  }

  if (!text || text.trim().length === 0) {
    throw new ExtractionError(
      'Could not extract text. Try copying and pasting the content instead.',
    );
  }

  const words = wordCount(text);
  const warning =
    words < SHORT_TEXT_WORDS
      ? 'This seems short — was the file scanned or image-based?'
      : undefined;

  return { text, words, warning };
}

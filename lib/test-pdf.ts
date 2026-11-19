/**
 * Server-side PDF generation for tests (Pro feature: "export to PDF").
 *
 * Builds a print-ready US-Letter PDF from a `Test` object using pdf-lib:
 *  - header block (title, topic/difficulty/year, points, time, name/score row)
 *  - numbered questions with wrapped text, lettered multiple-choice options,
 *    and ruled answer blanks for free-response questions
 *  - optional answer-key section on its own page
 *  - page footers ("Page X of Y" + site name) added in a second pass
 *
 * All user-supplied text is sanitized to ASCII (pdf-lib standard fonts use
 * WinAnsi encoding, which cannot represent arbitrary Unicode) and clamped to
 * a sane length so a hostile payload cannot balloon the document.
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage } from 'pdf-lib';
import type { Test } from '@/lib/types';

export interface TestPdfOptions {
  /** Append an answer-key section after the questions. Default: true. */
  includeAnswerKey?: boolean;
  /** Render ONLY the answer-key document (the companion "answers" file). */
  answerKeyOnly?: boolean;
  /** Brand text shown in the footer. */
  siteName?: string;
}

// ---------------------------------------------------------------------------
// Layout constants (US Letter, portrait)
// ---------------------------------------------------------------------------
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_BASELINE = 32;

const TITLE_SIZE = 20;
const SUBTITLE_SIZE = 10;
const BODY_SIZE = 11;
const HEADING_SIZE = 16;
const LINE_GAP = 5;
const QUESTION_GAP = 16;
const ANSWER_BLANK_LINES = 2;

/** Max characters per text field (bounds PDF size for hostile payloads). */
const MAX_TEXT_LENGTH = 4000;
/** Max multiple-choice options rendered per question. */
const MAX_OPTIONS = 10;

const COLOR_TEXT = rgb(0.13, 0.13, 0.15);
const COLOR_MUTED = rgb(0.42, 0.45, 0.5);
const COLOR_RULE = rgb(0.78, 0.8, 0.83);

// ---------------------------------------------------------------------------
// Text sanitization
// ---------------------------------------------------------------------------

/** Common Unicode punctuation/symbols mapped to ASCII equivalents. */
const CHAR_REPLACEMENTS: Record<string, string> = {
  '\u2018': "'", // '
  '\u2019': "'", // '
  '\u201A': ',',
  '\u201C': '"',
  '\u201D': '"',
  '\u2013': '-', // en dash
  '\u2014': '-', // em dash
  '\u2026': '...',
  '\u2022': '*',
  '\u00A0': ' ',
  '\u2192': '->',
  '\u2190': '<-',
  '\u2264': '<=',
  '\u2265': '>=',
  '\u2260': '!=',
  '\u00B1': '+/-',
  '\u00D7': 'x',
  '\u00F7': '/',
  '\u03BC': 'u', // micro
  '\u00B0C': ' C',
  '\u00B0': ' degrees',
};

/**
 * Sanitize arbitrary text for the Helvetica (WinAnsi) standard fonts:
 * map known Unicode, keep printable ASCII, drop everything else, and clamp
 * the overall length.
 */
export function sanitizeForPdf(input: unknown): string {
  if (typeof input !== 'string') return '';
  let out = '';
  for (const ch of input.slice(0, MAX_TEXT_LENGTH)) {
    const replacement = CHAR_REPLACEMENTS[ch];
    if (replacement !== undefined) {
      out += replacement;
    } else if (ch >= ' ' && ch <= '~') {
      out += ch;
    } else if (ch === '\n' || ch === '\t' || ch === '\r') {
      out += ' ';
    }
    // anything else (emoji, CJK, control chars, ...) is dropped
  }
  return out;
}

// ---------------------------------------------------------------------------
// Word wrapping
// ---------------------------------------------------------------------------

/** Greedy word-wrap with hard character splitting for unbreakable words. */
export function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  for (const rawLine of text.split('\n')) {
    const words = rawLine.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);
      if (font.widthOfTextAtSize(word, size) > maxWidth) {
        // Single word wider than the column: hard-split by character.
        let chunk = '';
        for (const ch of word) {
          if (font.widthOfTextAtSize(chunk + ch, size) <= maxWidth) {
            chunk += ch;
          } else {
            lines.push(chunk);
            chunk = ch;
          }
        }
        current = chunk;
      } else {
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines.length > 0 ? lines : [''];
}

// ---------------------------------------------------------------------------
// Page composer
// ---------------------------------------------------------------------------

/** Cursor-based page writer that handles pagination automatically. */
class PdfComposer {
  readonly doc: PDFDocument;
  readonly regular: PDFFont;
  readonly bold: PDFFont;
  private page!: PDFPage;
  private y!: number;

  private constructor(doc: PDFDocument, regular: PDFFont, bold: PDFFont) {
    this.doc = doc;
    this.regular = regular;
    this.bold = bold;
    this.addPage();
  }

  static async create(): Promise<PdfComposer> {
    const doc = await PDFDocument.create();
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    return new PdfComposer(doc, regular, bold);
  }

  addPage(): void {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  /** Start a new page when less than `space` points remain. */
  ensure(space: number): void {
    if (this.y - space < MARGIN) this.addPage();
  }

  /** Height of the next text line as drawn by `writeLines`. */
  lineHeight(size: number): number {
    return size + LINE_GAP;
  }

  /** Draw pre-wrapped lines starting at the cursor, paginating as needed. */
  writeLines(
    lines: string[],
    options: {
      x?: number;
      size?: number;
      bold?: boolean;
      color?: typeof COLOR_TEXT;
      width?: number;
    } = {}
  ): void {
    const x = options.x ?? MARGIN;
    const size = options.size ?? BODY_SIZE;
    const font = options.bold ? this.bold : this.regular;
    const color = options.color ?? COLOR_TEXT;
    const width = options.width ?? CONTENT_WIDTH - (x - MARGIN);

    for (const line of lines) {
      this.ensure(this.lineHeight(size));
      this.page.drawText(line, { x, y: this.y - size, size, font, color, maxWidth: width });
      this.y -= this.lineHeight(size);
    }
  }

  /** Draw a horizontal rule. */
  rule(color = COLOR_RULE, thickness = 1): void {
    this.ensure(10);
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness,
      color,
    });
    this.y -= 12;
  }

  /** Advance the cursor (spacing between blocks). */
  gap(amount: number): void {
    this.y -= amount;
  }

  /** Draw `count` ruled blanks for free-response answers. */
  answerBlanks(count = ANSWER_BLANK_LINES): void {
    const indent = MARGIN + 18;
    for (let i = 0; i < count; i++) {
      this.ensure(24);
      this.page.drawLine({
        start: { x: indent, y: this.y - 12 },
        end: { x: PAGE_WIDTH - MARGIN, y: this.y - 12 },
        thickness: 0.75,
        color: COLOR_RULE,
      });
      this.y -= 24;
    }
  }

  /** Stamp footers on every finished page (run after all content). */
  stampFooters(siteName: string): void {
    const pages = this.doc.getPages();
    pages.forEach((page, index) => {
      const label = `Page ${index + 1} of ${pages.length}`;
      const size = 9;
      const labelWidth = this.regular.widthOfTextAtSize(label, size);
      page.drawText(label, {
        x: (PAGE_WIDTH - labelWidth) / 2,
        y: FOOTER_BASELINE,
        size,
        font: this.regular,
        color: COLOR_MUTED,
      });
      const brandWidth = this.regular.widthOfTextAtSize(siteName, size);
      page.drawText(siteName, {
        x: PAGE_WIDTH - MARGIN - brandWidth,
        y: FOOTER_BASELINE,
        size,
        font: this.regular,
        color: COLOR_MUTED,
      });
    });
  }
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

function formatMinutes(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '';
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return `${minutes} min`;
}

function drawHeader(c: PdfComposer, test: Test): void {
  const title = sanitizeForPdf(test.title) || 'Untitled Test';
  c.writeLines(wrapText(title, c.bold, TITLE_SIZE, CONTENT_WIDTH), {
    size: TITLE_SIZE,
    bold: true,
  });
  c.gap(4);

  const subtitleParts = [
    sanitizeForPdf(test.topic),
    sanitizeForPdf(test.difficulty),
    Number.isFinite(test.year) ? String(test.year) : '',
  ].filter(Boolean);
  if (subtitleParts.length > 0) {
    c.writeLines([subtitleParts.join('  •  ')], { size: SUBTITLE_SIZE, color: COLOR_MUTED });
  }

  const metaParts = [
    `${test.questions.length} question${test.questions.length === 1 ? '' : 's'}`,
    Number.isFinite(test.totalPoints) ? `${test.totalPoints} points` : '',
    formatMinutes(test.totalTime),
  ].filter(Boolean);
  if (metaParts.length > 0) {
    c.writeLines([metaParts.join('  •  ')], { size: SUBTITLE_SIZE, color: COLOR_MUTED });
  }
  c.gap(6);

  const description = sanitizeForPdf(test.description);
  if (description) {
    c.writeLines(wrapText(description, c.regular, SUBTITLE_SIZE, CONTENT_WIDTH), {
      size: SUBTITLE_SIZE,
      color: COLOR_MUTED,
    });
    c.gap(4);
  }

  c.rule();

  // Name / Date / Score row for printed use
  c.writeLines(['Name ______________________________    Date ____________    Score _______'], {
    size: BODY_SIZE,
    color: COLOR_MUTED,
  });
  c.gap(12);
}

function drawQuestions(c: PdfComposer, test: Test): void {
  const letters = 'ABCDEFGHIJ';
  test.questions.forEach((question, index) => {
    // Keep at least the prompt plus one option/blank line together.
    c.ensure(2 * c.lineHeight(BODY_SIZE));

    const pointsLabel =
      Number.isFinite(question.points) && question.points > 0
        ? `  (${question.points} point${question.points === 1 ? '' : 's'})`
        : '';
    const prompt = sanitizeForPdf(question.question) || '(blank question)';
    c.writeLines(wrapText(`${index + 1}. ${prompt}${pointsLabel}`, c.regular, BODY_SIZE, CONTENT_WIDTH));
    c.gap(2);

    if (question.type === 'multiple-choice' && Array.isArray(question.options)) {
      question.options.slice(0, MAX_OPTIONS).forEach((option, optionIndex) => {
        const letter = letters[optionIndex] ?? '?';
        const text = `${letter}) ${sanitizeForPdf(option)}`;
        c.writeLines(wrapText(text, c.regular, BODY_SIZE, CONTENT_WIDTH - 18), { x: MARGIN + 18 });
      });
    } else {
      c.answerBlanks();
    }
    c.gap(QUESTION_GAP - 6);
  });
}

function drawAnswerKeyBody(c: PdfComposer, test: Test): void {
  test.questions.forEach((question, index) => {
    c.ensure(c.lineHeight(BODY_SIZE) * 2);
    const answer = sanitizeForPdf(question.correctAnswer) || '(no answer recorded)';
    c.writeLines(
      wrapText(`${index + 1}. ${answer}`, c.regular, BODY_SIZE, CONTENT_WIDTH),
      { }
    );
  });
}

function drawAnswerKey(c: PdfComposer, test: Test): void {
  c.addPage();
  c.writeLines(['Answer Key'], { size: HEADING_SIZE, bold: true });
  c.gap(4);
  c.rule();
  c.gap(6);
  drawAnswerKeyBody(c, test);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Build the test PDF and return the raw file bytes. */
export async function generateTestPdf(
  test: Test,
  options: TestPdfOptions = {}
): Promise<Uint8Array> {
  const {
    includeAnswerKey = true,
    answerKeyOnly = false,
    siteName = 'ScienceOlympiadTests',
  } = options;

  const c = await PdfComposer.create();

  if (answerKeyOnly) {
    // Standalone answer document (the companion file to the questions PDF):
    // identifying header, then the numbered key — no question text, no
    // name/score row.
    const title = sanitizeForPdf(test.title) || 'Untitled Test';
    c.writeLines(wrapText(title, c.bold, TITLE_SIZE, CONTENT_WIDTH), {
      size: TITLE_SIZE,
      bold: true,
    });
    c.gap(4);
    const metaParts = [
      sanitizeForPdf(test.topic),
      Number.isFinite(test.year) ? String(test.year) : '',
      `${test.questions.length} answers`,
    ].filter(Boolean);
    c.writeLines([metaParts.join('  •  ')], { size: SUBTITLE_SIZE, color: COLOR_MUTED });
    c.gap(6);
    c.rule();
    c.writeLines(['Answer Key'], { size: HEADING_SIZE, bold: true });
    c.gap(4);
    c.rule();
    c.gap(6);
    drawAnswerKeyBody(c, test);
  } else {
    drawHeader(c, test);
    drawQuestions(c, test);
    if (test.questions.length === 0) {
      c.writeLines(['This test has no questions.'], { color: COLOR_MUTED });
    }
    if (includeAnswerKey && test.questions.length > 0) {
      drawAnswerKey(c, test);
    }
  }

  c.stampFooters(sanitizeForPdf(siteName) || 'ScienceOlympiadTests');

  return c.doc.save();
}

/** Build a filesystem-safe attachment filename from a test title. */
export function buildPdfFilename(title: unknown, suffix?: string): string {
  const sanitized = sanitizeForPdf(title)
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 80)
    .replace(/^[_.-]+|[_.-]+$/g, '');
  const base = sanitized || 'test';
  return suffix ? `${base}_${suffix}.pdf` : `${base}.pdf`;
}

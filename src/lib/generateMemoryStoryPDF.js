import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { PDF_TEMPLATES, maskImageToCircle } from './generateStoryPDF';
import { downloadBlob, sanitizeExportFilename } from './downloadFile';

const MARGIN = 26;
const FOOTER_PAD = 28;
const MAX_IMAGE_DIM = 1000;
const IMAGE_TIMEOUT = 15000;

const RELATIONSHIP_LABELS = {
  daughter: 'My daughter',
  son: 'My son',
  wife: 'My wife',
  husband: 'My husband',
  mother: 'My mother',
  father: 'My father',
  grandchild: 'My grandchild',
  grandmother: 'My grandmother',
  grandfather: 'My grandfather',
  sister: 'My sister',
  brother: 'My brother',
  niece: 'My niece',
  nephew: 'My nephew',
  friend: 'My friend',
  partner: 'My partner',
  other: 'Someone special',
};

async function loadImage(url) {
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => { img.src = ''; resolve(null); }, IMAGE_TIMEOUT);
    img.onload = () => {
      clearTimeout(timer);
      try {
        let w = img.width;
        let h = img.height;
        if (w > MAX_IMAGE_DIM || h > MAX_IMAGE_DIM) {
          const ratio = Math.min(MAX_IMAGE_DIM / w, MAX_IMAGE_DIM / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve({ dataURL: canvas.toDataURL('image/jpeg', 0.82), width: w, height: h });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.src = url;
  });
}

function newPage(doc, c, pageW, pageH, num, runningTitle) {
  doc.addPage();
  doc.setFillColor(...c.bg);
  doc.rect(0, 0, pageW, pageH, 'F');
  doc.setDrawColor(...c.line);
  doc.setLineWidth(0.15);
  doc.rect(14, 14, pageW - 28, pageH - 28);
  doc.setTextColor(...c.textSoft);
  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.text(String(num), pageW / 2, pageH - 12, { align: 'center' });
  if (runningTitle) {
    doc.setFontSize(7);
    doc.text(runningTitle, pageW - MARGIN, 17, { align: 'right' });
  }
}

function ensureSpace(doc, c, pageW, pageH, needed, y, runningTitle) {
  if (y + needed > pageH - FOOTER_PAD) {
    newPage(doc, c, pageW, pageH, doc.getNumberOfPages(), runningTitle);
    return 34;
  }
  return y;
}

function measureLines(doc, text, fontSize, fontStyle, maxWidth) {
  doc.setFont('times', fontStyle);
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(text, maxWidth);
}

function lineBlockHeight(lineCount, lineHeight) {
  return lineCount > 0 ? lineCount * lineHeight : 0;
}

/** Circular profile photo — image is pre-masked on canvas; ring drawn in PDF. */
function drawCircleImage(doc, img, cx, centerY, diameter, c) {
  const r = diameter / 2;

  doc.setFillColor(...c.accentSoft);
  doc.setGState(new doc.GState({ opacity: 0.14 }));
  doc.circle(cx, centerY, r + 2.5, 'F');
  doc.setGState(new doc.GState({ opacity: 1 }));

  doc.addImage(img.dataURL, 'PNG', cx - r, centerY - r, diameter, diameter, null, 'FAST');

  doc.setDrawColor(...c.accent);
  doc.setLineWidth(1.1);
  doc.circle(cx, centerY, r, 'S');

  doc.setDrawColor(...c.cream);
  doc.setLineWidth(0.35);
  doc.circle(cx, centerY, r - 0.6, 'S');
}

/** Keep title with at least the opening lines of the message on one page. */
function ensureMemoryBlockStart(doc, c, pageW, pageH, y, memory, runningTitle, photoHeight = 0) {
  const contentW = pageW - MARGIN * 2;
  let keepTogether = 0;

  if (memoryDate(memory)) keepTogether += 9;

  if (memory.title) {
    const titleLines = measureLines(doc, memory.title, 14, 'bold', contentW);
    keepTogether += lineBlockHeight(titleLines.length, 7) + 2;
  }

  if (photoHeight > 0) keepTogether += photoHeight + 8;

  if (memory.content?.trim()) {
    const quoted = `\u201C${memory.content.trim()}\u201D`;
    const quoteLines = measureLines(doc, quoted, 12, 'normal', contentW - 8);
    const fullQuoteH = lineBlockHeight(quoteLines.length, 7.2) + 8;
    // At least ~4 lines with the title, or the whole message if it is short.
    const minQuoteH = Math.min(fullQuoteH, lineBlockHeight(Math.min(quoteLines.length, 4), 7.2) + 8);
    keepTogether += minQuoteH;
  } else if (memory.memory_type === 'voice' || memory.memory_type === 'video') {
    keepTogether += 30;
  }

  keepTogether += 6;
  return ensureSpace(doc, c, pageW, pageH, keepTogether, y, runningTitle);
}

function drawFooter(doc, c, pageW, pageH) {
  doc.setTextColor(...c.textSoft);
  doc.setFont('times', 'italic');
  doc.setFontSize(7);
  doc.text('ETERN8', pageW / 2, pageH - 8, { align: 'center' });
}

function relationshipLabel(person) {
  if (!person?.relationship) return null;
  return RELATIONSHIP_LABELS[person.relationship] || RELATIONSHIP_LABELS.other;
}

function memoryDate(memory) {
  const raw = memory.memory_date || memory.created_date;
  return raw ? format(new Date(raw), 'MMMM d, yyyy') : null;
}

function sortByDateOldestFirst(a, b) {
  return new Date(a.memory_date || a.created_date) - new Date(b.memory_date || b.created_date);
}

function drawCollectionCover(doc, c, pageW, pageH, creatorName, memoryCount, personCount) {
  doc.setFillColor(...c.bg);
  doc.rect(0, 0, pageW, pageH, 'F');

  doc.setDrawColor(...c.accentSoft);
  doc.setLineWidth(0.35);
  doc.roundedRect(18, 18, pageW - 36, pageH - 36, 5, 5, 'S');

  let y = 58;
  doc.setTextColor(...c.text);
  doc.setFont('times', 'bold');
  doc.setFontSize(30);
  doc.text('Memory Stories', pageW / 2, y, { align: 'center' });
  y += 14;

  doc.setDrawColor(...c.accent);
  doc.setLineWidth(0.3);
  doc.line(pageW / 2 - 36, y, pageW / 2 + 36, y);
  doc.setFillColor(...c.accent);
  doc.circle(pageW / 2, y, 1.3, 'F');
  y += 14;

  doc.setTextColor(...c.textSoft);
  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  const subtitle = 'Messages you saved for the people you love — gathered in the order they were written.';
  const lines = doc.splitTextToSize(subtitle, pageW - 56);
  lines.forEach((line, i) => {
    doc.text(line, pageW / 2, y + i * 7, { align: 'center' });
  });
  y += lines.length * 7 + 18;

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...c.text);
  doc.text(
    `${memoryCount} ${memoryCount === 1 ? 'memory' : 'memories'}  ·  ${personCount} ${personCount === 1 ? 'person' : 'people'}`,
    pageW / 2,
    y,
    { align: 'center' },
  );

  if (creatorName) {
    doc.setTextColor(...c.textSoft);
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.text(`Saved by ${creatorName}`, pageW / 2, pageH - 34, { align: 'center' });
  }
  doc.text(format(new Date(), 'MMMM d, yyyy'), pageW / 2, pageH - 26, { align: 'center' });
}

/**
 * Profile block — photo, name, relationship, cover message (matches in-app profile).
 */
async function drawPersonProfileHeader(doc, c, pageW, pageH, y, person, runningTitle) {
  const name = person.name || 'Someone special';
  const cx = pageW / 2;
  const photoSize = 46;
  const r = photoSize / 2;

  y = ensureSpace(doc, c, pageW, pageH, photoSize + 52, y, runningTitle);

  if (person.photo_url) {
    const img = await loadImage(person.photo_url);
    const centerY = y + r;

    if (img) {
      const circular = await maskImageToCircle(img, 320);
      if (circular) {
        drawCircleImage(doc, circular, cx, centerY, photoSize, c);
      } else {
        doc.setFillColor(...c.light);
        doc.circle(cx, centerY, r, 'F');
        doc.setDrawColor(...c.accentSoft);
        doc.setLineWidth(0.8);
        doc.circle(cx, centerY, r, 'S');
      }
    } else {
      doc.setFillColor(...c.light);
      doc.circle(cx, centerY, r, 'F');
      doc.setDrawColor(...c.accentSoft);
      doc.setLineWidth(0.8);
      doc.circle(cx, centerY, r, 'S');
    }

    y = centerY + r + 14;
  } else {
    y += 4;
  }

  doc.setTextColor(...c.text);
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.text(name, cx, y, { align: 'center' });
  y += 10;

  const rel = relationshipLabel(person);
  if (rel) {
    doc.setTextColor(...c.textSoft);
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.text(rel, cx, y, { align: 'center' });
    y += 10;
  }

  if (person.personal_notes?.trim()) {
    y = ensureSpace(doc, c, pageW, pageH, 28, y, runningTitle);
    const boxW = pageW - MARGIN * 2 - 16;
    const boxX = MARGIN + 8;
    const noteQuoted = `\u201C${person.personal_notes.trim()}\u201D`;

    doc.setFont('times', 'italic');
    doc.setFontSize(11);
    const noteLines = doc.splitTextToSize(noteQuoted, boxW - 16);
    const boxH = noteLines.length * 6.2 + 12;

    doc.setFillColor(...c.light);
    doc.roundedRect(boxX, y, boxW, boxH, 4, 4, 'F');
    doc.setDrawColor(...c.line);
    doc.setLineWidth(0.25);
    doc.roundedRect(boxX, y, boxW, boxH, 4, 4, 'S');

    doc.setTextColor(...c.text);
    noteLines.forEach((line, i) => {
      doc.text(line, cx, y + 9 + i * 6.2, { align: 'center' });
    });
    y += boxH + 14;
  } else {
    y += 6;
  }

  doc.setDrawColor(...c.accentSoft);
  doc.setLineWidth(0.25);
  doc.line(MARGIN + 16, y, pageW - MARGIN - 16, y);
  y += 12;

  return y;
}

function drawQuotedPassage(doc, c, pageW, pageH, y, text, runningTitle, { orphanSafe = false } = {}) {
  const contentW = pageW - MARGIN * 2;
  const textX = MARGIN + 4;
  const textW = contentW - 8;
  const quotedText = `\u201C${text.trim()}\u201D`;

  doc.setTextColor(...c.text);
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.setLineHeightFactor(1.65);
  const lines = doc.splitTextToSize(quotedText, textW);

  for (let i = 0; i < lines.length; i += 1) {
    if (!orphanSafe || i > 0) {
      y = ensureSpace(doc, c, pageW, pageH, 10, y, runningTitle);
    }
    doc.text(lines[i], textX, y);
    y += 7.2;
  }

  return y + 8;
}

function drawMediaPlaceholder(doc, c, pageW, pageH, y, memory, runningTitle, includeManifestNote) {
  const contentW = pageW - MARGIN * 2;
  const isVoice = memory.memory_type === 'voice';
  const label = isVoice ? 'Voice recording' : 'Video message';
  const detail = includeManifestNote
    ? (isVoice
      ? 'A voice recording was saved with this memory. See media-manifest.json in your data export for the file.'
      : 'A video was saved with this memory. See media-manifest.json in your data export for the file.')
    : (isVoice
      ? 'A voice recording was saved with this memory in ETERN8.'
      : 'A video was saved with this memory in ETERN8.');

  y = ensureSpace(doc, c, pageW, pageH, 32, y, runningTitle);

  doc.setFillColor(...c.light);
  doc.roundedRect(MARGIN, y, contentW, 26, 4, 4, 'F');
  doc.setDrawColor(...c.accentSoft);
  doc.setLineWidth(0.25);
  doc.roundedRect(MARGIN, y, contentW, 26, 4, 4, 'S');

  doc.setTextColor(...c.accent);
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text(`${isVoice ? '\u266A' : '\u25B6'}  ${label}`, MARGIN + 8, y + 10);

  doc.setTextColor(...c.textSoft);
  doc.setFont('times', 'italic');
  doc.setFontSize(8.5);
  const detailLines = doc.splitTextToSize(detail, contentW - 18);
  detailLines.forEach((line, i) => {
    doc.text(line, MARGIN + 8, y + 16 + i * 4.5);
  });

  return y + 30;
}

async function drawMemoryEntry(doc, c, pageW, pageH, y, memory, runningTitle, includeManifestNote) {
  const contentW = pageW - MARGIN * 2;
  let photoImg = null;
  let photoHeight = 0;
  let photoWidth = 0;

  if (memory.memory_type === 'photo' && memory.media_url) {
    photoImg = await loadImage(memory.media_url);
    if (photoImg) {
      const maxH = 90;
      const ratio = Math.min(contentW / photoImg.width, maxH / photoImg.height, 1);
      photoWidth = Math.round(photoImg.width * ratio);
      photoHeight = Math.round(photoImg.height * ratio);
    }
  }

  y = ensureMemoryBlockStart(doc, c, pageW, pageH, y, memory, runningTitle, photoHeight);

  const dateStr = memoryDate(memory);
  if (dateStr) {
    doc.setTextColor(...c.accent);
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.text(dateStr, MARGIN, y);
    y += 9;
  }

  if (memory.title) {
    doc.setTextColor(...c.text);
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    const titleLines = doc.splitTextToSize(memory.title, contentW);
    titleLines.forEach((line) => {
      doc.text(line, MARGIN, y);
      y += 7;
    });
    y += 2;
  }

  if (photoImg && photoHeight > 0) {
    doc.addImage(photoImg.dataURL, 'JPEG', MARGIN, y, photoWidth, photoHeight, null, 'FAST');
    y += photoHeight + 8;
  }

  if (memory.content?.trim()) {
    y = drawQuotedPassage(doc, c, pageW, pageH, y, memory.content, runningTitle, { orphanSafe: true });
  } else if (memory.memory_type === 'voice' || memory.memory_type === 'video') {
    y = drawMediaPlaceholder(doc, c, pageW, pageH, y, memory, runningTitle, includeManifestNote);
  }

  if ((memory.memory_type === 'voice' || memory.memory_type === 'video') && memory.content?.trim()) {
    y = drawMediaPlaceholder(doc, c, pageW, pageH, y, memory, runningTitle, includeManifestNote);
  }

  return y + 6;
}

function groupMemoriesByLovedOne(memories, lovedOnes) {
  const byId = new Map();
  for (const person of lovedOnes) {
    byId.set(person.id, { person, memories: [] });
  }

  const unassigned = [];
  for (const memory of memories.filter((m) => m.created_by_id).sort(sortByDateOldestFirst)) {
    if (memory.loved_one_id && byId.has(memory.loved_one_id)) {
      byId.get(memory.loved_one_id).memories.push(memory);
    } else {
      unassigned.push(memory);
    }
  }

  const chapters = [...byId.values()].filter((ch) => ch.memories.length > 0);
  if (unassigned.length) {
    chapters.push({
      person: { name: 'General memories', id: '__general__' },
      memories: unassigned,
    });
  }
  return chapters;
}

/**
 * Printable memory story — profile header per person, messages in quotation marks.
 * @returns {Promise<Blob>}
 */
export async function generateMemoryStoryPDF({
  memories = [],
  lovedOnes = [],
  privateNotes = [],
  creatorName = null,
  templateId = 'warm',
  download = true,
  filename = null,
  includeManifestNote = false,
}) {
  const template = PDF_TEMPLATES.find((t) => t.id === templateId) || PDF_TEMPLATES[1];
  const c = template.colors;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;

  const chapters = groupMemoriesByLovedOne(memories, lovedOnes);
  const memoryCount = memories.filter((m) => m.created_by_id).length;
  const isSinglePerson = chapters.length === 1 && lovedOnes.length <= 1;

  let pageNum = 1;
  let runningTitle = isSinglePerson
    ? (chapters[0]?.person?.name || 'Memory Story')
    : 'Memory Stories';

  if (!isSinglePerson) {
    drawCollectionCover(doc, c, pageW, pageH, creatorName, memoryCount, chapters.length || lovedOnes.length);
  }

  for (let index = 0; index < chapters.length; index += 1) {
    const chapter = chapters[index];
    const personTitle = chapter.person.name || 'Someone special';
    runningTitle = isSinglePerson ? personTitle : 'Memory Stories';

    if (isSinglePerson && index === 0) {
      doc.setFillColor(...c.bg);
      doc.rect(0, 0, pageW, pageH, 'F');
      doc.setDrawColor(...c.line);
      doc.setLineWidth(0.15);
      doc.rect(14, 14, pageW - 28, pageH - 28);
    } else {
      pageNum += 1;
      newPage(doc, c, pageW, pageH, pageNum, runningTitle);
    }

    let y = isSinglePerson ? 36 : 34;
    y = await drawPersonProfileHeader(doc, c, pageW, pageH, y, chapter.person, runningTitle);

    for (const memory of chapter.memories) {
      y = await drawMemoryEntry(doc, c, pageW, pageH, y, memory, runningTitle, includeManifestNote);
    }

    drawFooter(doc, c, pageW, pageH);
  }

  if (privateNotes.length > 0) {
    pageNum += 1;
    newPage(doc, c, pageW, pageH, pageNum, runningTitle);
    let y = await drawPersonProfileHeader(
      doc,
      c,
      pageW,
      pageH,
      34,
      { name: 'Private notes', relationship: 'other' },
      runningTitle,
    );

    for (const note of [...privateNotes].sort(sortByDateOldestFirst)) {
      const pseudoMemory = {
        title: note.title,
        content: note.content,
        memory_date: note.created_date,
        created_date: note.created_date,
        memory_type: 'text',
        created_by_id: note.created_by_id,
      };
      y = await drawMemoryEntry(doc, c, pageW, pageH, y, pseudoMemory, runningTitle, includeManifestNote);
    }
    drawFooter(doc, c, pageW, pageH);
  }

  const pdfBlob = doc.output('blob');
  const defaultName = isSinglePerson && chapters[0]?.person?.name
    ? `${sanitizeExportFilename(chapters[0].person.name)}_Memory_Story.pdf`
    : `${sanitizeExportFilename(creatorName || 'My')}_Memory_Stories.pdf`;
  const outName = filename || defaultName;

  if (download) {
    downloadBlob(pdfBlob, outName);
  }

  return pdfBlob;
}

/** @deprecated Use generateMemoryStoryPDF */
export const generateFinalWordsPDF = generateMemoryStoryPDF;

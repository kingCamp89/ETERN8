import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

// ══════════════════════════════════════════════════════════════════════
// PREMIUM PDF THEMES — warm, elegant, timeless
// ══════════════════════════════════════════════════════════════════════
export const PDF_TEMPLATES = [
  {
    id: 'blush',
    name: 'Blush Rose',
    description: 'Delicate rose & cream',
    preview: { bg: '#fdf6f8', accent: '#c4708a', text: '#3d2028' },
    colors: {
      bg:         [253, 246, 248],
      accent:     [196, 112, 138],
      accentSoft: [220, 180, 190],
      text:       [61, 32, 40],
      textSoft:   [140, 110, 120],
      line:       [225, 200, 210],
      light:      [250, 240, 244],
      cream:      [255, 250, 252],
    },
  },
  {
    id: 'warm',
    name: 'Golden Light',
    description: 'Warm gold & cream',
    preview: { bg: '#fdf9f4', accent: '#c48046', text: '#3d2818' },
    colors: {
      bg:         [253, 249, 244],
      accent:     [190, 125, 65],
      accentSoft: [215, 175, 130],
      text:       [61, 40, 24],
      textSoft:   [150, 130, 110],
      line:       [225, 210, 190],
      light:      [248, 242, 234],
      cream:      [255, 252, 248],
    },
  },
  {
    id: 'sepia',
    name: 'Vintage Sepia',
    description: 'Soft sepia & ivory',
    preview: { bg: '#faf7f2', accent: '#a0784a', text: '#2d2216' },
    colors: {
      bg:         [250, 247, 242],
      accent:     [160, 120, 74],
      accentSoft: [195, 170, 140],
      text:       [45, 34, 22],
      textSoft:   [145, 130, 115],
      line:       [220, 208, 190],
      light:      [245, 240, 232],
      cream:      [255, 252, 248],
    },
  },
  {
    id: 'sage',
    name: 'Sage Garden',
    description: 'Calm sage & parchment',
    preview: { bg: '#f4f8f5', accent: '#5a8f71', text: '#1f2e26' },
    colors: {
      bg:         [244, 248, 245],
      accent:     [90, 143, 113],
      accentSoft: [180, 210, 190],
      text:       [31, 46, 38],
      textSoft:   [100, 130, 115],
      line:       [210, 225, 215],
      light:      [235, 245, 238],
      cream:      [250, 252, 250],
    },
  },
];

// ══════════════════════════════════════════════════════════════════════
// LAYOUT CONSTANTS
// ══════════════════════════════════════════════════════════════════════
const MARGIN = 28;
const FOOTER_PAD = 30;
const MAX_IMAGE_DIM = 1200;
const IMAGE_TIMEOUT = 15000;

// ══════════════════════════════════════════════════════════════════════
// IMAGE LOADING — safe, compressed, timeout-protected
// ══════════════════════════════════════════════════════════════════════
async function loadImage(url) {
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => { img.src = ''; resolve(null); }, IMAGE_TIMEOUT);
    img.onload = () => {
      clearTimeout(timer);
      try {
        let w = img.width, h = img.height;
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
      } catch (_) { resolve(null); }
    };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.src = url;
  });
}

/** Circular crop with object-fit: cover — baked into pixels (jsPDF circle clip is unreliable). */
export function maskImageToCircle(img, pixelSize = 320) {
  if (!img?.dataURL) return Promise.resolve(null);
  return new Promise((resolve) => {
    const imageEl = new Image();
    const timer = setTimeout(() => { imageEl.src = ''; resolve(null); }, IMAGE_TIMEOUT);
    imageEl.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = pixelSize;
        canvas.height = pixelSize;
        const ctx = canvas.getContext('2d');
        const r = pixelSize / 2;
        const scale = Math.max(pixelSize / imageEl.width, pixelSize / imageEl.height);
        const w = imageEl.width * scale;
        const h = imageEl.height * scale;
        const x = (pixelSize - w) / 2;
        const y = (pixelSize - h) / 2;
        ctx.beginPath();
        ctx.arc(r, r, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(imageEl, x, y, w, h);
        resolve({ dataURL: canvas.toDataURL('image/png'), width: pixelSize, height: pixelSize });
      } catch (_) {
        resolve(null);
      }
    };
    imageEl.onerror = () => { clearTimeout(timer); resolve(null); };
    imageEl.src = img.dataURL;
  });
}

// ══════════════════════════════════════════════════════════════════════
// PAGE HELPERS
// ══════════════════════════════════════════════════════════════════════
function newPage(doc, c, pageW, pageH, num, title) {
  doc.addPage();
  doc.setFillColor(...c.bg);
  doc.rect(0, 0, pageW, pageH, 'F');
  // Subtle double-line border
  doc.setDrawColor(...c.line);
  doc.setLineWidth(0.15);
  doc.rect(14, 14, pageW - 28, pageH - 28);
  doc.setLineWidth(0.3);
  doc.rect(16, 16, pageW - 32, pageH - 32);
  // Page number
  doc.setTextColor(...c.textSoft);
  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.text(String(num), pageW / 2, pageH - 14, { align: 'center' });
  // Running title
  doc.setFontSize(7);
  if (title) doc.text(title, pageW - MARGIN, 18, { align: 'right' });
}

function ensureSpace(doc, c, pageW, pageH, needed, y, title) {
  if (y + needed > pageH - FOOTER_PAD) {
    newPage(doc, c, pageW, pageH, doc.getNumberOfPages() + 1, title);
    return 32;
  }
  return y;
}

function drawSoftDivider(doc, c, pageW, y) {
  y += 6;
  doc.setDrawColor(...c.accentSoft);
  doc.setLineWidth(0.2);
  const mid = pageW / 2;
  doc.line(MARGIN + 4, y, mid - 6, y);
  doc.line(mid + 6, y, pageW - MARGIN - 4, y);
  // Small ornament dot
  doc.setFillColor(...c.accent);
  doc.setGState(new doc.GState({ opacity: 0.6 }));
  doc.circle(mid, y, 1, 'F');
  doc.setGState(new doc.GState({ opacity: 1 }));
  return y + 10;
}

function drawFooter(doc, c, pageW, pageH, creatorName) {
  doc.setTextColor(...c.textSoft);
  doc.setFont('times', 'italic');
  doc.setFontSize(7);
  doc.text('Created with ETRN8', pageW / 2, pageH - 10, { align: 'center' });
}

function sanitizeFilename(name) {
  return (name || 'Memory_Book')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 80);
}

// ══════════════════════════════════════════════════════════════════════
// COVER PAGE
// ══════════════════════════════════════════════════════════════════════
async function drawCover(doc, c, pageW, pageH, person, memories, creatorName) {
  doc.setFillColor(...c.bg);
  doc.rect(0, 0, pageW, pageH, 'F');

  // Soft decorative frame — rounded inner rect
  doc.setDrawColor(...c.accentSoft);
  doc.setLineWidth(0.3);
  doc.setGState(new doc.GState({ opacity: 0.5 }));
  doc.roundedRect(16, 16, pageW - 32, pageH - 32, 6, 6, 'S');
  doc.setGState(new doc.GState({ opacity: 1 }));

  let coverY = 36;

  // Cover photo — soft circle with glow
  if (person.photo_url) {
    const img = await loadImage(person.photo_url);
    const size = 48;
    const cx = pageW / 2;
    const cy = coverY + size / 2;
    const r = size / 2;

    if (img) {
      const circular = await maskImageToCircle(img, 320);
      // Soft glow behind photo
      doc.setFillColor(...c.accentSoft);
      doc.setGState(new doc.GState({ opacity: 0.15 }));
      doc.circle(cx, cy, r + 4, 'F');
      doc.setGState(new doc.GState({ opacity: 1 }));

      if (circular) {
        doc.addImage(circular.dataURL, 'PNG', cx - r, coverY, size, size, null, 'FAST');
      }
    } else {
      doc.setFillColor(...c.light);
      doc.setGState(new doc.GState({ opacity: 0.3 }));
      doc.circle(cx, cy, r + 4, 'F');
      doc.circle(cx, cy, r, 'F');
      doc.setGState(new doc.GState({ opacity: 1 }));
    }

    // Frame ring
    doc.setDrawColor(...c.accent);
    doc.setLineWidth(1.8);
    doc.circle(cx, cy, r, 'S');
    coverY += size + 16;
  } else {
    coverY += 20;
  }

  // Name
  doc.setTextColor(...c.text);
  doc.setFont('times', 'bold');
  doc.setFontSize(30);
  const name = person.name || 'In Loving Memory';
  const nameLines = doc.splitTextToSize(name, pageW - 80);
  nameLines.forEach((line, i) => {
    doc.text(line, pageW / 2, coverY + i * 12, { align: 'center' });
  });
  coverY += nameLines.length * 12 + 8;

  // Subtitle
  doc.setTextColor(...c.textSoft);
  doc.setFont('times', 'italic');
  doc.setFontSize(15);
  doc.text('A collection of moments, memories, and love', pageW / 2, coverY, { align: 'center' });
  coverY += 14;

  // Ornament line
  doc.setDrawColor(...c.accent);
  doc.setLineWidth(0.3);
  doc.line(pageW / 2 - 35, coverY, pageW / 2 + 35, coverY);
  doc.setFillColor(...c.accent);
  doc.circle(pageW / 2, coverY, 1.4, 'F');
  coverY += 14;

  // Date range
  if (memories.length > 0) {
    const dates = memories.map(m => m.memory_date || m.created_date).sort();
    const first = format(new Date(dates[0]), 'MMMM yyyy');
    const last = format(new Date(dates[dates.length - 1]), 'MMMM yyyy');
    doc.setFont('times', 'italic');
    doc.setFontSize(11);
    doc.text(`${first} — ${last}`, pageW / 2, coverY, { align: 'center' });
    coverY += 8;
  }

  // Memory count
  doc.setFontSize(10);
  doc.setTextColor(...c.textSoft);
  doc.text(`${memories.length} cherished ${memories.length === 1 ? 'memory' : 'memories'}`, pageW / 2, coverY, { align: 'center' });

  // Opening line at bottom
  doc.setTextColor(...c.accent);
  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  const openingLine = 'Some memories are too precious to leave behind.';
  doc.text(openingLine, pageW / 2, pageH - 42, { align: 'center' });
  doc.setTextColor(...c.textSoft);
  doc.setFontSize(9);
  doc.text('This book holds the moments, words, and love that matter most.', pageW / 2, pageH - 34, { align: 'center' });

  if (creatorName) {
    doc.setFontSize(8);
    doc.text(`Prepared by ${creatorName}`, pageW / 2, pageH - 26, { align: 'center' });
  }
}

// ══════════════════════════════════════════════════════════════════════
// OPENING LETTER PAGE
// ══════════════════════════════════════════════════════════════════════
function drawOpeningLetter(doc, c, pageW, pageH, person, pageNum) {
  newPage(doc, c, pageW, pageH, pageNum, person.name);

  const contentW = pageW - MARGIN * 2;
  const centerY = pageH / 2 - 20;

  // Ornament top
  doc.setDrawColor(...c.accent);
  doc.setLineWidth(0.3);
  doc.line(pageW / 2 - 25, centerY - 30, pageW / 2 + 25, centerY - 30);
  doc.circle(pageW / 2, centerY - 30, 1.2, 'F');

  // Letter text
  doc.setTextColor(...c.text);
  doc.setFont('times', 'normal');
  doc.setFontSize(13);

  const letterText = 'This book was created to preserve the stories, moments, and love that shaped a life. May these memories bring comfort, laughter, connection, and a feeling of closeness whenever they are read.';
  const lines = doc.splitTextToSize(letterText, contentW - 20);
  lines.forEach((line, i) => {
    doc.text(line, pageW / 2, centerY - 10 + i * 9, { align: 'center' });
  });

  // Ornament bottom
  const afterLetter = centerY - 10 + lines.length * 9 + 14;
  doc.setDrawColor(...c.accent);
  doc.setLineWidth(0.3);
  doc.line(pageW / 2 - 25, afterLetter, pageW / 2 + 25, afterLetter);
  doc.circle(pageW / 2, afterLetter, 1.2, 'F');

  // Closing
  doc.setTextColor(...c.textSoft);
  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.text('\u2014 With love', pageW / 2, afterLetter + 14, { align: 'center' });

  drawFooter(doc, c, pageW, pageH, person.name);
}

// ══════════════════════════════════════════════════════════════════════
// MEMORY PAGE
// ══════════════════════════════════════════════════════════════════════
async function drawMemoryPage(doc, c, pageW, pageH, memory, person, pageNum) {
  const contentW = pageW - MARGIN * 2;
  newPage(doc, c, pageW, pageH, pageNum, person.name);
  let y = 32;

  // ── Date ──
  const dateStr = memory.memory_date
    ? format(new Date(memory.memory_date), 'MMMM d, yyyy')
    : format(new Date(memory.created_date), 'MMMM d, yyyy');

  doc.setTextColor(...c.accent);
  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.text(dateStr, MARGIN, y);
  y += 8;

  // ── Title ──
  doc.setTextColor(...c.text);
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  const titleLines = doc.splitTextToSize(memory.title, contentW - 4);
  titleLines.forEach((line) => {
    y = ensureSpace(doc, c, pageW, pageH, 12, y, person.name);
    doc.text(line, MARGIN, y);
    y += 11;
  });

  // ── Divider ──
  y = drawSoftDivider(doc, c, pageW, y);

  // ── Location ──
  if (memory.location_name) {
    doc.setTextColor(...c.textSoft);
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.text(memory.location_name, MARGIN, y);
    y += 12;
  }

  // ── Emotion ──
  if (memory.emotion) {
    doc.setTextColor(...c.accent);
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.text(memory.emotion, MARGIN, y);
    y += 14;
  }

  // ── Photo ──
  if (memory.memory_type === 'photo' && memory.media_url) {
    const img = await loadImage(memory.media_url);
    if (img) {
      const maxW = contentW;
      const maxH = 130;
      let imgW = img.width, imgH = img.height;
      if (imgW > maxW || imgH > maxH) {
        const ratio = Math.min(maxW / imgW, maxH / imgH);
        imgW = Math.round(imgW * ratio);
        imgH = Math.round(imgH * ratio);
      }

      y = ensureSpace(doc, c, pageW, pageH, imgH + 14, y, person.name);

      // Soft shadow
      doc.setFillColor(...c.accentSoft);
      doc.setGState(new doc.GState({ opacity: 0.12 }));
      doc.roundedRect(MARGIN + 1.5, y + 1.5, imgW, imgH, 3, 3, 'F');
      doc.setGState(new doc.GState({ opacity: 1 }));

      // Clipped image with rounded corners
      doc.saveGraphicsState();
      doc.roundedRect(MARGIN, y, imgW, imgH, 3, 3, 'C');
      doc.clip();
      doc.addImage(img.dataURL, 'JPEG', MARGIN, y, imgW, imgH, null, 'FAST');
      doc.restoreGraphicsState();

      // Subtle border
      doc.setDrawColor(...c.line);
      doc.setLineWidth(0.3);
      doc.roundedRect(MARGIN, y, imgW, imgH, 3, 3, 'S');

      y += imgH + 12;
    }
  }

  // ── Voice ──
  if (memory.memory_type === 'voice') {
    y = ensureSpace(doc, c, pageW, pageH, 36, y, person.name);
    doc.setFillColor(...c.light);
    doc.roundedRect(MARGIN, y, contentW, 28, 5, 5, 'F');
    doc.setDrawColor(...c.accentSoft);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, y, contentW, 28, 5, 5, 'S');

    doc.setTextColor(...c.accent);
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('\u266A  Voice Message', MARGIN + 10, y + 11);

    doc.setTextColor(...c.textSoft);
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    const voiceNote = 'A voice message is preserved with this memory and can be listened to in the ETRN8 app.';
    const voiceLines = doc.splitTextToSize(voiceNote, contentW - 24);
    voiceLines.forEach((line, i) => {
      doc.text(line, MARGIN + 10, y + 19 + i * 5);
    });
    y += 34;
  }

  // ── Video ──
  if (memory.memory_type === 'video') {
    y = ensureSpace(doc, c, pageW, pageH, 36, y, person.name);
    doc.setFillColor(...c.light);
    doc.roundedRect(MARGIN, y, contentW, 28, 5, 5, 'F');
    doc.setDrawColor(...c.accentSoft);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, y, contentW, 28, 5, 5, 'S');

    doc.setTextColor(...c.accent);
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('\u25B6  Video', MARGIN + 10, y + 11);

    doc.setTextColor(...c.textSoft);
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.text('A video has been saved with this memory and can be viewed in the app.', MARGIN + 10, y + 19);
    y += 34;
  }

  // ── Content ──
  if (memory.content) {
    y = ensureSpace(doc, c, pageW, pageH, 40, y, person.name);
    y += 4;

    // Opening quote
    doc.setTextColor(...c.accentSoft);
    doc.setFont('times', 'italic');
    doc.setFontSize(34);
    doc.setGState(new doc.GState({ opacity: 0.45 }));
    doc.text('\u201C', MARGIN - 2, y - 4);
    doc.setGState(new doc.GState({ opacity: 1 }));

    // Body text
    const textX = MARGIN + 8;
    const textW = contentW - 14;
    doc.setTextColor(...c.text);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.setLineHeightFactor(1.6);
    const contentLines = doc.splitTextToSize(memory.content, textW);

    contentLines.forEach((line, ci) => {
      const lineY = y + ci * 7.5;
      if (lineY > pageH - FOOTER_PAD - 5) {
        const ny = ensureSpace(doc, c, pageW, pageH, 10, lineY, person.name);
        doc.text(line, textX, ny);
      } else {
        doc.text(line, textX, lineY);
      }
    });
    y += contentLines.length * 7.5;

    // Closing quote
    y = ensureSpace(doc, c, pageW, pageH, 16, y, person.name);
    doc.setTextColor(...c.accentSoft);
    doc.setFont('times', 'italic');
    doc.setFontSize(34);
    doc.setGState(new doc.GState({ opacity: 0.45 }));
    doc.text('\u201D', MARGIN - 2, y + 2);
    doc.setGState(new doc.GState({ opacity: 1 }));
    y += 14;
  }

  // ── Tags ──
  if (memory.tags && memory.tags.length > 0) {
    y = ensureSpace(doc, c, pageW, pageH, 10, y, person.name);
    y += 4;
    doc.setTextColor(...c.textSoft);
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.text(memory.tags.map(t => `\u00B7 ${t}`).join('  '), MARGIN, y);
    y += 8;
  }

  drawFooter(doc, c, pageW, pageH, person.name);
}

// ══════════════════════════════════════════════════════════════════════
// CLOSING PAGE
// ══════════════════════════════════════════════════════════════════════
function drawClosingPage(doc, c, pageW, pageH, person, creatorName, pageNum) {
  newPage(doc, c, pageW, pageH, pageNum, person.name);

  const centerY = pageH / 2 - 30;
  const contentW = pageW - MARGIN * 2;

  // Ornament top
  doc.setDrawColor(...c.accent);
  doc.setLineWidth(0.3);
  doc.line(pageW / 2 - 30, centerY - 16, pageW / 2 + 30, centerY - 16);
  doc.circle(pageW / 2, centerY - 16, 1.2, 'F');

  // Main message
  doc.setTextColor(...c.text);
  doc.setFont('times', 'normal');
  doc.setFontSize(13);

  const message = 'These memories are more than words and pictures. They are pieces of a life, reminders of love, and proof that the moments we share can stay with us forever.';
  const lines = doc.splitTextToSize(message, contentW - 20);

  lines.forEach((line, i) => {
    doc.text(line, pageW / 2, centerY + i * 9, { align: 'center' });
  });

  const afterMessage = centerY + lines.length * 9 + 16;

  // Ornament
  doc.setDrawColor(...c.accent);
  doc.setLineWidth(0.3);
  doc.line(pageW / 2 - 30, afterMessage, pageW / 2 + 30, afterMessage);
  doc.circle(pageW / 2, afterMessage, 1.2, 'F');

  // Signature area
  let sigY = afterMessage + 20;

  if (creatorName) {
    doc.setTextColor(...c.text);
    doc.setFont('times', 'italic');
    doc.setFontSize(14);
    doc.text('With love,', pageW / 2, sigY, { align: 'center' });
    sigY += 8;

    doc.setFont('times', 'bold');
    doc.setFontSize(15);
    doc.text(creatorName, pageW / 2, sigY + 6, { align: 'center' });
    sigY += 16;
  }

  doc.setTextColor(...c.textSoft);
  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.text(format(new Date(), 'MMMM d, yyyy'), pageW / 2, sigY, { align: 'center' });

  drawFooter(doc, c, pageW, pageH, person.name);
}

// ══════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════
export async function generateStoryPDF(person, memories, templateId = 'warm', creatorName = null) {
  const template = PDF_TEMPLATES.find(t => t.id === templateId) || PDF_TEMPLATES[1];
  const c = template.colors;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;

  const printable = memories
    .filter(m => m.created_by_id)
    .sort((a, b) => new Date(a.memory_date || a.created_date) - new Date(b.memory_date || b.created_date));

  // ── Cover ──
  await drawCover(doc, c, pageW, pageH, person, printable, creatorName);

  // ── Opening letter ──
  drawOpeningLetter(doc, c, pageW, pageH, person, 2);

  // ── Memory pages ──
  let pageNum = 2;
  for (let i = 0; i < printable.length; i++) {
    pageNum++;
    await drawMemoryPage(doc, c, pageW, pageH, printable[i], person, pageNum);
  }

  // ── Closing page ──
  pageNum++;
  drawClosingPage(doc, c, pageW, pageH, person, creatorName, pageNum);

  // ── Output ──
  const pdfBlob = doc.output('blob');
  const filename = `${sanitizeFilename(person.name)}_Memory_Book.pdf`;

  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);

  return pdfBlob;
}
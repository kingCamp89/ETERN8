import JSZip from 'jszip';
import { format } from 'date-fns';
import { gatherUserData } from './gatherUserData';
import { buildMediaManifest } from './buildMediaManifest';
import { generateMemoryStoryPDF } from './generateMemoryStoryPDF';
import { downloadBlob, sanitizeExportFilename } from './downloadFile';

const README = `ETERN8 — Personal Data Export
================================

This package contains a complete copy of your ETERN8 data, prepared on the date shown in data.json.

What's inside
-------------
• data.json           — Full account data (memories, people, settings, etc.)
• Memory_Stories.pdf  — Printable stories of your saved messages, with quoted text
• media-manifest.json — Links to photos, voice recordings, and videos

Voice & video
-------------
Printed books cannot embed audio or video. Those files are listed in media-manifest.json
with direct URLs. Download them promptly — links may expire depending on storage settings.

Machine-readable data
---------------------
data.json is provided for GDPR-style portability. It includes everything your account
can access under normal privacy rules.

Questions
---------
Contact support through the ETERN8 app if anything looks missing from this export.
`;

/**
 * Builds and downloads a ZIP with JSON data, media manifest, and Final Words PDF.
 */
export async function exportUserDataPackage(base44, { templateId = 'warm', onProgress } = {}) {
  onProgress?.('Gathering your memories…');
  const data = await gatherUserData(base44);
  const manifest = buildMediaManifest(data);

  const creatorName = data.user.display_name || data.user.full_name || data.user.email;

  onProgress?.('Writing your stories…');
  const pdfBlob = await generateMemoryStoryPDF({
    memories: data.memories,
    lovedOnes: data.lovedOnes,
    privateNotes: data.privateNotes,
    creatorName,
    templateId,
    download: false,
    includeManifestNote: true,
  });

  onProgress?.('Preparing download…');
  const zip = new JSZip();
  zip.file('README.txt', README);
  zip.file('data.json', JSON.stringify(data, null, 2));
  zip.file('media-manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('Memory_Stories.pdf', pdfBlob);

  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const stamp = format(new Date(), 'yyyy-MM-dd');
  const name = sanitizeExportFilename(creatorName, 'My');
  downloadBlob(zipBlob, `ETERN8_Export_${name}_${stamp}.zip`);

  return { data, manifest, pdfBlob };
}

/**
 * PDF-only export for a single loved one (memory book flow).
 */
export async function exportLovedOneStoryPDF(base44, person, memories, templateId = 'warm') {
  const user = await base44.auth.me();
  const creatorName = user?.display_name || user?.full_name || null;
  return generateMemoryStoryPDF({
    memories,
    lovedOnes: [person],
    privateNotes: [],
    creatorName,
    templateId,
    download: true,
    filename: `${sanitizeExportFilename(person.name)}_Memory_Story.pdf`,
  });
}

import html2canvas from 'html2canvas';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from 'docx';

const HEADING_MAP = {
  h1: HeadingLevel.HEADING_1,
  h2: HeadingLevel.HEADING_2,
  h3: HeadingLevel.HEADING_3,
  h4: HeadingLevel.HEADING_4,
  h5: HeadingLevel.HEADING_5,
  h6: HeadingLevel.HEADING_6,
};

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function imageSize(naturalWidth, naturalHeight, isBlock) {
  const logicalW = naturalWidth / 2;
  const logicalH = naturalHeight / 2;
  const maxWidth = isBlock ? 480 : 220;
  const scale = Math.min(1, maxWidth / logicalW);
  return {
    width: Math.max(1, Math.round(logicalW * scale)),
    height: Math.max(1, Math.round(logicalH * scale)),
  };
}

function createImageRun(img, isBlock) {
  const w = parseInt(img.dataset.naturalWidth || '100', 10);
  const h = parseInt(img.dataset.naturalHeight || '40', 10);
  const size = imageSize(w, h, isBlock);

  return new ImageRun({
    type: 'png',
    data: dataUrlToBytes(img.src),
    transformation: size,
  });
}

async function renderKatexAsImage(el) {
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
  });

  const img = document.createElement('img');
  img.src = canvas.toDataURL('image/png');
  img.dataset.naturalWidth = String(canvas.width);
  img.dataset.naturalHeight = String(canvas.height);
  if (el.classList.contains('katex-display')) {
    img.dataset.katexBlock = '1';
  }
  return img;
}

async function prepareExportRoot(previewElement) {
  const root = document.createElement('div');
  root.className = 'preview docx-export-root';
  root.innerHTML = previewElement.innerHTML;
  root.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    'width:794px',
    'padding:40px',
    'background:#fff',
    'z-index:-1',
    'opacity:0',
    'pointer-events:none',
  ].join(';');
  document.body.appendChild(root);

  await document.fonts.ready;

  const displays = [...root.querySelectorAll('.katex-display')];
  for (const el of displays) {
    const img = await renderKatexAsImage(el);
    el.replaceWith(img);
  }

  const inlines = [...root.querySelectorAll('.katex')];
  for (const el of inlines) {
    const img = await renderKatexAsImage(el);
    el.replaceWith(img);
  }

  return root;
}

function collectTextRuns(node, inherited = {}) {
  const runs = [];

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent;
    if (text) runs.push(new TextRun({ text, ...inherited }));
    return runs;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return runs;

  const tag = node.tagName.toLowerCase();

  if (tag === 'br') {
    runs.push(new TextRun({ break: 1 }));
    return runs;
  }

  if (tag === 'img' && node.src?.startsWith('data:')) {
    runs.push(createImageRun(node, false));
    return runs;
  }

  const style = { ...inherited };
  if (tag === 'strong' || tag === 'b') style.bold = true;
  if (tag === 'em' || tag === 'i') style.italics = true;
  if (tag === 'code') style.font = 'Courier New';

  for (const child of node.childNodes) {
    runs.push(...collectTextRuns(child, style));
  }

  return runs;
}

function paragraphFromNode(node, options = {}) {
  const runs = collectTextRuns(node);
  if (!runs.length) return null;
  return new Paragraph({ children: runs, ...options });
}

function blockImageParagraph(img) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
    children: [createImageRun(img, true)],
  });
}

function elementToDocx(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    return text ? [new Paragraph({ children: [new TextRun({ text })] })] : [];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return [];

  const tag = node.tagName.toLowerCase();

  if (HEADING_MAP[tag]) {
    const para = paragraphFromNode(node, { heading: HEADING_MAP[tag] });
    return para ? [para] : [];
  }

  if (tag === 'p') {
    const para = paragraphFromNode(node);
    return para ? [para] : [];
  }

  if (tag === 'img' && node.dataset.katexBlock) {
    return [blockImageParagraph(node)];
  }

  if (tag === 'hr') {
    return [
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: 'cccccc' },
        },
        spacing: { before: 200, after: 200 },
      }),
    ];
  }

  if (tag === 'blockquote') {
    const para = paragraphFromNode(node, {
      indent: { left: 720 },
      border: {
        left: { style: BorderStyle.SINGLE, size: 12, color: '2563eb' },
      },
      spacing: { before: 120, after: 120 },
    });
    return para ? [para] : [];
  }

  if (tag === 'pre') {
    const code = node.textContent || '';
    if (!code.trim()) return [];
    return [
      new Paragraph({
        children: [new TextRun({ text: code, font: 'Courier New' })],
        spacing: { before: 120, after: 120 },
      }),
    ];
  }

  if (tag === 'ul') {
    return [...node.children]
      .filter((li) => li.tagName?.toLowerCase() === 'li')
      .map((li) => {
        const runs = collectTextRuns(li);
        return new Paragraph({
          children: [new TextRun({ text: '• ' }), ...runs],
          spacing: { after: 80 },
        });
      });
  }

  if (tag === 'ol') {
    return [...node.children]
      .filter((li) => li.tagName?.toLowerCase() === 'li')
      .map((li, index) => {
        const runs = collectTextRuns(li);
        return new Paragraph({
          children: [new TextRun({ text: `${index + 1}. ` }), ...runs],
          spacing: { after: 80 },
        });
      });
  }

  if (tag === 'table') {
    const rows = [...node.querySelectorAll('tr')].map(
      (tr) =>
        new TableRow({
          children: [...tr.querySelectorAll('th,td')].map(
            (cell) =>
              new TableCell({
                children: [paragraphFromNode(cell) || new Paragraph({ children: [new TextRun('')] })],
              }),
          ),
        }),
    );
    return rows.length ? [new Table({ rows })] : [];
  }

  if (tag === 'div' || tag === 'section' || tag === 'article') {
    const items = [];
    for (const child of node.childNodes) {
      items.push(...elementToDocx(child));
    }
    return items;
  }

  const fallback = paragraphFromNode(node);
  return fallback ? [fallback] : [];
}

function collectDocxElements(root) {
  const items = [];
  for (const child of root.childNodes) {
    items.push(...elementToDocx(child));
  }
  return items.length ? items : [new Paragraph({ children: [new TextRun('')] })];
}

export async function buildDocxBlob(previewElement) {
  const root = await prepareExportRoot(previewElement);

  try {
    const children = collectDocxElements(root);
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 },
            },
          },
          children,
        },
      ],
    });

    return Packer.toBlob(doc);
  } finally {
    root.remove();
  }
}

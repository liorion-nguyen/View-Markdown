import JSZip from 'jszip';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const REFERENCE_DOC = resolve(ROOT, 'assets/reference.docx');
 
const PANDOC_FROM =
  'markdown+tex_math_dollars+tex_math_single_backslash+hard_line_breaks-auto_identifiers+gfm_auto_identifiers';
const DOCX_FONT_FAMILY = 'Times New Roman';
const DOCX_MATH_FONT = 'Times New Roman';
const DOCX_BODY_SIZE = 28; // 14pt (half-points)
const DOCX_MATH_SIZE = 40; // ~20pt for formulas
const DOCX_FRACTION_PART_SIZE = 56; // enlarge numerator/denominator specifically
const DOCX_USE_LINEAR_FRACTIONS = true; // keep fraction text size comparable to surrounding content

const PANDOC_LOCAL_BIN = resolve(ROOT, 'bin', 'pandoc');

function resolvePandocCandidates() {
  const candidates = [];

  if (process.env.PANDOC_PATH?.trim()) {
    candidates.push(process.env.PANDOC_PATH.trim());
  }

  const roots = new Set([
    process.cwd(),
    ROOT,
    process.env.LAMBDA_TASK_ROOT,
    process.env.VERCEL ? '/var/task' : null,
  ]);

  for (const root of roots) {
    if (!root) continue;
    candidates.push(resolve(root, 'bin', 'pandoc'));
  }

  candidates.push(PANDOC_LOCAL_BIN);
  return [...new Set(candidates)];
}

function getPandocBinary() {
  for (const candidate of resolvePandocCandidates()) {
    if (existsSync(candidate)) return candidate;
  }

  if (process.platform === 'linux') {
    return PANDOC_LOCAL_BIN;
  }

  return 'pandoc';
}

let ensurePandocPromise = null;

/** Tải Pandoc vào /tmp nếu bundle Vercel thiếu binary (fallback) */
async function ensurePandocBinary() {
  const existing = resolvePandocCandidates().find((c) => existsSync(c));
  if (existing) return existing;

  if (process.platform !== 'linux') return getPandocBinary();

  if (!ensurePandocPromise) {
    ensurePandocPromise = (async () => {
      const { chmodSync, copyFileSync, existsSync: exists, mkdirSync } = await import('node:fs');
      const { spawnSync } = await import('node:child_process');
      const { resolve: resolvePath } = await import('node:path');
      const { tmpdir } = await import('node:os');

      const version = process.env.PANDOC_VERSION || '3.10';
      const destDir = resolvePath(tmpdir(), 'codelab-pandoc');
      const dest = resolvePath(destDir, 'pandoc');

      if (exists(dest)) return dest;

      mkdirSync(destDir, { recursive: true });
      const archive = `pandoc-${version}-linux-amd64.tar.gz`;
      const url = `https://github.com/jgm/pandoc/releases/download/${version}/${archive}`;

      const curl = spawnSync('curl', ['-fsSL', url, '-o', '/tmp/pandoc-runtime.tar.gz'], {
        stdio: 'inherit',
      });
      if (curl.status !== 0) throw new Error('Không tải được Pandoc trên server');

      const tar = spawnSync('tar', ['-xzf', '/tmp/pandoc-runtime.tar.gz', '-C', '/tmp'], {
        stdio: 'inherit',
      });
      if (tar.status !== 0) throw new Error('Không giải nén được Pandoc');

      copyFileSync(`/tmp/pandoc-${version}/bin/pandoc`, dest);
      chmodSync(dest, 0o755);
      return dest;
    })();
  }

  return ensurePandocPromise;
}

const TEX_BIN_DIRS = [
  '/Library/TeX/texbin',
  '/usr/local/texlive/2026basic/bin/universal-darwin',
  '/usr/local/texlive/2025basic/bin/universal-darwin',
];

function getProcessEnv() {
  const extra = TEX_BIN_DIRS.filter((dir) => existsSync(dir));
  if (!extra.length) return process.env;

  const sep = process.platform === 'win32' ? ';' : ':';
  const prefix = extra.join(sep);
  const current = process.env.PATH || '';

  return {
    ...process.env,
    PATH: current.includes(prefix) ? current : `${prefix}${sep}${current}`,
  };
}

function commandCandidates(cmd) {
  const names = [cmd];
  for (const dir of TEX_BIN_DIRS) {
    const full = join(dir, cmd);
    if (existsSync(full)) names.push(full);
  }
  return [...new Set(names)];
}

const PDF_ENGINES = ['xelatex', 'pdflatex', 'lualatex'];
let cachedPdfEngine;

function checkCommand(cmd) {
  const env = getProcessEnv();

  return new Promise((resolve) => {
    const candidates = commandCandidates(cmd);
    let index = 0;

    const tryNext = () => {
      if (index >= candidates.length) {
        resolve(false);
        return;
      }

      const candidate = candidates[index++];
      const proc = spawn(candidate, ['--version'], { stdio: 'ignore', env });
      proc.on('close', (code) => {
        if (code === 0) resolve(true);
        else tryNext();
      });
      proc.on('error', () => tryNext());
    };

    tryNext();
  });
}

/** @returns {Promise<string | null>} */
export async function resolvePdfEngine() {
  if (process.env.PDF_ENGINE) {
    const candidates = commandCandidates(process.env.PDF_ENGINE);
    for (const candidate of candidates) {
      if (await checkCommand(candidate)) return candidate;
    }
  }

  if (cachedPdfEngine) return cachedPdfEngine;

  for (const engine of PDF_ENGINES) {
    const candidates = commandCandidates(engine);
    for (const candidate of candidates) {
      if (await checkCommand(candidate)) {
        cachedPdfEngine = candidate;
        return candidate;
      }
    }
  }

  return null;
}

export function checkPdfEngineAvailable() {
  return resolvePdfEngine().then(Boolean);
}

function forceRunFonts(xml, fontFamily = DOCX_FONT_FAMILY) {
  // Replace any theme-based run font declaration with an explicit font family.
  return xml.replace(/<w:rFonts\b[^>]*\/>/g, `<w:rFonts w:ascii="${fontFamily}" w:hAnsi="${fontFamily}" w:eastAsia="${fontFamily}" w:cs="${fontFamily}" />`);
}

function ensureMathSettings(xml) {
  const mathPr = `<m:mathPr><m:mathFont m:val="${DOCX_MATH_FONT}" /><m:brkBin m:val="before" /><m:smallFrac m:val="0" /><m:dispDef /><m:ctrlPr><w:rPr><w:rFonts w:ascii="${DOCX_MATH_FONT}" w:hAnsi="${DOCX_MATH_FONT}" w:eastAsia="${DOCX_MATH_FONT}" w:cs="${DOCX_MATH_FONT}" /><w:sz w:val="${DOCX_MATH_SIZE}" /><w:szCs w:val="${DOCX_MATH_SIZE}" /></w:rPr></m:ctrlPr></m:mathPr>`;
  if (xml.includes('<m:mathPr>')) return xml;
  const insertAfter = '<w:zoom w:percent="100" />';
  if (xml.includes(insertAfter)) {
    return xml.replace(insertAfter, `${insertAfter}${mathPr}`);
  }
  return xml.replace('<w:settings', `<w:settings>${mathPr}`);
}

function replaceStyleBlock(xml, styleId, replacement) {
  const styleRegex = new RegExp(
    `<w:style\\b[^>]*w:styleId="${styleId}"[^>]*>[\\s\\S]*?<\\/w:style>`,
    'm',
  );
  return xml.replace(styleRegex, replacement);
}

function applyTypographyPreset(xml) {
  let updated = xml;

  updated = updated.replace(
    /<w:docDefaults>[\s\S]*?<\/w:docDefaults>/m,
    `<w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="${DOCX_FONT_FAMILY}" w:hAnsi="${DOCX_FONT_FAMILY}" w:eastAsia="${DOCX_FONT_FAMILY}" w:cs="${DOCX_FONT_FAMILY}" />
        <w:sz w:val="${DOCX_BODY_SIZE}" />
        <w:szCs w:val="${DOCX_BODY_SIZE}" />
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:before="80" w:after="120" w:line="420" w:lineRule="auto" />
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>`,
  );

  updated = replaceStyleBlock(
    updated,
    'Normal',
    `<w:style w:default="1" w:styleId="Normal" w:type="paragraph">
    <w:name w:val="Normal" />
    <w:qFormat />
    <w:rPr>
      <w:rFonts w:ascii="${DOCX_FONT_FAMILY}" w:hAnsi="${DOCX_FONT_FAMILY}" w:eastAsia="${DOCX_FONT_FAMILY}" w:cs="${DOCX_FONT_FAMILY}" />
      <w:sz w:val="${DOCX_BODY_SIZE}" />
      <w:szCs w:val="${DOCX_BODY_SIZE}" />
    </w:rPr>
    <w:pPr>
      <w:spacing w:before="80" w:after="120" w:line="420" w:lineRule="auto" />
    </w:pPr>
  </w:style>`,
  );

  updated = replaceStyleBlock(
    updated,
    'BodyText',
    `<w:style w:styleId="BodyText" w:type="paragraph">
    <w:name w:val="Body Text" />
    <w:basedOn w:val="Normal" />
    <w:link w:val="BodyTextChar" />
    <w:qFormat />
    <w:rPr>
      <w:rFonts w:ascii="${DOCX_FONT_FAMILY}" w:hAnsi="${DOCX_FONT_FAMILY}" w:eastAsia="${DOCX_FONT_FAMILY}" w:cs="${DOCX_FONT_FAMILY}" />
      <w:sz w:val="${DOCX_BODY_SIZE}" />
      <w:szCs w:val="${DOCX_BODY_SIZE}" />
    </w:rPr>
    <w:pPr>
      <w:spacing w:before="80" w:after="120" w:line="420" w:lineRule="auto" />
    </w:pPr>
  </w:style>`,
  );

  updated = replaceStyleBlock(
    updated,
    'FirstParagraph',
    `<w:style w:customStyle="1" w:styleId="FirstParagraph" w:type="paragraph">
    <w:name w:val="First Paragraph" />
    <w:basedOn w:val="BodyText" />
    <w:next w:val="BodyText" />
    <w:qFormat />
    <w:rPr>
      <w:rFonts w:ascii="${DOCX_FONT_FAMILY}" w:hAnsi="${DOCX_FONT_FAMILY}" w:eastAsia="${DOCX_FONT_FAMILY}" w:cs="${DOCX_FONT_FAMILY}" />
      <w:sz w:val="${DOCX_BODY_SIZE}" />
      <w:szCs w:val="${DOCX_BODY_SIZE}" />
    </w:rPr>
    <w:pPr>
      <w:spacing w:before="80" w:after="120" w:line="420" w:lineRule="auto" />
    </w:pPr>
  </w:style>`,
  );

  updated = replaceStyleBlock(
    updated,
    'Compact',
    `<w:style w:customStyle="1" w:styleId="Compact" w:type="paragraph">
    <w:name w:val="Compact" />
    <w:basedOn w:val="BodyText" />
    <w:qFormat />
    <w:rPr>
      <w:rFonts w:ascii="${DOCX_FONT_FAMILY}" w:hAnsi="${DOCX_FONT_FAMILY}" w:eastAsia="${DOCX_FONT_FAMILY}" w:cs="${DOCX_FONT_FAMILY}" />
      <w:sz w:val="${DOCX_BODY_SIZE}" />
      <w:szCs w:val="${DOCX_BODY_SIZE}" />
    </w:rPr>
    <w:pPr>
      <w:spacing w:before="40" w:after="80" w:line="420" w:lineRule="auto" />
    </w:pPr>
  </w:style>`,
  );

  updated = replaceStyleBlock(
    updated,
    'Heading1',
    `<w:style w:styleId="Heading1" w:type="paragraph">
    <w:name w:val="heading 1" />
    <w:basedOn w:val="Normal" />
    <w:next w:val="BodyText" />
    <w:link w:val="Heading1Char" />
    <w:qFormat />
    <w:pPr>
      <w:spacing w:before="0" w:after="220" w:line="312" w:lineRule="auto" />
      <w:outlineLvl w:val="0" />
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="${DOCX_FONT_FAMILY}" w:hAnsi="${DOCX_FONT_FAMILY}" w:eastAsia="${DOCX_FONT_FAMILY}" w:cs="${DOCX_FONT_FAMILY}" />
      <w:b />
      <w:color w:val="0F172A" />
      <w:sz w:val="42" />
      <w:szCs w:val="42" />
    </w:rPr>
  </w:style>`,
  );

  updated = replaceStyleBlock(
    updated,
    'Heading2',
    `<w:style w:styleId="Heading2" w:type="paragraph">
    <w:name w:val="heading 2" />
    <w:basedOn w:val="Normal" />
    <w:next w:val="BodyText" />
    <w:link w:val="Heading2Char" />
    <w:qFormat />
    <w:pPr>
      <w:spacing w:before="260" w:after="120" w:line="300" w:lineRule="auto" />
      <w:outlineLvl w:val="1" />
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="${DOCX_FONT_FAMILY}" w:hAnsi="${DOCX_FONT_FAMILY}" w:eastAsia="${DOCX_FONT_FAMILY}" w:cs="${DOCX_FONT_FAMILY}" />
      <w:b />
      <w:color w:val="0F172A" />
      <w:sz w:val="32" />
      <w:szCs w:val="32" />
    </w:rPr>
  </w:style>`,
  );

  updated = replaceStyleBlock(
    updated,
    'Heading3',
    `<w:style w:styleId="Heading3" w:type="paragraph">
    <w:name w:val="heading 3" />
    <w:basedOn w:val="Normal" />
    <w:next w:val="BodyText" />
    <w:link w:val="Heading3Char" />
    <w:qFormat />
    <w:pPr>
      <w:spacing w:before="220" w:after="100" w:line="288" w:lineRule="auto" />
      <w:outlineLvl w:val="2" />
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="${DOCX_FONT_FAMILY}" w:hAnsi="${DOCX_FONT_FAMILY}" w:eastAsia="${DOCX_FONT_FAMILY}" w:cs="${DOCX_FONT_FAMILY}" />
      <w:b />
      <w:color w:val="0F172A" />
      <w:sz w:val="26" />
      <w:szCs w:val="26" />
    </w:rPr>
  </w:style>`,
  );

  return updated;
}

function upscaleInlineFractions(markdown) {
  // Giữ nguyên cú pháp gốc để Pandoc parse math ổn định.
  return markdown;
}

function enforceMathRunSize(xml) {
  const ctrlPr = `<m:ctrlPr><w:rPr><w:rFonts w:ascii="${DOCX_MATH_FONT}" w:hAnsi="${DOCX_MATH_FONT}" w:eastAsia="${DOCX_MATH_FONT}" w:cs="${DOCX_MATH_FONT}" /><w:sz w:val="${DOCX_MATH_SIZE}" /><w:szCs w:val="${DOCX_MATH_SIZE}" /></w:rPr></m:ctrlPr>`;

  let updated = xml.replace(/<m:r>(?!<m:rPr>)/g, `<m:r><m:rPr>${ctrlPr}</m:rPr>`);

  updated = updated.replace(/<m:rPr>([\s\S]*?)<\/m:rPr>/g, (_match, inner) => {
    const withoutCtrl = inner.replace(/<m:ctrlPr>[\s\S]*?<\/m:ctrlPr>/g, '');
    return `<m:rPr>${withoutCtrl}${ctrlPr}</m:rPr>`;
  });

  // Word shrinks numerator/denominator in stacked fractions by design.
  // Compensate by increasing run size inside <m:num> and <m:den>.
  updated = updated.replace(/<m:(num|den)>([\s\S]*?)<\/m:\1>/g, (block) => {
    return block
      .replace(/<w:sz w:val="\d+" \/>/g, `<w:sz w:val="${DOCX_FRACTION_PART_SIZE}" />`)
      .replace(/<w:szCs w:val="\d+" \/>/g, `<w:szCs w:val="${DOCX_FRACTION_PART_SIZE}" />`);
  });

  if (DOCX_USE_LINEAR_FRACTIONS) {
    updated = updated.replace(/<m:fPr>([\s\S]*?)<\/m:fPr>/g, (_match, inner) => {
      const withoutType = inner.replace(/<m:type\b[^>]*\/>/g, '');
      return `<m:fPr>${withoutType}<m:type m:val="lin" /></m:fPr>`;
    });
  }

  return updated;
}

export function getReferenceDocPath() {
  const candidates = [
    REFERENCE_DOC,
    resolve(process.cwd(), 'assets/reference.docx'),
    resolve(ROOT, 'assets/reference.docx'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return null;
}

export function checkPandocAvailable() {
  return new Promise((resolve) => {
    const proc = spawn(getPandocBinary(), ['--version'], { stdio: 'ignore' });
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

async function runPandoc(args) {
  const binary = await ensurePandocBinary();
  return new Promise((resolve, reject) => {
    const proc = spawn(binary, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: getProcessEnv(),
    });
    let stderr = '';

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `Pandoc thoát với mã ${code}`));
    });

    proc.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(
          new Error(
            'Chưa cài Pandoc. Cài bằng: brew install pandoc (macOS) hoặc https://pandoc.org/installing.html',
          ),
        );
      } else {
        reject(err);
      }
    });
  });
}

async function postProcessDocx(docxPath) {
  const zipBuffer = readFileSync(docxPath);
  const zip = await JSZip.loadAsync(zipBuffer);

  const documentFile = zip.file('word/document.xml');
  if (documentFile) {
    let documentXml = await documentFile.async('string');
    documentXml = documentXml
      .replace(/<w:bookmarkStart\b[^>]*\/>/g, '')
      .replace(/<w:bookmarkEnd\b[^>]*\/>/g, '');
    documentXml = enforceMathRunSize(documentXml);
    zip.file('word/document.xml', documentXml);
  }

  const stylesFile = zip.file('word/styles.xml');
  if (stylesFile) {
    let stylesXml = await stylesFile.async('string');
    stylesXml = stylesXml
      .replace(/w:themeColor="accent1"\s+w:themeShade="BF"\s+w:val="0F4761"/g, 'w:val="0F172A"')
      .replace(/w:themeColor="accent1"\s+w:val="4F81BD"/g, 'w:val="0F172A"');
    stylesXml = applyTypographyPreset(stylesXml);
    stylesXml = forceRunFonts(stylesXml, DOCX_FONT_FAMILY);
    zip.file('word/styles.xml', stylesXml);
  }

  const settingsFile = zip.file('word/settings.xml');
  if (settingsFile) {
    let settingsXml = await settingsFile.async('string');
    settingsXml = ensureMathSettings(settingsXml);
    zip.file('word/settings.xml', settingsXml);
  }

  const outBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  writeFileSync(docxPath, outBuffer);
}

/**
 * Chuyển Markdown (có LaTeX math) sang buffer DOCX qua Pandoc (Office Math).
 */
export async function exportMarkdownToDocx(markdown, { referenceDoc } = {}) {
  const id = randomUUID();
  const inputPath = join(tmpdir(), `view-math-md-${id}.md`);
  const outputPath = join(tmpdir(), `view-math-md-${id}.docx`);

  const normalizedMarkdown = upscaleInlineFractions(markdown);
  writeFileSync(inputPath, normalizedMarkdown, 'utf8');

  const ref = referenceDoc ?? getReferenceDocPath();
  const args = [inputPath, '-o', outputPath, '--from', PANDOC_FROM, '--to', 'docx'];

  if (ref) args.push('--reference-doc', ref);

  try {
    await runPandoc(args);
    await postProcessDocx(outputPath);
    return readFileSync(outputPath);
  } finally {
    try {
      unlinkSync(inputPath);
    } catch {
      /* ignore */
    }
    try {
      unlinkSync(outputPath);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Biên dịch LaTeX → PDF (chất lượng như Overleaf). Cần xelatex/pdflatex.
 */
export async function exportLatexToPdf(latex) {
  const engine = await resolvePdfEngine();
  if (!engine) {
    throw new Error(
      'Chưa cài LaTeX (xelatex/pdflatex). macOS: brew install --cask basictex, mở terminal mới, rồi: sudo tlmgr install collection-latexextra collection-langeuropean',
    );
  }

  const id = randomUUID();
  const inputPath = join(tmpdir(), `view-math-tex-${id}.tex`);
  const outputPath = join(tmpdir(), `view-math-tex-${id}.pdf`);

  writeFileSync(inputPath, latex, 'utf8');

  const args = [
    inputPath,
    '-o',
    outputPath,
    '--from',
    'latex',
    '--pdf-engine',
    engine,
  ];

  try {
    await runPandoc(args);
    return readFileSync(outputPath);
  } finally {
    try {
      unlinkSync(inputPath);
    } catch {
      /* ignore */
    }
    try {
      unlinkSync(outputPath);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Chuyển LaTeX sang buffer DOCX qua Pandoc.
 */
export async function exportLatexToDocx(latex, { referenceDoc } = {}) {
  const id = randomUUID();
  const inputPath = join(tmpdir(), `view-math-tex-${id}.tex`);
  const outputPath = join(tmpdir(), `view-math-tex-${id}.docx`);

  writeFileSync(inputPath, latex, 'utf8');

  const ref = referenceDoc ?? getReferenceDocPath();
  const args = [inputPath, '-o', outputPath, '--from', 'latex', '--to', 'docx'];

  if (ref) args.push('--reference-doc', ref);

  try {
    await runPandoc(args);
    await postProcessDocx(outputPath);
    return readFileSync(outputPath);
  } finally {
    try {
      unlinkSync(inputPath);
    } catch {
      /* ignore */
    }
    try {
      unlinkSync(outputPath);
    } catch {
      /* ignore */
    }
  }
}

function extractHtmlBody(html) {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return match ? match[1].trim() : html;
}

/**
 * Chuyển LaTeX sang HTML (phần body) để preview / xuất PDF.
 */
export async function exportLatexToHtml(latex) {
  const id = randomUUID();
  const inputPath = join(tmpdir(), `view-math-tex-${id}.tex`);
  const outputPath = join(tmpdir(), `view-math-tex-${id}.html`);

  writeFileSync(inputPath, latex, 'utf8');

  const args = [
    inputPath,
    '-o',
    outputPath,
    '--from',
    'latex',
    '--to',
    'html5',
    '--standalone',
    '--katex',
  ];

  try {
    await runPandoc(args);
    const html = readFileSync(outputPath, 'utf8');
    return extractHtmlBody(html);
  } finally {
    try {
      unlinkSync(inputPath);
    } catch {
      /* ignore */
    }
    try {
      unlinkSync(outputPath);
    } catch {
      /* ignore */
    }
  }
}

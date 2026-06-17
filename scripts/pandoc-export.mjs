import { spawn } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const REFERENCE_DOC = resolve(ROOT, 'assets/reference.docx');

const PANDOC_FROM =
  'markdown+tex_math_dollars+tex_math_single_backslash-auto_identifiers+gfm_auto_identifiers';
const DOCX_FONT_FAMILY = 'Times New Roman';
const DOCX_MATH_FONT = 'Times New Roman';
const DOCX_BODY_SIZE = 28; // 14pt (half-points)
const DOCX_MATH_SIZE = 40; // ~20pt for formulas
const DOCX_FRACTION_PART_SIZE = 56; // enlarge numerator/denominator specifically
const DOCX_USE_LINEAR_FRACTIONS = true; // keep fraction text size comparable to surrounding content

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
  return existsSync(REFERENCE_DOC) ? REFERENCE_DOC : null;
}

export function checkPandocAvailable() {
  return new Promise((resolve) => {
    const proc = spawn('pandoc', ['--version'], { stdio: 'ignore' });
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

function runPandoc(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('pandoc', args, { stdio: ['ignore', 'pipe', 'pipe'] });
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

function postProcessDocx(docxPath) {
  const workdir = mkdtempSync(join(tmpdir(), 'view-math-docx-post-'));
  const unzipArgs = ['-q', docxPath, '-d', workdir];
  const zipArgs = ['-qr', docxPath, '.'];

  return new Promise((resolve, reject) => {
    const unzipProc = spawn('unzip', unzipArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    let unzipErr = '';

    unzipProc.stderr.on('data', (chunk) => {
      unzipErr += chunk.toString();
    });

    unzipProc.on('close', (code) => {
      if (code !== 0) {
        rmSync(workdir, { recursive: true, force: true });
        reject(new Error(unzipErr.trim() || 'Không giải nén được file DOCX để hậu xử lý'));
        return;
      }

      try {
        const documentXmlPath = join(workdir, 'word', 'document.xml');
        const stylesXmlPath = join(workdir, 'word', 'styles.xml');

        if (existsSync(documentXmlPath)) {
          let documentXml = readFileSync(documentXmlPath, 'utf8')
            .replace(/<w:bookmarkStart\b[^>]*\/>/g, '')
            .replace(/<w:bookmarkEnd\b[^>]*\/>/g, '');
          documentXml = enforceMathRunSize(documentXml);
          writeFileSync(documentXmlPath, documentXml, 'utf8');
        }

        if (existsSync(stylesXmlPath)) {
          let stylesXml = readFileSync(stylesXmlPath, 'utf8')
            .replace(/w:themeColor="accent1"\s+w:themeShade="BF"\s+w:val="0F4761"/g, 'w:val="0F172A"')
            .replace(/w:themeColor="accent1"\s+w:val="4F81BD"/g, 'w:val="0F172A"');
          stylesXml = applyTypographyPreset(stylesXml);
          stylesXml = forceRunFonts(stylesXml, DOCX_FONT_FAMILY);
          writeFileSync(stylesXmlPath, stylesXml, 'utf8');
        }

        const settingsXmlPath = join(workdir, 'word', 'settings.xml');
        if (existsSync(settingsXmlPath)) {
          let settingsXml = readFileSync(settingsXmlPath, 'utf8');
          settingsXml = ensureMathSettings(settingsXml);
          writeFileSync(settingsXmlPath, settingsXml, 'utf8');
        }
      } catch (err) {
        rmSync(workdir, { recursive: true, force: true });
        reject(err);
        return;
      }

      const zipProc = spawn('zip', zipArgs, { cwd: workdir, stdio: ['ignore', 'pipe', 'pipe'] });
      let zipErr = '';
      zipProc.stderr.on('data', (chunk) => {
        zipErr += chunk.toString();
      });
      zipProc.on('close', (zipCode) => {
        rmSync(workdir, { recursive: true, force: true });
        if (zipCode !== 0) {
          reject(new Error(zipErr.trim() || 'Không nén lại DOCX sau khi hậu xử lý'));
          return;
        }
        resolve();
      });
      zipProc.on('error', (err) => {
        rmSync(workdir, { recursive: true, force: true });
        reject(err);
      });
    });

    unzipProc.on('error', (err) => {
      rmSync(workdir, { recursive: true, force: true });
      reject(err);
    });
  });
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

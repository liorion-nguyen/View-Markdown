/**
 * Chuyển khối toán dạng [ ... ] sang \[ ... \] (LaTeX display).
 */
export function normalizeBracketBlocks(source) {
  return source.replace(/^(\s*)\[\s*\n([\s\S]*?)\n\s*\]\s*$/gm, (_, indent, content) => {
    return `${indent}\n\\[\n${content.trim()}\n\\]`;
  });
}

/**
 * Chuẩn hóa về LaTeX: \( \) inline, \[ \] display.
 * Chuyển $ và $$ từ AI sang LaTeX chuẩn.
 */
export function normalizeToLatexDelimiters(source) {
  let result = source;

  // $$ ... $$ → \[ ... \]
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, content) => {
    return `\\[\n${content.trim()}\n\\]`;
  });

  // $ ... $ → \( ... \) — không match qua newline
  result = result.replace(/(?<!\$)\$(?!\$)([^\$\n]+?)\$(?!\$)/g, (_, content) => {
    return `\\(${content.trim()}\\)`;
  });

  return result;
}

function isEscaped(source, index) {
  let slashes = 0;
  for (let j = index - 1; j >= 0 && source[j] === '\\'; j--) slashes++;
  return slashes % 2 === 1;
}

/** Tách vùng text / \(inline\) / \[block\] / $ $ / $$ $$ */
function splitByMathRegions(source) {
  const segments = [];
  let i = 0;
  let textStart = 0;

  const pushText = (end) => {
    if (end > textStart) segments.push({ type: 'text', text: source.slice(textStart, end) });
  };

  while (i < source.length) {
    if (source.startsWith('\\[', i) && !isEscaped(source, i)) {
      pushText(i);
      const start = i;
      i += 2;
      while (i < source.length) {
        if (source.startsWith('\\]', i) && !isEscaped(source, i)) {
          i += 2;
          segments.push({ type: 'block', text: source.slice(start, i) });
          textStart = i;
          break;
        }
        i++;
      }
      if (textStart < start) {
        segments.push({ type: 'block', text: source.slice(start) });
        break;
      }
      continue;
    }

    if (source.startsWith('\\(', i) && !isEscaped(source, i)) {
      pushText(i);
      const start = i;
      i += 2;
      while (i < source.length) {
        if (source.startsWith('\\)', i) && !isEscaped(source, i)) {
          i += 2;
          segments.push({ type: 'inline', text: source.slice(start, i) });
          textStart = i;
          break;
        }
        i++;
      }
      if (textStart < start) {
        segments.push({ type: 'inline', text: source.slice(start) });
        break;
      }
      continue;
    }

    if (source[i] === '$' && !isEscaped(source, i)) {
      if (source[i + 1] === '$') {
        pushText(i);
        const start = i;
        i += 2;
        while (i < source.length) {
          if (source[i] === '$' && source[i + 1] === '$' && !isEscaped(source, i)) {
            i += 2;
            segments.push({ type: 'block', text: source.slice(start, i) });
            textStart = i;
            break;
          }
          i++;
        }
        if (textStart < start) {
          segments.push({ type: 'block', text: source.slice(start) });
          break;
        }
      } else {
        pushText(i);
        const start = i;
        i += 1;
        while (i < source.length) {
          if (source[i] === '$' && !isEscaped(source, i)) {
            i += 1;
            segments.push({ type: 'inline', text: source.slice(start, i) });
            textStart = i;
            break;
          }
          i++;
        }
        if (textStart < start) {
          segments.push({ type: 'inline', text: source.slice(start) });
          break;
        }
      }
      continue;
    }

    i++;
  }

  if (textStart < source.length) {
    segments.push({ type: 'text', text: source.slice(textStart) });
  }

  return segments;
}

function getBlockInner(segmentText) {
  if (segmentText.startsWith('\\[')) return segmentText.slice(2, -2);
  if (segmentText.startsWith('$$')) return segmentText.slice(2, -2);
  return segmentText;
}

function wrapBlock(content) {
  return `\\[\n${content.trim()}\n\\]`;
}

/**
 * Gộp nhiều khối \[...\] liền nhau thành một (AI hay tách từng bước \Leftrightarrow).
 */
export function mergeConsecutiveDisplayBlocks(source) {
  let result = source;
  let prev;

  do {
    prev = result;
    result = result.replace(
      /\\\[\s*([\s\S]*?)\s*\\\]\s*(?:\n\s*)+\\\[\s*([\s\S]*?)\s*\\\]/g,
      (_, first, second) => `\\[\n${first.trim()}\n${second.trim()}\n\\]`,
    );
  } while (result !== prev);

  return result;
}

/** Đảm bảo khối \[...\] có dòng trống riêng (Pandoc / marked). */
export function ensureLatexBlockSpacing(source) {
  let result = source;

  result = result.replace(/([^\n])\n(\\\[\n)/g, '$1\n\n$2');
  result = result.replace(/(\\\]\n)(?=\S)/g, '$1\n\n');
  result = result.replace(/\n{3,}/g, '\n\n');

  return result;
}
/** Dòng văn bản thường (không phải nội dung LaTeX) sau khối $$ đóng. */
function isProseStartLine(line) {
  const t = line.trim();
  if (!t || t === '$$') return false;
  if (/^#{1,6}\s/.test(t)) return true;
  if (/^[-*+]\s/.test(t)) return true;
  if (/^[a-z]\)\s/.test(t)) return true;
  if (/^[A-Za-zÀ-ỹ]/.test(t) && !/\\|[_{}^=]/.test(t)) return true;
  return false;
}

/** Nhận diện dòng nội dung LaTeX thuần (không phải câu văn có inline math). */
function isMathContentLine(line) {
  const t = line.trim();
  if (!t || t === '$$') return false;
  // Câu có inline math $...$ hoặc \( \)
  if (/(?<!\$)\$(?!\$)/.test(t) || /\\\(|\\\)/.test(t)) return false;
  // Câu văn (nhiều từ)
  if (/[A-Za-zÀ-ỹà-ỹ]{2,}\s+[A-Za-zÀ-ỹà-ỹ(]/.test(t)) return false;
  if (/\\begin\{|\\frac|\\Leftrightarrow|\\Rightarrow/.test(t)) return true;
  if (/^\\/.test(t)) return true;
  if (/^[A-Za-z0-9_{}^\\+\-*/=.&|\\]+$/.test(t)) return true;
  return false;
}

/** Gỡ dòng trống thừa ngay sau $$ mở hoặc trước $$ đóng. */
function tightenDisplayMathBlocks(source) {
  let result = source.replace(/(\$\$)\s*\n\s*\n(?=\S)/g, '$1\n');
  result = result.replace(
    /(^|[^\n])([^\n]+)\n\s*\n(\$\$)/gm,
    (match, before, mathLine, delim) => {
      if (isMathContentLine(mathLine)) return `${before}${mathLine}\n${delim}`;
      return match;
    },
  );
  return result;
}

/** Chèn dòng trống trước $$ mở khi cần (đoạn văn → khối toán), không đụng list item / $$ đóng. */
function ensureBlankBeforeOpeningDisplayMath(source) {
  const lines = source.split('\n');
  const out = [];
  let inMath = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '$$') {
      if (!inMath) {
        const prev = out.length > 0 ? out[out.length - 1] : '';
        const prevTrimmed = prev.trim();
        const isIndentedOpen = /^\s/.test(line);
        const needsBlank =
          prevTrimmed &&
          !isMathContentLine(prev) &&
          !(isIndentedOpen && prevTrimmed.endsWith(':'));

        if (needsBlank) {
          out.push('');
        }
        inMath = true;
      } else {
        inMath = false;
      }
      out.push(line);
      continue;
    }

    out.push(line);
  }

  return out.join('\n');
}

/** Chèn dòng trống sau $$ đóng, trước đoạn văn — không đụng $$ mở. */
function ensureBlankAfterClosingDisplayMath(source) {
  const lines = source.split('\n');
  const out = [];
  let inMath = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '$$') {
      if (!inMath) {
        inMath = true;
        out.push(line);
      } else {
        inMath = false;
        out.push(line);
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === '') j++;
        if (j < lines.length && isProseStartLine(lines[j]) && j === i + 1) {
          out.push('');
        }
      }
      continue;
    }

    out.push(line);
  }

  return out.join('\n');
}

/** Đảm bảo khối $$ có dòng trống riêng để marked parse đúng block-level. */
export function ensureBlockMathSpacing(source) {
  let result = splitSubpartFromDisplayMath(source);

  result = ensureBlankBeforeOpeningDisplayMath(result);
  result = tightenDisplayMathBlocks(result);
  result = ensureBlankAfterClosingDisplayMath(result);
  result = result.replace(/\n{3,}/g, '\n\n');

  return result;
}

/** Sửa cm\(^2\) → \(cm^2\) */
function fixBrokenInlineSuperscript(source) {
  return source.replace(
    /(\d+)\s*cm\\\(\s*\^(\d+)\s*\\\)/g,
    (_, num, exp) => `\\(${num} \\text{ cm}^${exp}\\)`,
  );
}

/** Nhận diện biểu thức toán trong ngoặc tròn ( ... ). */
function isMathLike(content) {
  const text = content.trim();
  if (!text) return false;

  if (/điểm|quyển|phút|cm²/i.test(text) && !/\\|[\^_=]|[xX]\d|\d[xX]/.test(text)) {
    return false;
  }

  if (/\\[a-zA-Z]+/.test(text)) return true;
  if (/[\^_]/.test(text)) return true;
  if (/^[A-Z]{1,4}$/.test(text)) return true;
  if (/[xX]\s*[=+\-*/]/.test(text)) return true;
  if (/[=+\-*/]\s*[xX\d]/.test(text)) return true;
  if (/\d[xX]|[xX]\d/.test(text)) return true;
  if (/^\d+(\s*[+\-*/]\s*\d+)+\s*$/.test(text)) return true;
  if (/[()]/.test(text) && /[xX\d^+\-*/]/.test(text)) return true;
  if (/\\frac|\d+\s*\/\s*\d+/.test(text)) return true;

  return false;
}

function findMatchingParen(str, start) {
  let depth = 0;
  for (let i = start; i < str.length; i++) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function convertParensInText(source) {
  let result = '';
  let i = 0;

  while (i < source.length) {
    if (source[i] === '(') {
      const end = findMatchingParen(source, i);
      if (end !== -1) {
        const content = source.slice(i + 1, end);
        if (isMathLike(content)) {
          let full = content.trim();
          let j = end + 1;

          while (source[j] === '(') {
            const end2 = findMatchingParen(source, j);
            if (end2 === -1) break;
            const c2 = source.slice(j + 1, end2);
            if (!isMathLike(c2)) break;
            full += `(${c2.trim()})`;
            j = end2 + 1;
          }

          result += `\\(${full}\\)`;
          i = j;
          continue;
        }
      }
    }
    result += source[i];
    i++;
  }

  return result;
}

export function normalizeParenMath(source) {
  return splitByMathRegions(source)
    .map((segment) =>
      segment.type === 'text' ? convertParensInText(segment.text) : segment.text,
    )
    .join('');
}

const ARROW_SPLIT = /(?=\\Leftrightarrow\s|\\Rightarrow\s)/;

function splitIntoSteps(content) {
  const steps = [];

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(ARROW_SPLIT).map((p) => p.trim()).filter(Boolean);
    steps.push(...parts);
  }

  return steps;
}

/**
 * Chuỗi bước \Leftrightarrow / \Rightarrow → aligned (xuống dòng trong Word/KaTeX).
 */
function transformEquivChainBlock(content) {
  const trimmed = content.trim();
  if (/\\begin\{aligned\}/.test(trimmed)) return null;
  if (!/\\Leftrightarrow|\\Rightarrow/.test(trimmed)) return null;

  const steps = splitIntoSteps(trimmed);
  if (steps.length < 2) return null;

  const alignedLines = steps.map((step, idx) => {
    if (idx === 0) {
      const inlineArrow = step.match(/\\Leftrightarrow|\\Rightarrow/);
      if (inlineArrow) {
        const arrow = inlineArrow[0];
        const [left, ...rest] = step.split(arrow);
        const right = rest.join(arrow).trim();
        return `${left.trim()} &${arrow} ${right}`;
      }
      return step;
    }

    const arrowMatch = step.match(/^(\\Leftrightarrow|\\Rightarrow)\s*/);
    if (arrowMatch) {
      const arrow = arrowMatch[1];
      const rest = step.slice(arrowMatch[0].length).trim();
      return `&${arrow} ${rest}`;
    }

    return `&${step}`;
  });

  return wrapBlock(`\\begin{aligned}\n${alignedLines.join(' \\\\\n')}\n\\end{aligned}`);
}

function transformStepBlock(content) {
  const trimmed = content.trim();
  if (/\\begin\{aligned\}/.test(trimmed)) return null;

  const hasStepSeparators =
    /^[=]{3,}$/m.test(content) || /^[-]{3,}$/m.test(content) || /^#+\s/m.test(content);

  if (!hasStepSeparators) return null;

  const mathLines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/^[=\-]{3,}$/.test(line))
    .map((line) => line.replace(/^#+\s*/, '').trim())
    .filter(Boolean);

  if (mathLines.length < 2) return null;

  let aligned;
  if (mathLines.length === 3) {
    aligned = `${mathLines[0]} &= ${mathLines[1]} \\\\\n&= ${mathLines[2]}`;
  } else if (mathLines.length === 2) {
    aligned = `${mathLines[0]} &= ${mathLines[1]}`;
  } else {
    aligned = mathLines
      .map((line, idx) => (idx === 0 ? line : `&= ${line.replace(/^=\s*/, '')}`))
      .join(' \\\\\n');
  }

  return wrapBlock(`\\begin{aligned}\n${aligned}\n\\end{aligned}`);
}

export function preprocessMathBlocks(source) {
  return splitByMathRegions(source)
    .map((segment) => {
      if (segment.type !== 'block') return segment.text;

      const inner = getBlockInner(segment.text);
      const transformed =
        transformEquivChainBlock(inner) ?? transformStepBlock(inner);

      return transformed ?? segment.text;
    })
    .join('');
}

const MC_OPTION_LINE = /^[A-D]\.\s/;
const SUB_PART_LINE = /^[a-z]\)\s/;
const HEADING_LINE = /^#{1,6}\s/;

/**
 * Tách nhãn a) b) c) khỏi \[ / $$ trên cùng dòng — marked-katex cần $$ đứng một mình.
 */
export function splitSubpartFromDisplayMath(source) {
  let result = source;

  result = result.replace(/^([a-z]\))\s*(\\\[)\s*$/gim, '$1\n\n$2');
  result = result.replace(/^([a-z]\))\s*(\$\$)\s*$/gim, '$1\n\n$2');
  result = result.replace(/([a-z]\))\s+(\\\[|\$\$)/g, '$1\n\n$2');

  return result;
}

export function normalizeExamLineBreaks(source) {
  const lines = source.split('\n');
  const result = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '') {
      if (result.length > 0 && result[result.length - 1] === '') continue;
      result.push('');
      continue;
    }

    const needsBreakBefore =
      MC_OPTION_LINE.test(trimmed) || SUB_PART_LINE.test(trimmed);

    if (needsBreakBefore) {
      const prev = result[result.length - 1];
      if (prev !== undefined && prev.trim() !== '') {
        result.push('');
      }
    }

    if (HEADING_LINE.test(trimmed)) {
      const prev = result[result.length - 1];
      if (prev !== undefined && prev.trim() !== '') {
        result.push('');
      }
    }

    result.push(line);

    if (HEADING_LINE.test(trimmed)) {
      result.push('');
    }
  }

  return result.join('\n').replace(/\n{3,}/g, '\n\n');
}

/**
 * KaTeX/marked-katex chỉ hiểu $ và $$ — chuyển LaTeX \( \) / \[ \] trước khi render web/PDF.
 * Giữ nguyên LaTeX trong editor và khi xuất DOCX (Pandoc).
 */
export function latexDelimitersToDollars(source) {
  let result = source;

  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, content) => {
    return `$$\n${content.trim()}\n$$`;
  });

  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, content) => {
    return `$${content.trim()}$`;
  });

  return result;
}

/** Chuẩn bị markdown cho preview HTML và xuất PDF. */
export function preprocessForRender(source) {
  let result = preprocessMarkdown(source);
  result = latexDelimitersToDollars(result);
  result = ensureBlockMathSpacing(result);
  return result;
}

/** Preview khi đang stream — nhẹ hơn, vẫn render được LaTeX. */
export function preprocessForRenderLight(source) {
  let result = preprocessMarkdownLight(source);
  result = mergeConsecutiveDisplayBlocks(result);
  result = latexDelimitersToDollars(result);
  result = ensureBlockMathSpacing(result);
  return result;
}

/** Tiền xử lý nhẹ khi đang stream (tránh lỗi khối math chưa đóng). */
export function preprocessMarkdownLight(source) {
  let result = normalizeToLatexDelimiters(source);
  result = splitSubpartFromDisplayMath(result);
  result = normalizeExamLineBreaks(result);
  return result;
}

/** Tiền xử lý toàn bộ Markdown trước khi xuất DOCX (giữ delimiter LaTeX). */
export function preprocessMarkdown(source) {
  let result = normalizeBracketBlocks(source);
  result = normalizeToLatexDelimiters(result);
  result = splitSubpartFromDisplayMath(result);
  result = normalizeParenMath(result);
  result = mergeConsecutiveDisplayBlocks(result);
  result = preprocessMathBlocks(result);
  result = normalizeExamLineBreaks(result);
  result = ensureLatexBlockSpacing(result);
  result = fixBrokenInlineSuperscript(result);
  return result;
}

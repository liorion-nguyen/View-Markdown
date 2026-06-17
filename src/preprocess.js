/**
 * Chuyển khối toán dạng [ ... ] (dấu [ ] trên dòng riêng) sang $$ ... $$.
 */
export function normalizeBracketBlocks(source) {
  return source.replace(/^(\s*)\[\s*\n([\s\S]*?)\n\s*\]\s*$/gm, (_, indent, content) => {
    return `${indent}\n$$\n${content.trim()}\n$$`;
  });
}

/**
 * Chuyển delimiter LaTeX phổ biến \( \) và \[ \] sang $ và $$.
 */
export function normalizeLatexDelimiters(source) {
  let result = source.replace(/\\\[([\s\S]*?)\\\]/g, (_, content) => {
    return `$$\n${content.trim()}\n$$`;
  });

  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, content) => {
    return `$${content.trim()}$`;
  });

  return result;
}

function isEscaped(source, index) {
  let slashes = 0;
  for (let j = index - 1; j >= 0 && source[j] === '\\'; j--) slashes++;
  return slashes % 2 === 1;
}

/** Tách vùng text / $inline$ / $$block$$ */
function splitByMathRegions(source) {
  const segments = [];
  let i = 0;
  let textStart = 0;

  while (i < source.length) {
    if (source[i] === '$' && !isEscaped(source, i)) {
      if (source[i + 1] === '$') {
        if (i > textStart) segments.push({ type: 'text', text: source.slice(textStart, i) });
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
        if (i > textStart) segments.push({ type: 'text', text: source.slice(textStart, i) });
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
    } else {
      i++;
    }
  }

  if (textStart < source.length) {
    segments.push({ type: 'text', text: source.slice(textStart) });
  }

  return segments;
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

          result += `$${full}$`;
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

/**
 * Chuyển (biểu thức toán) sang $biểu thức$.
 * Không đụng vào vùng $...$ và $$...$$ đã có sẵn.
 */
export function normalizeParenMath(source) {
  return splitByMathRegions(source)
    .map((segment) =>
      segment.type === 'text' ? convertParensInText(segment.text) : segment.text
    )
    .join('');
}

function fixAdjacentInlineMath(source) {
  return source.replace(/\$([^$\n]+)\$\$([^$\n]+)\$/g, '$$1$ $$2$');
}

function transformStepBlock(content) {
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

  return `$$\n\\begin{aligned}\n${aligned}\n\\end{aligned}\n$$`;
}

/**
 * Chuyển các bước tính trong khối $$ có dòng phân cách (=, ---, #)
 * thành môi trường aligned để KaTeX render đúng.
 */
export function preprocessMathBlocks(source) {
  return splitByMathRegions(source)
    .map((segment) => {
      if (segment.type !== 'block') return segment.text;
      const inner = segment.text.slice(2, -2);
      const transformed = transformStepBlock(inner);
      return transformed ?? segment.text;
    })
    .join('');
}

/** Tiền xử lý toàn bộ Markdown trước khi render. */
export function preprocessMarkdown(source) {
  let result = normalizeBracketBlocks(source);
  result = normalizeLatexDelimiters(result);
  result = normalizeParenMath(result);
  result = fixAdjacentInlineMath(result);
  result = preprocessMathBlocks(result);
  return result;
}

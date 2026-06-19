const STORAGE_PREFIX = 'codelab-ws-layout-';

const LIMITS = {
  left: { min: 260, max: 520, default: 340 },
  editor: { min: 280, maxRatio: 0.72, defaultRatio: 0.48 },
};

function readNumber(key, fallback) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

function writeNumber(key, value) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, String(Math.round(value)));
  } catch {
    /* ignore */
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * @param {HTMLElement} shell `.workspace-shell`
 */
function applyLayout(shell) {
  const screen = shell.closest('[data-screen]')?.dataset.screen || 'workspace';
  const left = readNumber(`${screen}-left`, LIMITS.left.default);
  const editorPx = readNumber(`${screen}-editor`, 0);

  shell.style.setProperty('--ws-left', `${clamp(left, LIMITS.left.min, LIMITS.left.max)}px`);

  const main = shell.querySelector('.workspace-main');
  const editorPanel = shell.querySelector('.panel--editor');
  if (!main || !editorPanel) return;

  const mainWidth = main.getBoundingClientRect().width;
  let editorWidth = editorPx;

  if (!editorWidth || editorWidth < LIMITS.editor.min) {
    editorWidth = mainWidth * LIMITS.editor.defaultRatio;
  }

  editorWidth = clamp(
    editorWidth,
    LIMITS.editor.min,
    Math.max(LIMITS.editor.min, mainWidth - LIMITS.editor.min),
  );

  shell.style.setProperty('--ws-editor', `${editorWidth}px`);
}

function wireShell(shell) {
  const screen = shell.closest('[data-screen]')?.dataset.screen || 'workspace';
  const resizerLeft = shell.querySelector('[data-resizer="left"]');
  const resizerMid = shell.querySelector('[data-resizer="mid"]');
  const main = shell.querySelector('.workspace-main');

  applyLayout(shell);

  const ro = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => applyLayout(shell))
    : null;
  ro?.observe(shell);

  function startDrag(resizer, onMove) {
    resizer.classList.add('is-dragging');
    document.body.classList.add('workspace-is-resizing');

    const move = (e) => onMove(e.clientX);
    const end = () => {
      resizer.classList.remove('is-dragging');
      document.body.classList.remove('workspace-is-resizing');
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', end);
      document.removeEventListener('touchmove', touchMove);
      document.removeEventListener('touchend', end);
    };
    const touchMove = (e) => {
      if (e.touches[0]) move(e.touches[0].clientX);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', end);
    document.addEventListener('touchmove', touchMove, { passive: true });
    document.addEventListener('touchend', end);
  }

  resizerLeft?.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const shellRect = shell.getBoundingClientRect();
    startDrag(resizerLeft, (clientX) => {
      const width = clamp(clientX - shellRect.left, LIMITS.left.min, LIMITS.left.max);
      shell.style.setProperty('--ws-left', `${width}px`);
      writeNumber(`${screen}-left`, width);
    });
  });

  resizerLeft?.addEventListener('touchstart', (e) => {
    const shellRect = shell.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    startDrag(resizerLeft, (clientX) => {
      const width = clamp(clientX - shellRect.left, LIMITS.left.min, LIMITS.left.max);
      shell.style.setProperty('--ws-left', `${width}px`);
      writeNumber(`${screen}-left`, width);
    });
  }, { passive: true });

  resizerMid?.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (!main) return;
    const mainRect = main.getBoundingClientRect();
    startDrag(resizerMid, (clientX) => {
      const width = clamp(
        clientX - mainRect.left,
        LIMITS.editor.min,
        Math.max(LIMITS.editor.min, mainRect.width - LIMITS.editor.min),
      );
      shell.style.setProperty('--ws-editor', `${width}px`);
      writeNumber(`${screen}-editor`, width);
    });
  });

  resizerMid?.addEventListener('touchstart', (e) => {
    if (!main) return;
    const mainRect = main.getBoundingClientRect();
    startDrag(resizerMid, (clientX) => {
      const width = clamp(
        clientX - mainRect.left,
        LIMITS.editor.min,
        Math.max(LIMITS.editor.min, mainRect.width - LIMITS.editor.min),
      );
      shell.style.setProperty('--ws-editor', `${width}px`);
      writeNumber(`${screen}-editor`, width);
    });
  }, { passive: true });

  resizerLeft?.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const current = readNumber(`${screen}-left`, LIMITS.left.default);
    const delta = e.key === 'ArrowLeft' ? -16 : 16;
    const width = clamp(current + delta, LIMITS.left.min, LIMITS.left.max);
    shell.style.setProperty('--ws-left', `${width}px`);
    writeNumber(`${screen}-left`, width);
  });

  resizerMid?.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key) || !main) return;
    e.preventDefault();
    const current = readNumber(`${screen}-editor`, main.getBoundingClientRect().width * LIMITS.editor.defaultRatio);
    const delta = e.key === 'ArrowLeft' ? -16 : 16;
    const mainWidth = main.getBoundingClientRect().width;
    const width = clamp(
      current + delta,
      LIMITS.editor.min,
      Math.max(LIMITS.editor.min, mainWidth - LIMITS.editor.min),
    );
    shell.style.setProperty('--ws-editor', `${width}px`);
    writeNumber(`${screen}-editor`, width);
  });
}

/** Gắn kéo thay đổi width cho mọi workspace (AI + compose). */
export function wireWorkspaceResizers(root = document) {
  root.querySelectorAll('.workspace-shell').forEach(wireShell);
}

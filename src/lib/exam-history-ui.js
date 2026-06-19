import { captureFormSnapshot, restoreFormSnapshot } from './exam-form-snapshot.js';
import {
  createHistoryId,
  deleteExamHistoryEntry,
  deriveExamTitle,
  formatHistoryDate,
  getExamHistoryEntry,
  loadExamHistory,
  saveExamHistoryEntry,
} from './exam-history-store.js';
import { screenFromPath } from './routes.js';

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitFor(condition, { timeout = 4000, interval = 50 } = {}) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (condition()) {
        resolve();
        return;
      }
      if (Date.now() - start >= timeout) {
        reject(new Error('timeout'));
        return;
      }
      setTimeout(tick, interval);
    };
    tick();
  });
}

const HISTORY_ICONS = {
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/></svg>`,
  doc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>`,
  save: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  empty: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 12h6M12 9v6"/><circle cx="12" cy="12" r="9"/></svg>`,
};

/**
 * @param {{
 *   navigate?: (path: string) => void;
 *   syncScreen?: (pathname?: string) => void;
 *   getActiveScreen: () => string;
 *   getWorkspaceEditor: () => HTMLTextAreaElement;
 *   getComposeEditor: () => HTMLTextAreaElement;
 *   renderWorkspacePreview: () => void;
 *   renderComposePreview: () => void;
 *   showToast?: (opts: object) => void;
 * }} deps
 */
export function createExamHistoryController(deps) {
  const {
    navigate = (path) => window.location.assign(path),
    syncScreen,
    getActiveScreen,
    getWorkspaceEditor,
    getComposeEditor,
    renderWorkspacePreview,
    renderComposePreview,
    showToast,
  } = deps;

  let overlay = null;
  let drawer = null;
  let listEl = null;
  let emptyEl = null;
  let countEl = null;
  let headerBtn = null;
  let headerBadge = null;
  let mobileBadge = null;
  let currentHistoryId = null;
  let autosaveTimer = null;

  function getModeFromScreen(screen) {
    return screen === 'compose' ? 'compose' : 'workspace';
  }

  function getCurrentMode() {
    return getModeFromScreen(getActiveScreen());
  }

  function getCurrentMarkdown() {
    const mode = getCurrentMode();
    if (mode === 'compose') return getComposeEditor().value;
    return getWorkspaceEditor().value;
  }

  function getFormPrefix(mode) {
    return mode === 'compose' ? 'cf-' : 'ef-';
  }

  function clearAutosaveTimer() {
    if (autosaveTimer) {
      clearTimeout(autosaveTimer);
      autosaveTimer = null;
    }
  }

  function scheduleAutosave() {
    clearAutosaveTimer();
    autosaveTimer = setTimeout(() => {
      autosaveTimer = null;
      saveCurrentExam({ source: 'autosave' });
    }, 2500);
  }

  function updateBadges() {
    const count = loadExamHistory().length;
    const label = count > 0 ? String(count) : '0';

    if (headerBadge) {
      headerBadge.textContent = label;
      headerBadge.classList.toggle('hidden', count === 0);
    }
    if (mobileBadge) {
      mobileBadge.textContent = label;
      mobileBadge.classList.toggle('hidden', count === 0);
    }
    if (countEl) {
      countEl.textContent =
        count === 0 ? 'Chưa có đề' : `${count} đề đã lưu`;
    }
  }

  function saveCurrentExam({ source = 'manual' } = {}) {
    const markdown = getCurrentMarkdown().trim();
    if (!markdown) return null;

    const mode = getCurrentMode();
    const prefix = getFormPrefix(mode);
    const now = Date.now();
    const title = deriveExamTitle(markdown);
    const formSnapshot = captureFormSnapshot(prefix);

    let entry;

    if (currentHistoryId && source !== 'manual-new') {
      const existing = getExamHistoryEntry(currentHistoryId);
      if (existing) {
        entry = {
          ...existing,
          mode,
          title,
          markdown,
          formSnapshot,
          updatedAt: now,
        };
      }
    }

    if (!entry) {
      entry = {
        id: createHistoryId(),
        mode,
        title,
        markdown,
        formSnapshot,
        createdAt: now,
        updatedAt: now,
      };
      currentHistoryId = entry.id;
    }

    saveExamHistoryEntry(entry);
    renderList();

    if (source === 'manual') {
      showToast?.({
        type: 'success',
        title: 'Đã lưu vào lịch sử',
        message: title,
      });
    }

    return entry;
  }

  function clearCurrentHistorySession() {
    currentHistoryId = null;
    clearAutosaveTimer();
  }

  async function restoreEntry(id) {
    const entry = getExamHistoryEntry(id);
    if (!entry) return;

    const path = entry.mode === 'compose' ? '/compose' : '/workspace';
    const targetScreen = entry.mode === 'compose' ? 'compose' : 'workspace';

    if (getActiveScreen() !== targetScreen) {
      navigate(path);
      syncScreen?.(path);
      await wait(80);
      try {
        await waitFor(() => screenFromPath(window.location.pathname) === targetScreen);
      } catch {
        /* continue */
      }
    }

    const prefix = getFormPrefix(entry.mode);
    restoreFormSnapshot(prefix, entry.formSnapshot);

    if (entry.mode === 'compose') {
      getComposeEditor().value = entry.markdown;
      renderComposePreview();
    } else {
      getWorkspaceEditor().value = entry.markdown;
      renderWorkspacePreview();
    }

    currentHistoryId = entry.id;
    closePanel();

    showToast?.({
      type: 'success',
      title: 'Đã mở đề từ lịch sử',
      message: entry.title,
    });
  }

  function deleteEntry(id) {
    deleteExamHistoryEntry(id);
    if (currentHistoryId === id) currentHistoryId = null;
    renderList();
  }

  function renderList() {
    if (!listEl || !emptyEl) return;

    const entries = loadExamHistory();
    emptyEl.classList.toggle('hidden', entries.length > 0);
    listEl.classList.toggle('hidden', entries.length === 0);
    updateBadges();

    listEl.innerHTML = entries
      .map((entry) => {
        const modeLabel = entry.mode === 'compose' ? 'Thủ công' : 'AI';
        const modeClass =
          entry.mode === 'compose' ? 'history-card__chip--manual' : 'history-card__chip--ai';
        const subject = entry.formSnapshot?.subject;
        const grade = entry.formSnapshot?.grade;
        const preview = entry.markdown.replace(/\s+/g, ' ').slice(0, 100);

        return `
          <li class="history-card" data-history-id="${escapeHtml(entry.id)}">
            <button type="button" class="history-card__open" data-action="open" aria-label="Mở đề ${escapeHtml(entry.title)}">
              <div class="history-card__icon" aria-hidden="true">${HISTORY_ICONS.doc}</div>
              <div class="history-card__content">
                <div class="history-card__head">
                  <h3 class="history-card__title">${escapeHtml(entry.title)}</h3>
                  <div class="history-card__chips">
                    <span class="history-card__chip ${modeClass}">${modeLabel}</span>
                    ${subject ? `<span class="history-card__chip">${escapeHtml(subject)}</span>` : ''}
                    ${grade ? `<span class="history-card__chip">Lớp ${escapeHtml(grade)}</span>` : ''}
                  </div>
                </div>
                <p class="history-card__preview">${escapeHtml(preview)}${entry.markdown.length > 100 ? '…' : ''}</p>
                <div class="history-card__meta">
                  <time>${escapeHtml(formatHistoryDate(entry.updatedAt))}</time>
                  <span class="history-card__cta">Mở đề ${HISTORY_ICONS.arrow}</span>
                </div>
              </div>
            </button>
            <button
              type="button"
              class="history-card__delete"
              data-action="delete"
              aria-label="Xóa đề ${escapeHtml(entry.title)}"
            >
              ${HISTORY_ICONS.trash}
            </button>
          </li>`;
      })
      .join('');
  }

  function openPanel() {
    if (!overlay) return;
    renderList();
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    document.body.classList.add('history-panel-open');
    headerBtn?.classList.add('is-active');
    headerBtn?.setAttribute('aria-expanded', 'true');
  }

  function closePanel() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.classList.remove('history-panel-open');
    headerBtn?.classList.remove('is-active');
    headerBtn?.setAttribute('aria-expanded', 'false');
    window.setTimeout(() => {
      if (!overlay.classList.contains('is-open')) {
        overlay.classList.add('hidden');
      }
    }, 280);
  }

  function bindUi(root) {
    overlay = root;
    drawer = root.querySelector('.history-drawer');
    listEl = root.querySelector('#history-list');
    emptyEl = root.querySelector('#history-empty');
    countEl = root.querySelector('#history-count');
    headerBtn = document.getElementById('btn-history');
    headerBadge = document.getElementById('history-header-badge');
    mobileBadge = document.getElementById('history-mobile-badge');

    root.querySelector('#btn-history-close')?.addEventListener('click', closePanel);
    root.querySelector('.history-drawer__backdrop')?.addEventListener('click', closePanel);

    root.querySelector('#btn-history-save')?.addEventListener('click', () => {
      if (!getCurrentMarkdown().trim()) {
        showToast?.({
          type: 'success',
          title: 'Chưa có nội dung',
          message: 'Soạn hoặc tạo đề trước khi lưu.',
        });
        return;
      }
      saveCurrentExam({ source: 'manual' });
    });

    listEl?.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('[data-action="delete"]');
      if (deleteBtn) {
        const item = deleteBtn.closest('.history-card');
        if (item) deleteEntry(item.dataset.historyId);
        return;
      }

      const openBtn = e.target.closest('[data-action="open"]');
      if (openBtn) {
        const item = openBtn.closest('.history-card');
        if (item) restoreEntry(item.dataset.historyId);
      }
    });

    updateBadges();
  }

  return {
    bindUi,
    openPanel,
    closePanel,
    saveCurrentExam,
    scheduleAutosave,
    clearCurrentHistorySession,
    renderList,
  };
}

/** HTML drawer lịch sử đề */
export function renderExamHistoryPanel() {
  return `
  <div class="history-drawer-root hidden" id="history-overlay" role="dialog" aria-modal="true" aria-labelledby="history-title">
    <div class="history-drawer__backdrop" aria-hidden="true"></div>
    <aside class="history-drawer" aria-labelledby="history-title">
      <header class="history-drawer__hero">
        <div class="history-drawer__hero-glow" aria-hidden="true"></div>
        <div class="history-drawer__hero-row">
          <div class="history-drawer__hero-icon" aria-hidden="true">${HISTORY_ICONS.clock}</div>
          <div class="history-drawer__hero-text">
            <h2 id="history-title">Lịch sử đề</h2>
            <p>Lưu trên trình duyệt · tối đa 20 đề</p>
          </div>
          <button type="button" class="history-drawer__close" id="btn-history-close" aria-label="Đóng">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="history-drawer__hero-actions">
          <button type="button" class="history-drawer__save" id="btn-history-save">
            ${HISTORY_ICONS.save}
            <span>Lưu đề hiện tại</span>
          </button>
          <span class="history-drawer__count" id="history-count">Chưa có đề</span>
        </div>
      </header>

      <div class="history-drawer__body">
        <div class="history-drawer__empty hidden" id="history-empty">
          <div class="history-drawer__empty-icon" aria-hidden="true">${HISTORY_ICONS.empty}</div>
          <h3>Chưa có đề lưu</h3>
          <p>Tạo đề bằng AI hoặc dán Markdown — hệ thống tự lưu sau khi tạo hoặc xuất file.</p>
        </div>
        <ul class="history-list" id="history-list"></ul>
      </div>
    </aside>
  </div>`;
}

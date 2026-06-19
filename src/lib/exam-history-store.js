export const EXAM_HISTORY_STORAGE_KEY = 'codelab-exam-history-v1';
export const MAX_EXAM_HISTORY = 20;

/**
 * @typedef {'workspace' | 'compose'} ExamHistoryMode
 *
 * @typedef {Object} ExamHistoryEntry
 * @property {string} id
 * @property {ExamHistoryMode} mode
 * @property {string} title
 * @property {string} markdown
 * @property {import('./exam-form-snapshot.js').ExamFormSnapshot | null} formSnapshot
 * @property {number} createdAt
 * @property {number} updatedAt
 */

export function deriveExamTitle(markdown) {
  const lines = markdown.split('\n');

  const titleLine =
    lines.find((line) => /^#\s+ĐỀ/i.test(line.trim())) ??
    lines.find(
      (line) =>
        /^#\s+/.test(line.trim()) && !/^#\s*CodeLab\s*$/i.test(line.trim()),
    ) ??
    lines.find((line) => line.trim());

  const rawTitle = titleLine?.replace(/^#+\s*/, '').trim() ?? '';

  return rawTitle.slice(0, 80) || 'Đề chưa có tiêu đề';
}

export function createHistoryId() {
  return `hist_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** @returns {ExamHistoryEntry[]} */
export function loadExamHistory() {
  try {
    const raw = localStorage.getItem(EXAM_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** @param {ExamHistoryEntry[]} entries */
function persistExamHistory(entries) {
  const trimmed = entries.slice(0, MAX_EXAM_HISTORY);

  try {
    localStorage.setItem(EXAM_HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
    return true;
  } catch {
    for (let limit = trimmed.length - 1; limit >= 1; limit -= 1) {
      try {
        localStorage.setItem(EXAM_HISTORY_STORAGE_KEY, JSON.stringify(trimmed.slice(0, limit)));
        return true;
      } catch {
        /* retry smaller */
      }
    }
    return false;
  }
}

/** @param {ExamHistoryEntry} entry */
export function saveExamHistoryEntry(entry) {
  const entries = loadExamHistory();
  const index = entries.findIndex((item) => item.id === entry.id);

  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.unshift(entry);
  }

  entries.sort((a, b) => b.updatedAt - a.updatedAt);
  persistExamHistory(entries);
  return entry;
}

export function deleteExamHistoryEntry(id) {
  const entries = loadExamHistory().filter((item) => item.id !== id);
  persistExamHistory(entries);
}

export function getExamHistoryEntry(id) {
  return loadExamHistory().find((item) => item.id === id) ?? null;
}

export function formatHistoryDate(timestamp) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

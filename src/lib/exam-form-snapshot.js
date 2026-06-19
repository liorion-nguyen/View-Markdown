import { setCustomSelectValue } from './components/custom-select.js';
import { EXAM_FEATURE_GROUPS } from './exam-form-config.js';

/**
 * @typedef {Object} ExamFormSnapshot
 * @property {string} subject
 * @property {string} grade
 * @property {string} examType
 * @property {string} topic
 * @property {string} mcCount
 * @property {string} essayCount
 * @property {string} difficulty
 * @property {string} time
 * @property {string} notes
 * @property {Record<string, boolean>} features
 */

/** @param {string} prefix */
export function captureFormSnapshot(prefix) {
  const features = {};

  for (const group of EXAM_FEATURE_GROUPS) {
    for (const feature of group.features) {
      const el = document.getElementById(`${prefix}${feature.id}`);
      if (el) features[feature.id] = el.checked;
    }
  }

  return {
    subject: document.getElementById(`${prefix}subject`)?.dataset.value?.trim() ?? '',
    grade: document.getElementById(`${prefix}grade`)?.dataset.value?.trim() ?? '',
    examType: document.getElementById(`${prefix}exam-type`)?.dataset.value?.trim() ?? '',
    topic: document.getElementById(`${prefix}topic`)?.value ?? '',
    mcCount: document.getElementById(`${prefix}mc-count`)?.value ?? '0',
    essayCount: document.getElementById(`${prefix}essay-count`)?.value ?? '0',
    difficulty: document.getElementById(`${prefix}difficulty`)?.value ?? 'Cơ bản',
    time: document.getElementById(`${prefix}time`)?.value ?? '',
    notes: document.getElementById(`${prefix}notes`)?.value ?? '',
    features,
  };
}

/**
 * @param {string} prefix
 * @param {ExamFormSnapshot | null | undefined} snapshot
 */
export function restoreFormSnapshot(prefix, snapshot) {
  if (!snapshot) return;

  setCustomSelectValue(`${prefix}subject`, snapshot.subject, snapshot.subject);
  setCustomSelectValue(`${prefix}grade`, snapshot.grade, snapshot.grade);
  setCustomSelectValue(`${prefix}exam-type`, snapshot.examType, snapshot.examType);

  const topicEl = document.getElementById(`${prefix}topic`);
  if (topicEl) topicEl.value = snapshot.topic ?? '';

  const mcEl = document.getElementById(`${prefix}mc-count`);
  if (mcEl) mcEl.value = snapshot.mcCount ?? '0';

  const essayEl = document.getElementById(`${prefix}essay-count`);
  if (essayEl) essayEl.value = snapshot.essayCount ?? '0';

  const diffEl = document.getElementById(`${prefix}difficulty`);
  if (diffEl) diffEl.value = snapshot.difficulty ?? 'Cơ bản';

  const timeEl = document.getElementById(`${prefix}time`);
  if (timeEl) timeEl.value = snapshot.time ?? '';

  const notesEl = document.getElementById(`${prefix}notes`);
  if (notesEl) notesEl.value = snapshot.notes ?? '';

  for (const group of EXAM_FEATURE_GROUPS) {
    for (const feature of group.features) {
      const el = document.getElementById(`${prefix}${feature.id}`);
      if (el && snapshot.features) {
        el.checked = snapshot.features[feature.id] ?? false;
      }
    }
  }
}

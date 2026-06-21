import { setCustomSelectValue } from './components/custom-select.js';
import { EXAM_FEATURE_GROUPS } from './exam-form-config.js';

/**
 * @typedef {Object} ExamFormSnapshot
 * @property {string} subject
 * @property {string} grade
 * @property {string} schoolName
 * @property {string} schoolYear
 * @property {string} examType
 * @property {string} semester
 * @property {string} examCode
 * @property {string} topic
 * @property {string} specificLessons
 * @property {string} excludedTopics
 * @property {string} mcCount
 * @property {string} mcScore
 * @property {string} essayCount
 * @property {string} essayScoreDist
 * @property {string} difficulty
 * @property {string} time
 * @property {string} cogRecognize
 * @property {string} cogUnderstand
 * @property {string} cogApply
 * @property {string} cogAdvanced
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

  const g = (id) => document.getElementById(`${prefix}${id}`)?.value ?? '';
  const gds = (id) => document.getElementById(`${prefix}${id}`)?.dataset.value?.trim() ?? '';

  return {
    subject: gds('subject'),
    grade: gds('grade'),
    schoolName: g('school-name'),
    schoolYear: g('school-year'),
    examType: gds('exam-type'),
    semester: gds('semester'),
    examCode: g('exam-code'),
    topic: g('topic'),
    specificLessons: g('specific-lessons'),
    excludedTopics: g('excluded-topics'),
    mcCount: g('mc-count') || '0',
    mcScore: g('mc-score'),
    essayCount: g('essay-count') || '0',
    essayScoreDist: g('essay-score-dist'),
    difficulty: g('difficulty') || 'Cơ bản',
    time: g('time'),
    cogRecognize: g('cog-recognize'),
    cogUnderstand: g('cog-understand'),
    cogApply: g('cog-apply'),
    cogAdvanced: g('cog-advanced'),
    notes: g('notes'),
    features,
  };
}

/**
 * @param {string} prefix
 * @param {ExamFormSnapshot | null | undefined} snapshot
 */
export function restoreFormSnapshot(prefix, snapshot) {
  if (!snapshot) return;

  const s = (id, val) => {
    const el = document.getElementById(`${prefix}${id}`);
    if (el) el.value = val ?? '';
  };

  setCustomSelectValue(`${prefix}subject`, snapshot.subject, snapshot.subject);
  setCustomSelectValue(`${prefix}grade`, snapshot.grade, snapshot.grade);
  setCustomSelectValue(`${prefix}exam-type`, snapshot.examType, snapshot.examType);
  setCustomSelectValue(`${prefix}semester`, snapshot.semester, snapshot.semester);

  s('school-name', snapshot.schoolName);
  s('school-year', snapshot.schoolYear);
  s('exam-code', snapshot.examCode);
  s('topic', snapshot.topic);
  s('specific-lessons', snapshot.specificLessons);
  s('excluded-topics', snapshot.excludedTopics);
  s('mc-count', snapshot.mcCount ?? '0');
  s('mc-score', snapshot.mcScore);
  s('essay-count', snapshot.essayCount ?? '0');
  s('essay-score-dist', snapshot.essayScoreDist);
  s('difficulty', snapshot.difficulty ?? 'Cơ bản');
  s('time', snapshot.time);
  s('cog-recognize', snapshot.cogRecognize);
  s('cog-understand', snapshot.cogUnderstand);
  s('cog-apply', snapshot.cogApply);
  s('cog-advanced', snapshot.cogAdvanced);
  s('notes', snapshot.notes);

  for (const group of EXAM_FEATURE_GROUPS) {
    for (const feature of group.features) {
      const el = document.getElementById(`${prefix}${feature.id}`);
      if (el && snapshot.features) {
        el.checked = snapshot.features[feature.id] ?? false;
      }
    }
  }
}

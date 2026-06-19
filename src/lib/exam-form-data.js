import { getCustomSelectValue } from './components/custom-select.js';
import {
  clearFieldError,
  clearFormErrors,
  focusFirstInvalidField,
  labelWithRequired,
  setFieldError,
} from './form-validation.js';
import { getSelectedFeaturePrompts } from './exam-form-config.js';

export function parseQuestionCount(id) {
  const raw = document.getElementById(id)?.value.trim() ?? '';
  if (raw === '') return 0;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function buildFeatureNotes(prefix) {
  const parts = getSelectedFeaturePrompts(prefix);

  const examType = getCustomSelectValue(`${prefix}exam-type`);
  if (examType) {
    parts.push(`Loại bài kiểm tra: ${examType}`);
  }

  const freeNotes = document.getElementById(`${prefix}notes`)?.value.trim() ?? '';
  if (freeNotes) {
    parts.push(freeNotes);
  }

  return parts.join('\n- ');
}

export function validateExamForm(prefix, formId) {
  const form = document.getElementById(formId);
  clearFormErrors(form);

  const subject = getCustomSelectValue(`${prefix}subject`);
  const grade = getCustomSelectValue(`${prefix}grade`);
  const mcCount = parseQuestionCount(`${prefix}mc-count`);
  const essayCount = parseQuestionCount(`${prefix}essay-count`);

  let valid = true;

  if (!subject) {
    setFieldError(`${prefix}subject`, 'Vui lòng chọn hoặc nhập môn học.');
    valid = false;
  }

  if (!grade) {
    setFieldError(`${prefix}grade`, 'Vui lòng chọn hoặc nhập khối lớp.');
    valid = false;
  }

  if (mcCount === 0 && essayCount === 0) {
    setFieldError(
      `${prefix}questions-group`,
      'Cần ít nhất 1 câu trắc nghiệm hoặc 1 bài tự luận.',
    );
    valid = false;
  }

  if (!valid) {
    focusFirstInvalidField();
    return null;
  }

  return { subject, grade, mcCount, essayCount };
}

export function getExamFormData(prefix, formId) {
  const validated = validateExamForm(prefix, formId);
  if (!validated) return null;

  return {
    subject: validated.subject,
    grade: validated.grade,
    topic: document.getElementById(`${prefix}topic`)?.value.trim() ?? '',
    mcCount: validated.mcCount,
    essayCount: validated.essayCount,
    difficulty: document.getElementById(`${prefix}difficulty`)?.value ?? 'Cơ bản',
    time: document.getElementById(`${prefix}time`)?.value.trim() ?? '',
    notes: buildFeatureNotes(prefix),
  };
}

export { labelWithRequired };

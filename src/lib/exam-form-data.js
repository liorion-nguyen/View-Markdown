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

/**
 * Đọc ma trận nhận thức — trả về object hoặc null nếu tất cả trống.
 */
export function parseCognitiveMatrix(prefix) {
  const recognize = document.getElementById(`${prefix}cog-recognize`)?.value.trim();
  const understand = document.getElementById(`${prefix}cog-understand`)?.value.trim();
  const apply = document.getElementById(`${prefix}cog-apply`)?.value.trim();
  const advanced = document.getElementById(`${prefix}cog-advanced`)?.value.trim();

  const allEmpty = !recognize && !understand && !apply && !advanced;
  if (allEmpty) return null;

  return {
    recognize: recognize ? Number(recognize) : null,
    understand: understand ? Number(understand) : null,
    apply: apply ? Number(apply) : null,
    advanced: advanced ? Number(advanced) : null,
  };
}

export function buildFeatureNotes(prefix) {
  const parts = getSelectedFeaturePrompts(prefix);

  const semester = getCustomSelectValue(`${prefix}semester`);
  if (semester) {
    parts.push(`Phạm vi kiến thức: ${semester}`);
  }

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
    // Thông tin đề (header)
    schoolName: document.getElementById(`${prefix}school-name`)?.value.trim() ?? '',
    subject: validated.subject,
    grade: validated.grade,
    schoolYear: document.getElementById(`${prefix}school-year`)?.value.trim() ?? '',
    examType: getCustomSelectValue(`${prefix}exam-type`) ?? '',
    semester: getCustomSelectValue(`${prefix}semester`) ?? '',
    time: document.getElementById(`${prefix}time`)?.value.trim() ?? '',
    examCode: document.getElementById(`${prefix}exam-code`)?.value.trim() ?? '',

    // Cấu trúc đề
    mcCount: validated.mcCount,
    mcScore: document.getElementById(`${prefix}mc-score`)?.value.trim() ?? '',
    essayCount: validated.essayCount,
    essayScoreDist: document.getElementById(`${prefix}essay-score-dist`)?.value.trim() ?? '',
    difficulty: document.getElementById(`${prefix}difficulty`)?.value ?? 'Cơ bản',

    // Ma trận nhận thức
    cognitiveMatrix: parseCognitiveMatrix(prefix),

    // Nội dung kiến thức
    topic: document.getElementById(`${prefix}topic`)?.value.trim() ?? '',
    specificLessons: document.getElementById(`${prefix}specific-lessons`)?.value.trim() ?? '',
    excludedTopics: document.getElementById(`${prefix}excluded-topics`)?.value.trim() ?? '',

    // Yêu cầu thêm + features
    notes: buildFeatureNotes(prefix),
  };
}

/** Wire cognitive preset buttons for a given prefix */
export function wireCognitivePresets(prefix) {
  const cogIds = [
    `${prefix}cog-recognize`,
    `${prefix}cog-understand`,
    `${prefix}cog-apply`,
    `${prefix}cog-advanced`,
  ];
  const hintEl = document.getElementById(`${prefix}cog-sum-hint`);

  // Preset buttons
  document.getElementById(`${prefix}preset-basic`)?.addEventListener('click', () => applyPreset('25,35,30,10'));
  document.getElementById(`${prefix}preset-medium`)?.addEventListener('click', () => applyPreset('20,30,35,15'));
  document.getElementById(`${prefix}preset-hard`)?.addEventListener('click', () => applyPreset('15,25,35,25'));
  document.getElementById(`${prefix}preset-clear`)?.addEventListener('click', () => {
    cogIds.forEach((id) => { const el = document.getElementById(id); if (el) el.value = ''; });
    if (hintEl) hintEl.hidden = true;
  });

  // Live sum validation
  cogIds.forEach((id) => {
    document.getElementById(id)?.addEventListener('input', updateSum);
  });

  function applyPreset(csv) {
    const vals = csv.split(',');
    cogIds.forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.value = vals[i] ?? '';
    });
    updateSum();
  }

  function updateSum() {
    if (!hintEl) return;
    const total = cogIds.reduce((sum, id) => {
      const v = Number(document.getElementById(id)?.value || 0);
      return sum + (Number.isFinite(v) ? v : 0);
    }, 0);
    const allEmpty = cogIds.every((id) => !(document.getElementById(id)?.value.trim()));
    if (allEmpty) { hintEl.hidden = true; return; }
    hintEl.hidden = false;
    if (total === 100) {
      hintEl.textContent = `✓ Tổng: ${total}% — hợp lệ`;
      hintEl.style.color = '#16a34a';
    } else {
      hintEl.textContent = `Tổng hiện tại: ${total}% (cần = 100%)`;
      hintEl.style.color = total > 100 ? '#dc2626' : '#d97706';
    }
  }
}

export { labelWithRequired };

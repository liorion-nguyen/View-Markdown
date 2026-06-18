export const SUBJECT_OPTIONS = [
  'Toán',
  'Ngữ văn',
  'Tiếng Anh',
  'Vật lí',
  'Hóa học',
  'Sinh học',
  'Lịch sử',
  'Địa lí',
  'GDCD',
  'Tin học',
  'Công nghệ',
];

export const GRADE_OPTIONS = ['6', '7', '8', '9', '10', '11', '12'];

export const EXAM_TYPE_OPTIONS = [
  { value: '', label: 'Không chỉ định' },
  { value: 'Kiểm tra miệng', label: 'Kiểm tra miệng' },
  { value: 'Kiểm tra 15 phút', label: 'Kiểm tra 15 phút' },
  { value: 'Kiểm tra 45 phút', label: 'Kiểm tra 45 phút' },
  { value: 'Kiểm tra giữa kỳ', label: 'Kiểm tra giữa kỳ' },
  { value: 'Kiểm tra cuối kỳ', label: 'Kiểm tra cuối kỳ' },
];

const CHECK_ICON =
  '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="2,6 5,9 10,3"/></svg>';

const GROUP_ICONS = {
  'Đáp án & chấm điểm':
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
  'Phạm vi kiến thức':
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
  'Định dạng câu hỏi':
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
};

/** Checkbox — mỗi mục có mô tả rõ cho người dùng. */
export const EXAM_FEATURE_GROUPS = [
  {
    title: 'Đáp án & chấm điểm',
    features: [
      {
        id: 'feat-answer-table',
        label: 'Bảng đáp án trắc nghiệm',
        prompt: 'Cuối đề có mục # Đáp án với bảng đáp án trắc nghiệm đầy đủ',
      },
      {
        id: 'feat-essay-solutions',
        label: 'Lời giải tự luận chi tiết',
        prompt: 'Kèm lời giải chi tiết từng bước cho phần tự luận trong mục # Đáp án',
      },
    ],
  },
  {
    title: 'Phạm vi kiến thức',
    features: [
      {
        id: 'feat-semester-1',
        label: 'Học kỳ I',
        prompt: 'Phạm vi kiến thức: học kỳ I',
      },
      {
        id: 'feat-semester-2',
        label: 'Học kỳ II',
        prompt: 'Phạm vi kiến thức: học kỳ II',
      },
    ],
  },
  {
    title: 'Định dạng câu hỏi',
    features: [
      {
        id: 'feat-mc-4-options',
        label: 'Trắc nghiệm 4 phương án (A–D)',
        prompt: 'Mỗi câu trắc nghiệm có đúng 4 phương án A. B. C. D.',
      },
      {
        id: 'feat-separate-parts',
        label: 'Tách rõ Phần I / Phần II',
        prompt: 'Tách rõ ## Phần I. Trắc nghiệm và ## Phần II. Tự luận (nếu có cả hai phần)',
        defaultChecked: true,
      },
    ],
  },
];

export function getSelectedFeaturePrompts() {
  const prompts = [];

  for (const group of EXAM_FEATURE_GROUPS) {
    for (const feature of group.features) {
      const el = document.getElementById(feature.id);
      if (el?.checked) prompts.push(feature.prompt);
    }
  }

  return prompts;
}

export function renderExamFeatureGroups() {
  return EXAM_FEATURE_GROUPS.map(
    (group) => `
    <fieldset class="exam-form__fieldset">
      <legend class="exam-form__legend">
        <span class="exam-form__legend-icon">${GROUP_ICONS[group.title] ?? ''}</span>
        ${group.title}
      </legend>
      <div class="exam-form__checks">
        ${group.features
          .map(
            (f) => `
          <label class="exam-check">
            <input type="checkbox" id="${f.id}" data-exam-feature="${f.prompt.replace(/"/g, '&quot;')}"${f.defaultChecked ? ' checked' : ''} />
            <span class="exam-check__indicator">${CHECK_ICON}</span>
            <span class="exam-check__body">
              <span class="exam-check__label">${f.label}</span>
            </span>
          </label>`,
          )
          .join('')}
      </div>
    </fieldset>`,
  ).join('');
}

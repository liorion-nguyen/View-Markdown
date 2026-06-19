import { renderCustomSelect } from './components/custom-select.js';
import { labelWithRequired } from './form-validation.js';

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

export function getSelectedFeaturePrompts(idPrefix = '') {
  const prompts = [];

  for (const group of EXAM_FEATURE_GROUPS) {
    for (const feature of group.features) {
      const el = document.getElementById(`${idPrefix}${feature.id}`);
      if (el?.checked) prompts.push(feature.prompt);
    }
  }

  return prompts;
}

export function renderExamFeatureGroups(idPrefix = '') {
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
            <input type="checkbox" id="${idPrefix}${f.id}" data-exam-feature="${f.prompt.replace(/"/g, '&quot;')}"${f.defaultChecked ? ' checked' : ''} />
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

/**
 * @param {{
 *   prefix: string;
 *   formId: string;
 *   actionsHtml?: string;
 *   errorHtml?: string;
 * }} config
 */
export function renderExamForm({ prefix, formId, actionsHtml = '', errorHtml = '' }) {
  return `
        <form class="exam-form" id="${formId}" onsubmit="return false">
          <section class="exam-form__section">
            <h3 class="exam-form__section-title">Thông tin cơ bản</h3>
            <div class="exam-form__row exam-form__row--2">
              ${renderCustomSelect({
                id: `${prefix}subject`,
                label: 'Môn học',
                options: SUBJECT_OPTIONS,
                selected: 'Toán',
                customPlaceholder: 'Nhập tên môn học...',
                required: true,
              })}
              ${renderCustomSelect({
                id: `${prefix}grade`,
                label: 'Khối lớp',
                options: GRADE_OPTIONS,
                selected: '8',
                customPlaceholder: 'VD: 8A, 9/1...',
                required: true,
              })}
            </div>
          </section>

          <section class="exam-form__section">
            <h3 class="exam-form__section-title">Cấu trúc đề</h3>
            <div class="exam-field-group" id="${prefix}questions-group">
              <div class="exam-form__row exam-form__row--2">
                <label class="exam-field">
                  <span class="exam-field__label">${labelWithRequired('Số câu trắc nghiệm', true)}</span>
                  <input type="number" id="${prefix}mc-count" value="0" min="0" max="50" placeholder="0 = không có TN" />
                </label>
                <label class="exam-field">
                  <span class="exam-field__label">${labelWithRequired('Số bài tự luận', true)}</span>
                  <input type="number" id="${prefix}essay-count" value="0" min="0" max="20" placeholder="0 = không có TL" />
                </label>
              </div>
              <p class="exam-field__error" data-field-error role="alert" hidden></p>
            </div>
            ${renderCustomSelect({
              id: `${prefix}exam-type`,
              label: 'Loại bài kiểm tra',
              options: EXAM_TYPE_OPTIONS,
              selected: '',
              customPlaceholder: 'VD: Kiểm tra 1 tiết, ôn tập...',
            })}
          </section>

          <section class="exam-form__section">
            <h3 class="exam-form__section-title">Nội dung & độ khó</h3>
            <label class="exam-field">
              <span class="exam-field__label">Chủ đề</span>
              <textarea id="${prefix}topic" rows="2" placeholder="VD: phương trình bậc nhất, phản ứng oxi hóa khử..."></textarea>
            </label>
            <label class="exam-field">
              <span class="exam-field__label">Độ khó</span>
              <select id="${prefix}difficulty">
                <option value="Cơ bản" selected>Cơ bản</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Nâng cao">Nâng cao</option>
              </select>
            </label>
            <label class="exam-field">
              <span class="exam-field__label">Thời gian làm bài </span>
              <input type="text" id="${prefix}time" value="" placeholder="VD: 45 phút" />
            </label>
          </section>

          <section class="exam-form__section exam-form__section--features">
            <div class="exam-form__section-head">
              <h3 class="exam-form__section-title">Tuỳ chọn đề</h3>
            </div>
            <div class="exam-form__features">
              ${renderExamFeatureGroups(prefix)}
            </div>
          </section>

          <section class="exam-form__section">
            <h3 class="exam-form__section-title">Yêu cầu thêm</h3>
            <label class="exam-field">
              <textarea id="${prefix}notes" rows="2" placeholder="VD: tập trung dạng bài sát SGK, không dùng câu hỏi đảo..."></textarea>
            </label>
          </section>

          ${actionsHtml}
          ${errorHtml}
        </form>`;
}

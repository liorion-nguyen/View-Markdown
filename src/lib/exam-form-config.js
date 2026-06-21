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
  { value: 'Kiểm tra 45 phút', label: 'Kiểm tra 45 phút (1 tiết)' },
  { value: 'Kiểm tra giữa kỳ', label: 'Kiểm tra giữa kỳ' },
  { value: 'Kiểm tra cuối kỳ', label: 'Kiểm tra cuối kỳ' },
  { value: 'Ôn tập', label: 'Ôn tập' },
  { value: 'Luyện tập', label: 'Luyện tập / Tự luyện' },
];

export const SEMESTER_OPTIONS = [
  { value: '', label: 'Không chỉ định' },
  { value: 'Học kỳ I', label: 'Học kỳ I' },
  { value: 'Học kỳ II', label: 'Học kỳ II' },
  { value: 'Cả năm', label: 'Cả năm' },
];

const CHECK_ICON =
  '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="2,6 5,9 10,3"/></svg>';

const GROUP_ICONS = {
  'Đáp án & chấm điểm':
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
  'Định dạng câu hỏi':
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  'Trình bày đề':
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h6"/></svg>',
};

/** Checkbox groups — mỗi mục có mô tả rõ cho người dùng. */
export const EXAM_FEATURE_GROUPS = [
  {
    title: 'Đáp án & chấm điểm',
    features: [
      {
        id: 'feat-answer-table',
        label: 'Bảng đáp án trắc nghiệm',
        hint: 'Bảng đáp án A/B/C/D cuối đề',
        prompt: 'Cuối đề có mục # Đáp án với bảng đáp án trắc nghiệm đầy đủ',
      },
      {
        id: 'feat-essay-solutions',
        label: 'Lời giải tự luận chi tiết',
        hint: 'Trình bày từng bước cho phần tự luận',
        prompt: 'Kèm lời giải chi tiết từng bước cho phần tự luận trong mục # Đáp án',
      },
      {
        id: 'feat-score-per-question',
        label: 'Ghi điểm từng câu / bài',
        hint: 'Ví dụ: (0,25 điểm) bên cạnh mỗi câu TN',
        prompt: 'Ghi rõ số điểm bên cạnh mỗi câu trắc nghiệm và mỗi bài tự luận trên đề',
      },
    ],
  },
  {
    title: 'Định dạng câu hỏi',
    features: [
      {
        id: 'feat-mc-4-options',
        label: 'Trắc nghiệm 4 phương án (A–D)',
        hint: 'Mỗi câu có đúng 4 lựa chọn',
        prompt: 'Mỗi câu trắc nghiệm có đúng 4 phương án A. B. C. D.',
      },
      {
        id: 'feat-separate-parts',
        label: 'Tách rõ Phần I / Phần II',
        hint: 'Chia đề thành phần Trắc nghiệm và Tự luận',
        prompt: 'Tách rõ ## Phần I. Trắc nghiệm và ## Phần II. Tự luận (nếu có cả hai phần)',
        defaultChecked: true,
      },
      {
        id: 'feat-sub-questions',
        label: 'Bài tự luận có ý phụ a), b), c)...',
        hint: 'Mỗi bài chia thành các ý nhỏ',
        prompt: 'Mỗi bài tự luận phải có ít nhất 2 ý phụ a), b), c)... rõ ràng, mỗi ý trên một dòng',
      },
    ],
  },
  {
    title: 'Trình bày đề',
    features: [
      {
        id: 'feat-student-info-line',
        label: 'Dòng kẻ thông tin học sinh',
        hint: '"Họ tên: ____________ Lớp: ______"',
        prompt: 'Ngay sau tiêu đề đề, thêm hai dòng kẻ: "Họ và tên: ................................ Lớp: ..........." và "Số báo danh: .................. Phòng thi: ..........."',
      },
      {
        id: 'feat-exam-note',
        label: 'Lưu ý thí sinh làm bài',
        hint: 'Ghi chú quy định ở đầu đề',
        prompt: 'Thêm mục "Lưu ý: Học sinh làm bài trực tiếp vào đề. Không được sử dụng tài liệu." ngay sau phần thông tin HS',
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
              ${f.hint ? `<span class="exam-check__hint">${f.hint}</span>` : ''}
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

          <!-- ── SECTION 1: Thông tin đề ─────────────────────────── -->
          <section class="exam-form__section">
            <h3 class="exam-form__section-title">Thông tin đề</h3>

            <label class="exam-field">
              <span class="exam-field__label">Tên trường <span class="exam-field__optional">(không bắt buộc)</span></span>
              <input type="text" id="${prefix}school-name" placeholder="VD: THPT Nguyễn Huệ, THCS Quang Trung..." />
            </label>

            <div class="exam-form__row exam-form__row--3">
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
              <label class="exam-field">
                <span class="exam-field__label">Năm học <span class="exam-field__optional">(tuỳ chọn)</span></span>
                <input type="text" id="${prefix}school-year" placeholder="VD: 2024 – 2025" />
              </label>
            </div>

            <div class="exam-form__row exam-form__row--2">
              ${renderCustomSelect({
                id: `${prefix}exam-type`,
                label: 'Loại bài kiểm tra',
                options: EXAM_TYPE_OPTIONS,
                selected: '',
                customPlaceholder: 'VD: Kiểm tra 1 tiết, ôn tập...',
              })}
              ${renderCustomSelect({
                id: `${prefix}semester`,
                label: 'Học kỳ',
                options: SEMESTER_OPTIONS,
                selected: '',
              })}
            </div>

            <div class="exam-form__row exam-form__row--2">
              <label class="exam-field">
                <span class="exam-field__label">Thời gian làm bài</span>
                <input type="text" id="${prefix}time" value="" placeholder="VD: 45 phút, 90 phút" />
              </label>
              <label class="exam-field">
                <span class="exam-field__label">Mã đề <span class="exam-field__optional">(tuỳ chọn)</span></span>
                <input type="text" id="${prefix}exam-code" placeholder="VD: 001, Đề A, Mã 132..." />
              </label>
            </div>
          </section>

          <!-- ── SECTION 2: Cấu trúc đề ───────────────────────────── -->
          <section class="exam-form__section">
            <h3 class="exam-form__section-title">Cấu trúc đề</h3>

            <div class="exam-field-group" id="${prefix}questions-group">
              <p class="exam-field__group-label">Trắc nghiệm</p>
              <div class="exam-form__row exam-form__row--2">
                <label class="exam-field">
                  <span class="exam-field__label">${labelWithRequired('Số câu', true)}</span>
                  <input type="number" id="${prefix}mc-count" value="0" min="0" max="50" placeholder="0 = không có TN" />
                </label>
                <label class="exam-field">
                  <span class="exam-field__label">Điểm / câu <span class="exam-field__optional">(tuỳ chọn)</span></span>
                  <input type="text" id="${prefix}mc-score" placeholder="VD: 0,25 điểm" />
                </label>
              </div>
              <p class="exam-field__error" data-field-error role="alert" hidden></p>
            </div>

            <div class="exam-field-group">
              <p class="exam-field__group-label">Tự luận</p>
              <div class="exam-form__row exam-form__row--2">
                <label class="exam-field">
                  <span class="exam-field__label">${labelWithRequired('Số bài', true)}</span>
                  <input type="number" id="${prefix}essay-count" value="0" min="0" max="20" placeholder="0 = không có TL" />
                </label>
                <label class="exam-field">
                  <span class="exam-field__label">Phân bố điểm <span class="exam-field__optional">(tuỳ chọn)</span></span>
                  <input type="text" id="${prefix}essay-score-dist" placeholder="VD: Bài 1: 2đ, Bài 2: 3đ, Bài 3: 2đ" />
                </label>
              </div>
            </div>

            <label class="exam-field">
              <span class="exam-field__label">Độ khó tổng thể</span>
              <select id="${prefix}difficulty">
                <option value="Cơ bản" selected>Cơ bản</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Nâng cao">Nâng cao</option>
              </select>
            </label>
          </section>

          <!-- ── SECTION 3: Ma trận nhận thức ─────────────────────── -->
          <section class="exam-form__section">
            <div class="exam-form__section-head">
              <h3 class="exam-form__section-title">Ma trận nhận thức <span class="exam-field__optional" style="font-weight:400">(tuỳ chọn)</span></h3>
              <p class="exam-form__section-desc">Phân phối câu hỏi theo mức độ tư duy. Tổng = 100% (để trống = AI tự phân bổ).</p>
            </div>

            <div class="exam-form__cognitive-presets">
              <span class="exam-form__cognitive-label">Preset nhanh:</span>
              <button type="button" class="exam-cognitive-preset" data-preset="25,35,30,10" id="${prefix}preset-basic">Cơ bản</button>
              <button type="button" class="exam-cognitive-preset" data-preset="20,30,35,15" id="${prefix}preset-medium">Trung bình</button>
              <button type="button" class="exam-cognitive-preset" data-preset="15,25,35,25" id="${prefix}preset-hard">Nâng cao</button>
              <button type="button" class="exam-cognitive-preset exam-cognitive-preset--clear" id="${prefix}preset-clear">Xoá</button>
            </div>

            <div class="exam-form__row exam-form__row--4">
              <label class="exam-field">
                <span class="exam-field__label">Nhận biết</span>
                <div class="exam-field__percent-wrap">
                  <input type="number" id="${prefix}cog-recognize" min="0" max="100" placeholder="25" class="exam-field__percent-input" />
                  <span class="exam-field__percent-sign">%</span>
                </div>
              </label>
              <label class="exam-field">
                <span class="exam-field__label">Thông hiểu</span>
                <div class="exam-field__percent-wrap">
                  <input type="number" id="${prefix}cog-understand" min="0" max="100" placeholder="35" class="exam-field__percent-input" />
                  <span class="exam-field__percent-sign">%</span>
                </div>
              </label>
              <label class="exam-field">
                <span class="exam-field__label">Vận dụng</span>
                <div class="exam-field__percent-wrap">
                  <input type="number" id="${prefix}cog-apply" min="0" max="100" placeholder="30" class="exam-field__percent-input" />
                  <span class="exam-field__percent-sign">%</span>
                </div>
              </label>
              <label class="exam-field">
                <span class="exam-field__label">Vận dụng cao</span>
                <div class="exam-field__percent-wrap">
                  <input type="number" id="${prefix}cog-advanced" min="0" max="100" placeholder="10" class="exam-field__percent-input" />
                  <span class="exam-field__percent-sign">%</span>
                </div>
              </label>
            </div>
            <p class="exam-field__hint" id="${prefix}cog-sum-hint" hidden></p>
          </section>

          <!-- ── SECTION 4: Nội dung kiến thức ───────────────────── -->
          <section class="exam-form__section">
            <h3 class="exam-form__section-title">Nội dung kiến thức</h3>

            <label class="exam-field">
              <span class="exam-field__label">Chương / Chủ đề <span class="exam-field__optional">(tuỳ chọn)</span></span>
              <textarea id="${prefix}topic" rows="2" placeholder="VD: Chương 2 – Hàm số bậc nhất và bậc hai; Chương 5 – Đạo hàm..."></textarea>
            </label>

            <label class="exam-field">
              <span class="exam-field__label">Bài học cụ thể <span class="exam-field__optional">(tuỳ chọn)</span></span>
              <textarea id="${prefix}specific-lessons" rows="2" placeholder="VD: Bài 1: PT bậc nhất; Bài 2: PT bậc hai; Bài 3: Hệ PT — KHÔNG ra Bài 4, Bài 5"></textarea>
              <span class="exam-field__hint">Liệt kê bài học được ra trong đề. Giúp AI soạn đúng phạm vi chương trình.</span>
            </label>

            <label class="exam-field">
              <span class="exam-field__label">Nội dung KHÔNG ra <span class="exam-field__optional">(tuỳ chọn)</span></span>
              <textarea id="${prefix}excluded-topics" rows="2" placeholder="VD: Không ra tích phân, không ra xác suất, không ra bài toán hình học không gian..."></textarea>
              <span class="exam-field__hint">Loại trừ nội dung, tránh AI soạn sai phạm vi yêu cầu.</span>
            </label>
          </section>

          <!-- ── SECTION 5: Tuỳ chọn đề ──────────────────────────── -->
          <section class="exam-form__section exam-form__section--features">
            <div class="exam-form__section-head">
              <h3 class="exam-form__section-title">Tuỳ chọn đề</h3>
            </div>
            <div class="exam-form__features">
              ${renderExamFeatureGroups(prefix)}
            </div>
          </section>

          <!-- ── SECTION 6: Yêu cầu thêm ─────────────────────────── -->
          <section class="exam-form__section">
            <h3 class="exam-form__section-title">Yêu cầu thêm</h3>
            <label class="exam-field">
              <textarea id="${prefix}notes" rows="2" placeholder="VD: Ưu tiên dạng bài tính toán sát SGK; Ngữ văn: tập trung văn bản Vợ Nhặt; Tiếng Anh: chủ điểm environment..."></textarea>
            </label>
          </section>

          ${actionsHtml}
          ${errorHtml}
        </form>`;
}

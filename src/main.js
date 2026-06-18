import 'katex/dist/katex.min.css';
import './style.css';

import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';

import {
  convertChartBlocksToDocxMarkdown,
  renderMarkdownWithCharts,
} from './chart-blocks.js';
import {
  getCustomSelectValue,
  renderCustomSelect,
  wireCustomSelects,
} from './components/custom-select.js';
import {
  EXAM_TYPE_OPTIONS,
  GRADE_OPTIONS,
  SUBJECT_OPTIONS,
  getSelectedFeaturePrompts,
  renderExamFeatureGroups,
} from './exam-form-config.js';
import {
  clearFieldError,
  clearFormErrors,
  focusFirstInvalidField,
  labelWithRequired,
  setFieldError,
} from './form-validation.js';
import { HELP_TIPS } from './guide.js';

/** Bật lại khi sẵn sàng phát hành xuất DOCX */
const ENABLE_DOCX_EXPORT = true;

marked.use(
  markedKatex({
    throwOnError: false,
    output: 'html',
    nonStandard: true,
  }),
);

marked.setOptions({
  gfm: true,
  breaks: true,
});

const app = document.getElementById('app');

app.innerHTML = `
  <header class="site-header">
    <div class="site-header__inner">
      <a href="https://codelab.pro.vn" class="site-header__logo" target="_blank" rel="noopener">
        <img src="/logo-codelab.png" alt="CodeLab" height="40" />
      </a>

      <div class="site-header__actions">
        <button type="button" class="btn btn--ghost" id="btn-help" aria-haspopup="dialog">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 115.82 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span class="btn__label">Mẹo</span>
        </button>
        <button type="button" class="btn btn--outline" id="btn-pdf">
          <span class="btn__label btn__label--hide-sm">Xuất </span>PDF
        </button>
        ${
          ENABLE_DOCX_EXPORT
            ? `<button type="button" class="btn btn--primary" id="btn-docx">
          <span class="btn__label btn__label--hide-sm">Xuất </span>DOCX
        </button>`
            : ''
        }
      </div>
    </div>
  </header>

  <nav class="mobile-tabs" aria-label="Chuyển panel">
    <button type="button" class="mobile-tabs__btn is-active" data-tab="create" id="tab-create">Tạo đề</button>
    <button type="button" class="mobile-tabs__btn" data-tab="editor" id="tab-editor">Soạn thảo</button>
    <button type="button" class="mobile-tabs__btn" data-tab="preview" id="tab-preview">Xem trước</button>
  </nav>

  <main class="workspace">
    <aside class="panel panel--create is-active" data-panel="create">
      <div class="panel__label">Tạo đề mới</div>
      <div class="create-panel">
        <form class="exam-form" id="exam-form" onsubmit="return false">
          <section class="exam-form__section">
            <h3 class="exam-form__section-title">Thông tin cơ bản</h3>
            <div class="exam-form__row exam-form__row--2">
              ${renderCustomSelect({
                id: 'ef-subject',
                label: 'Môn học',
                options: SUBJECT_OPTIONS,
                selected: 'Toán',
                customPlaceholder: 'Nhập tên môn học...',
                required: true,
              })}
              ${renderCustomSelect({
                id: 'ef-grade',
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
            <div class="exam-field-group" id="ef-questions-group">
              <div class="exam-form__row exam-form__row--2">
                <label class="exam-field">
                  <span class="exam-field__label">${labelWithRequired('Số câu trắc nghiệm', true)}</span>
                  <input type="number" id="ef-mc-count" value="0" min="0" max="50" placeholder="0 = không có TN" />
                </label>
                <label class="exam-field">
                  <span class="exam-field__label">${labelWithRequired('Số bài tự luận', true)}</span>
                  <input type="number" id="ef-essay-count" value="0" min="0" max="20" placeholder="0 = không có TL" />
                </label>
              </div>
              <p class="exam-field__error" data-field-error role="alert" hidden></p>
            </div>
            ${renderCustomSelect({
              id: 'ef-exam-type',
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
              <textarea id="ef-topic" rows="2" placeholder="VD: phương trình bậc nhất, phản ứng oxi hóa khử..."></textarea>
            </label>
            <label class="exam-field">
              <span class="exam-field__label">Độ khó</span>
              <select id="ef-difficulty">
                <option value="Cơ bản" selected>Cơ bản</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Nâng cao">Nâng cao</option>
              </select>
            </label>
            <label class="exam-field">
              <span class="exam-field__label">Thời gian làm bài </span>
              <input type="text" id="ef-time" value="" placeholder="VD: 45 phút" />
            </label>
          </section>

          <section class="exam-form__section exam-form__section--features">
            <div class="exam-form__section-head">
              <h3 class="exam-form__section-title">Tuỳ chọn đề</h3>
            </div>
            <div class="exam-form__features">
              ${renderExamFeatureGroups()}
            </div>
          </section>

          <section class="exam-form__section">
            <h3 class="exam-form__section-title">Yêu cầu thêm</h3>
            <label class="exam-field">
              <textarea id="ef-notes" rows="2" placeholder="VD: tập trung dạng bài sát SGK, không dùng câu hỏi đảo..."></textarea>
            </label>
          </section>

          <div class="exam-form__actions">
            <button type="button" class="btn btn--primary btn--block" id="btn-generate">
              Tạo đề
            </button>
          </div>

          <div class="exam-form__error hidden" id="generate-error" role="alert">
            <p id="generate-error-text"></p>
            <button type="button" class="btn btn--outline btn--sm" id="btn-retry">Thử lại</button>
          </div>
        </form>
      </div>
    </aside>

    <section class="panel panel--editor" data-panel="editor">
      <div class="panel__label">Markdown</div>
      <textarea class="editor" id="editor" spellcheck="false" placeholder="Bấm Tạo đề để AI soạn nội dung..."></textarea>
      <div class="status" id="status">Sẵn sàng</div>
    </section>

    <section class="panel panel--preview" data-panel="preview">
      <div class="panel__label">Xem trước</div>
      <div class="preview-wrap">
        <article class="preview" id="preview"></article>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__grid">
        <div class="site-footer__brand">
          <a href="https://codelab.pro.vn" target="_blank" rel="noopener">
            <img src="/logo-codelab.png" alt="CodeLab" height="36" class="site-footer__logo" />
          </a>
          <p class="site-footer__tagline">
            Nền tảng <strong>học lập trình tương tác</strong>: xem slide, demo game và làm bài tập về nhà ngay trên trình duyệt.
          </p>
          <div class="site-footer__badges" aria-label="Hệ sinh thái CodeLab">
            <span class="badge-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 20h8"/></svg>
            </span>
            <span class="badge-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </span>
            <span class="badge-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></svg>
            </span>
          </div>
        </div>

        <div class="site-footer__col">
          <h4>Điều hướng</h4>
          <ul>
            <li><a href="https://codelab.pro.vn" target="_blank" rel="noopener">Trang chủ</a></li>
            <li><a href="https://codelab.pro.vn" target="_blank" rel="noopener">Khoá học</a></li>
            <li><a href="https://codelab.pro.vn" target="_blank" rel="noopener">Đăng nhập</a></li>
          </ul>
        </div>

        <div class="site-footer__col">
          <h4>Bộ môn</h4>
          <ul>
            <li><a href="https://codelab.pro.vn" target="_blank" rel="noopener">Scratch</a></li>
            <li><a href="https://codelab.pro.vn" target="_blank" rel="noopener">Python App</a></li>
            <li><a href="https://codelab.pro.vn" target="_blank" rel="noopener">Website</a></li>
            <li><a href="https://codelab.pro.vn" target="_blank" rel="noopener">Computer Science</a></li>
            <li><a href="https://codelab.pro.vn" target="_blank" rel="noopener">Framework</a></li>
            <li><a href="https://codelab.pro.vn" target="_blank" rel="noopener">Ôn thi</a></li>
          </ul>
        </div>

        <div class="site-footer__col site-footer__contact">
          <h4>Liên hệ</h4>
          <ul class="contact-list">
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="M4 8h16"/></svg>
              <a href="mailto:contact@codelab.pro.vn">contact@codelab.pro.vn</a>
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.08 2h3a2 2 0 0 1 2 1.72c.1.75.27 1.48.5 2.19a2 2 0 0 1-.45 2.11L8 9.1a16 16 0 0 0 6.9 6.9l1.08-1.13a2 2 0 0 1 2.11-.45c.71.23 1.44.4 2.19.5A2 2 0 0 1 22 16.92z"/></svg>
              <a href="tel:+84789108503">+84 78 910 8503</a>
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s6-4.35 6-10a6 6 0 0 0-12 0c0 5.65 6 10 6 10z"/><circle cx="12" cy="11" r="2.5"/></svg>
              <span>CS1: Trần Thủ Độ, khối 16, Trường Vinh, Nghệ An</span>
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s6-4.35 6-10a6 6 0 0 0-12 0c0 5.65 6 10 6 10z"/><circle cx="12" cy="11" r="2.5"/></svg>
              <span>CS2: Thôn Phú Thuận Hợp, Cổ Đạm, Hà Tĩnh</span>
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s6-4.35 6-10a6 6 0 0 0-12 0c0 5.65 6 10 6 10z"/><circle cx="12" cy="11" r="2.5"/></svg>
              <span>CS3: Khu Đô Thị Xuân An, Hà Tĩnh</span>
            </li>
          </ul>

          <div class="site-footer__social-label">MẠNG XÃ HỘI</div>
          <div class="site-footer__social">
            <a href="https://facebook.com/codelab.pro.vn" target="_blank" rel="noopener">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.2-1.6 1.7-1.6H16.8V4.8c-.5 0-1.5-.1-2.8-.1-2.8 0-4.7 1.7-4.7 4.8V11H7v3h2.3v8h4.2z"/></svg>
              <span>Facebook</span>
            </a>
            <a href="https://tiktok.com/@codelab.pro.vn" target="_blank" rel="noopener">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.5 4a6 6 0 0 0 1.7 3.6A6.6 6.6 0 0 0 22 9v3.2a9.8 9.8 0 0 1-4.7-1.1v6.3a6.5 6.5 0 1 1-6.5-6.5c.2 0 .5 0 .8.1v3.2a3.2 3.2 0 1 0 2.4 3.1V4h2.5z"/></svg>
              <span>TikTok</span>
            </a>
          </div>
        </div>
      </div>

      <div class="site-footer__bottom">
        <span>© 2026 CodeLab. All rights reserved.</span>
        <span>CodeLab Study</span>
      </div>
    </div>
  </footer>

  <div class="export-overlay hidden" id="overlay">
    <div class="export-overlay__box">
      <div class="export-overlay__spinner"></div>
      <p id="overlay-text">Đang xử lý...</p>
    </div>
  </div>

  <div class="help-overlay hidden" id="help-overlay" role="dialog" aria-modal="true" aria-labelledby="help-title">
    <div class="help-panel">
      <header class="help-panel__header">
        <h2 id="help-title">Mẹo sử dụng</h2>
        <button type="button" class="help-panel__close" id="btn-help-close" aria-label="Đóng">✕</button>
      </header>
      <ul class="help-tips">
        ${HELP_TIPS.map((t) => `<li>${t}</li>`).join('')}
      </ul>
    </div>
  </div>
`;

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const status = document.getElementById('status');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlay-text');
const generateError = document.getElementById('generate-error');
const generateErrorText = document.getElementById('generate-error-text');
const btnGenerate = document.getElementById('btn-generate');

let renderTimer = null;
let lastExamPayload = null;
let generateAbort = null;
let isGenerating = false;

function isMobileView() {
  return window.matchMedia('(max-width: 768px)').matches;
}

function getActiveMobileTab() {
  return document.querySelector('.mobile-tabs__btn.is-active')?.dataset.tab ?? 'create';
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('status--error', isError);
}

function renderPreview({ light = false } = {}) {
  const source = editor.value;

  if (!source.trim()) {
    preview.innerHTML = '';
    preview.classList.remove('preview--streaming');
    setStatus('Sẵn sàng');
    return;
  }

  try {
    preview.innerHTML = renderMarkdownWithCharts(source, { light });
    preview.classList.toggle('preview--streaming', light);
    setStatus(light ? `Đang tạo... · ${source.length} ký tự` : `Đã render · ${source.length} ký tự`);
  } catch {
    try {
      preview.innerHTML = renderMarkdownWithCharts(source, { light: true });
      preview.classList.add('preview--streaming');
      setStatus(light ? `Đang tạo... · ${source.length} ký tự` : 'Sẵn sàng');
    } catch {
      preview.innerHTML = '';
      setStatus('Đang tạo...', true);
    }
  }
}

function scheduleRender(options = {}) {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(() => {
    renderPreview(options);
  }, options.light ? 120 : 300);
}

function showOverlay(text) {
  overlayText.textContent = text;
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

function showGenerateError(message) {
  generateErrorText.textContent = message;
  generateError.classList.remove('hidden');
}

function hideGenerateError() {
  generateError.classList.add('hidden');
}

function parseQuestionCount(id) {
  const raw = document.getElementById(id).value.trim();
  if (raw === '') return 0;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function buildFeatureNotes() {
  const parts = getSelectedFeaturePrompts();

  const examType = getCustomSelectValue('ef-exam-type');
  if (examType) {
    parts.push(`Loại bài kiểm tra: ${examType}`);
  }

  const freeNotes = document.getElementById('ef-notes').value.trim();
  if (freeNotes) {
    parts.push(freeNotes);
  }

  return parts.join('\n- ');
}

function validateExamForm() {
  const form = document.getElementById('exam-form');
  clearFormErrors(form);
  hideGenerateError();

  const subject = getCustomSelectValue('ef-subject');
  const grade = getCustomSelectValue('ef-grade');
  const mcCount = parseQuestionCount('ef-mc-count');
  const essayCount = parseQuestionCount('ef-essay-count');

  let valid = true;

  if (!subject) {
    setFieldError('ef-subject', 'Vui lòng chọn hoặc nhập môn học.');
    valid = false;
  }

  if (!grade) {
    setFieldError('ef-grade', 'Vui lòng chọn hoặc nhập khối lớp.');
    valid = false;
  }

  if (mcCount === 0 && essayCount === 0) {
    setFieldError(
      'ef-questions-group',
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

function getExamFormData() {
  const validated = validateExamForm();
  if (!validated) return null;

  const featureNotes = buildFeatureNotes();

  return {
    subject: validated.subject,
    grade: validated.grade,
    topic: document.getElementById('ef-topic').value.trim(),
    mcCount: validated.mcCount,
    essayCount: validated.essayCount,
    difficulty: document.getElementById('ef-difficulty').value,
    time: document.getElementById('ef-time').value.trim(),
    notes: featureNotes,
  };
}

async function consumeSseStream(response, onEvent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      const lines = part.split('\n');
      let event = 'message';
      let data = '';

      for (const line of lines) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
      }

      if (!data) continue;
      onEvent(event, JSON.parse(data));
    }
  }
}

async function generateExam({ force = false } = {}) {
  const onMobile = isMobileView();
  const activeTab = getActiveMobileTab();

  if (onMobile && activeTab === 'editor' && !force) return;
  if (isGenerating && !force) return;

  const payload = getExamFormData();
  if (!payload) return;

  lastExamPayload = payload;
  hideGenerateError();

  if (generateAbort) generateAbort.abort();
  generateAbort = new AbortController();

  isGenerating = true;
  btnGenerate.disabled = true;
  editor.value = '';
  setStatus('AI đang tạo đề...');
  setMobileTab('editor');
  scheduleRender({ light: true });

  try {
    const response = await fetch('/api/exam/generate/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: generateAbort.signal,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.message || `Tạo đề thất bại (${response.status})`);
    }

    await consumeSseStream(response, (event, data) => {
      if (event === 'chunk' && data.text) {
        editor.value += data.text;
        editor.scrollTop = editor.scrollHeight;
        scheduleRender({ light: true });
        setStatus(`AI đang tạo đề... · ${editor.value.length} ký tự`);
      } else if (event === 'done' && data.markdown) {
        editor.value = data.markdown;
        renderPreview();
        setStatus('Đã tạo đề bằng AI');
      } else if (event === 'error') {
        throw new Error(data.message || 'Tạo đề thất bại');
      }
    });
  } catch (err) {
    if (err.name === 'AbortError') return;
    showGenerateError(err.message || 'Không thể tạo đề. Vui lòng thử lại.');
    setStatus(err.message || 'Lỗi tạo đề', true);
  } finally {
    isGenerating = false;
    btnGenerate.disabled = false;
    generateAbort = null;
  }
}

function getExportFilename(ext) {
  const lines = editor.value.split('\n');

  const titleLine =
    lines.find((line) => /^#\s+ĐỀ/i.test(line.trim())) ??
    lines.find(
      (line) =>
        /^#\s+/.test(line.trim()) && !/^#\s*CodeLab\s*$/i.test(line.trim()),
    ) ??
    lines.find((line) => line.trim());

  const rawTitle = titleLine?.replace(/^#+\s*/, '').trim() ?? 'tai-lieu';

  const slug = rawTitle
    .slice(0, 50)
    .replace(/[^\w\u00C0-\u024F\u1E00-\u1EFF\s-]/gi, '')
    .trim()
    .replace(/\s+/g, ' ');

  const date = new Date().toISOString().slice(0, 10);
  return `CodeLab - ${slug || 'tai-lieu'} - ${date}.${ext}`;
}

async function exportPdf() {
  if (!editor.value.trim()) {
    setStatus('Chưa có nội dung để xuất PDF', true);
    return;
  }

  renderPreview();
  showOverlay('Đang tạo file PDF...');

  try {
    const filename = getExportFilename('pdf');
    const opt = {
      margin: [12, 12, 12, 12],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollY: 0,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    await html2pdf().set(opt).from(preview).save();
    setStatus(`Đã xuất PDF: ${filename}`);
  } catch (err) {
    setStatus(`Lỗi xuất PDF: ${err.message}`, true);
  } finally {
    hideOverlay();
  }
}

async function exportDocx() {
  if (!editor.value.trim()) {
    setStatus('Chưa có nội dung để xuất DOCX', true);
    return;
  }

  showOverlay('Đang tạo file DOCX (Pandoc)...');

  try {
    const markdown = convertChartBlocksToDocxMarkdown(editor.value);
    const response = await fetch('/api/export/docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.message || `Xuất DOCX thất bại (${response.status})`);
    }

    const blob = await response.blob();
    const filename = getExportFilename('docx');
    saveAs(blob, filename);
    setStatus(`Đã xuất DOCX: ${filename}`);
  } catch (err) {
    setStatus(`Lỗi xuất DOCX: ${err.message}`, true);
  } finally {
    hideOverlay();
  }
}

editor.addEventListener('input', scheduleRender);

function setMobileTab(tab) {
  document.querySelectorAll('.mobile-tabs__btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.panel[data-panel]').forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.panel === tab);
  });
}

document.getElementById('tab-create').addEventListener('click', () => {
  setMobileTab('create');
});

document.getElementById('tab-editor').addEventListener('click', () => {
  setMobileTab('editor');
});

document.getElementById('tab-preview').addEventListener('click', () => {
  setMobileTab('preview');
});

document.getElementById('btn-pdf').addEventListener('click', exportPdf);
if (ENABLE_DOCX_EXPORT) {
  document.getElementById('btn-docx').addEventListener('click', exportDocx);
}

btnGenerate.addEventListener('click', () => generateExam());
document.getElementById('btn-retry').addEventListener('click', () => {
  if (lastExamPayload) generateExam({ force: true });
});

const helpOverlay = document.getElementById('help-overlay');

function openHelp() {
  helpOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeHelp() {
  helpOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

document.getElementById('btn-help').addEventListener('click', openHelp);
document.getElementById('btn-help-close').addEventListener('click', closeHelp);
helpOverlay.addEventListener('click', (e) => {
  if (e.target === helpOverlay) closeHelp();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !helpOverlay.classList.contains('hidden')) closeHelp();
});

wireCustomSelects(['ef-subject', 'ef-grade', 'ef-exam-type']);

document.getElementById('ef-subject').addEventListener('combovaluechange', () => {
  clearFieldError('ef-subject');
});
document.getElementById('ef-grade').addEventListener('combovaluechange', () => {
  clearFieldError('ef-grade');
});

for (const id of ['ef-mc-count', 'ef-essay-count']) {
  document.getElementById(id).addEventListener('input', () => {
    clearFieldError('ef-questions-group');
  });
}

renderPreview();

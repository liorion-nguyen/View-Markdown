import 'katex/dist/katex.min.css';
import './style.css';

import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';

import { buildPromptFromForm, GUIDE_SECTIONS } from './guide.js';
import { preprocessMarkdown } from './preprocess.js';

/** Bật lại khi sẵn sàng phát hành xuất DOCX */
const ENABLE_DOCX_EXPORT = true;

marked.use(
  markedKatex({
    throwOnError: false,
    output: 'html',
    nonStandard: true,
  })
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
        <button type="button" class="btn btn--ghost" id="btn-guide" aria-haspopup="dialog">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 115.82 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span class="btn__label">Hướng dẫn</span>
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
    <button type="button" class="mobile-tabs__btn is-active" data-tab="editor" id="tab-editor">Soạn thảo</button>
    <button type="button" class="mobile-tabs__btn" data-tab="preview" id="tab-preview">Xem trước</button>
  </nav>

  <main class="main">
    <section class="panel panel--editor is-active" data-panel="editor">
      <div class="panel__label">Markdown</div>
      <textarea class="editor" id="editor" spellcheck="false" placeholder="Nhập nội dung Markdown toán học...&#10;&#10;Ví dụ: $x^2 + 1 = 0$ hoặc&#10;$$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$"></textarea>
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
          <div class="site-footer__badges">
            <span class="badge-icon" title="Học online">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            </span>
            <span class="badge-icon" title="Hỗ trợ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            </span>
            <span class="badge-icon" title="Giáo dục">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>
              <a href="mailto:contact@codelab.pro.vn">contact@codelab.pro.vn</a>
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              <a href="tel:+84789108503">+84 78 910 8503</a>
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>CS1: Trần Thủ Độ, khối 16, Trường Vinh, Nghệ An</span>
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="visibility:hidden"><circle cx="12" cy="10" r="3"/></svg>
              <span>CS2: Thôn Phú Thuận Hợp, Cổ Đạm, Hà Tĩnh</span>
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="visibility:hidden"><circle cx="12" cy="10" r="3"/></svg>
              <span>CS3: Khu Đô Thị Xuân An, Hà Tĩnh</span>
            </li>
          </ul>
          <p class="site-footer__social-label">MẠNG XÃ HỘI</p>
          <div class="site-footer__social">
            <a href="https://facebook.com/codelab.pro.vn" target="_blank" rel="noopener">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
              Facebook
            </a>
            <a href="https://tiktok.com/@codelab.pro.vn" target="_blank" rel="noopener">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 0012.68 0V8.69a8.16 8.16 0 004.77 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>
              TikTok
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
      <p id="overlay-text">Đang xuất file...</p>
    </div>
  </div>

  <div class="guide-overlay hidden" id="guide-overlay" role="dialog" aria-modal="true" aria-labelledby="guide-title">
    <div class="guide-panel">
      <header class="guide-panel__header">
        <div>
          <h2 id="guide-title">Hướng dẫn tạo đề bằng AI</h2>
          <p class="guide-panel__desc">Dùng AI soạn đề → dán vào đây → xuất PDF/DOCX</p>
        </div>
        <button type="button" class="guide-panel__close" id="btn-guide-close" aria-label="Đóng">✕</button>
      </header>

      <div class="guide-panel__body">
        <section class="guide-section">
          <h3>${GUIDE_SECTIONS[0].title}</h3>
          <ol class="guide-steps">
            ${GUIDE_SECTIONS[0].steps.map((s) => `<li><strong>${s.label}:</strong> ${s.text}</li>`).join('')}
          </ol>
        </section>

        <section class="guide-section">
          <h3>Tạo prompt cho AI</h3>
          <p class="guide-hint">Điền thông tin đề bài — khi copy, phần định dạng kỹ thuật sẽ được tự động thêm vào.</p>

          <form class="guide-form" id="guide-form" onsubmit="return false">
            <div class="guide-form__row guide-form__row--2">
              <label class="guide-field">
                <span class="guide-field__label">Môn học</span>
                <input type="text" id="gf-subject" value="Toán" placeholder="VD: Toán, Văn, Anh..." />
              </label>
              <label class="guide-field">
                <span class="guide-field__label">Lớp</span>
                <input type="text" id="gf-grade" value="8" placeholder="VD: 8, 9..." />
              </label>
            </div>

            <div class="guide-form__row guide-form__row--2">
              <label class="guide-field">
                <span class="guide-field__label">Thời gian làm bài</span>
                <input type="text" id="gf-time" value="45 phút" placeholder="VD: 45 phút, 60 phút..." />
              </label>
              <label class="guide-field">
                <span class="guide-field__label">Tổng điểm</span>
                <input type="text" id="gf-total" value="10 điểm" placeholder="VD: 10 điểm" />
              </label>
            </div>

            <fieldset class="guide-fieldset">
              <legend>Phần trắc nghiệm</legend>
              <label class="guide-check">
                <input type="checkbox" id="gf-include-mc" checked />
                Có phần trắc nghiệm
              </label>
              <div class="guide-form__row guide-form__row--2">
                <label class="guide-field">
                  <span class="guide-field__label">Số câu</span>
                  <input type="number" id="gf-mc-count" value="8" min="0" />
                </label>
                <label class="guide-field">
                  <span class="guide-field__label">Số điểm</span>
                  <input type="text" id="gf-mc-points" value="4 điểm" placeholder="VD: 4 điểm" />
                </label>
              </div>
            </fieldset>

            <fieldset class="guide-fieldset">
              <legend>Phần tự luận</legend>
              <label class="guide-check">
                <input type="checkbox" id="gf-include-essay" checked />
                Có phần tự luận
              </label>
              <div class="guide-form__row guide-form__row--2">
                <label class="guide-field">
                  <span class="guide-field__label">Số bài</span>
                  <input type="number" id="gf-essay-count" value="3" min="0" />
                </label>
                <label class="guide-field">
                  <span class="guide-field__label">Số điểm</span>
                  <input type="text" id="gf-essay-points" value="6 điểm" placeholder="VD: 6 điểm" />
                </label>
              </div>
            </fieldset>

            <label class="guide-field">
              <span class="guide-field__label">Chủ đề / kiến thức cần kiểm tra</span>
              <textarea id="gf-topics" rows="3" placeholder="VD: phương trình bậc nhất, phân số, hình học tam giác vuông, định lý Pythagore..."></textarea>
            </label>

            <div class="guide-form__row guide-form__row--2">
              <label class="guide-field">
                <span class="guide-field__label">Độ khó</span>
                <input type="text" id="gf-difficulty" value="Cơ bản" placeholder="VD: Cơ bản, nâng cao..." />
              </label>
            </div>

            <label class="guide-field">
              <span class="guide-field__label">Yêu cầu thêm (tuỳ chọn)</span>
              <textarea id="gf-notes" rows="2" placeholder="VD: có đáp án chi tiết phần tự luận, phù hợp học kì I..."></textarea>
            </label>

            <div class="guide-form__actions">
              <button type="button" class="btn btn--primary" id="btn-copy-prompt">Copy prompt</button>
              <span class="guide-form__note">Định dạng công thức toán sẽ tự động đính kèm khi copy</span>
            </div>
          </form>
        </section>

        <section class="guide-section">
          <h3>${GUIDE_SECTIONS[1].title}</h3>
          <ul class="guide-tips">
            ${GUIDE_SECTIONS[1].tips.map((t) => `<li>${t}</li>`).join('')}
          </ul>
        </section>
      </div>
    </div>
  </div>
`;

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const status = document.getElementById('status');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlay-text');

let renderTimer = null;

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('status--error', isError);
}

function renderPreview() {
  const source = editor.value;

  try {
    const processed = preprocessMarkdown(source);
    preview.innerHTML = marked.parse(processed);
    setStatus(`Đã render · ${source.length} ký tự`);
  } catch (err) {
    preview.innerHTML = `<p style="color:#b91c1c">Lỗi render: ${err.message}</p>`;
    setStatus(`Lỗi: ${err.message}`, true);
  }
}

function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderPreview, 120);
}

function showOverlay(text) {
  overlayText.textContent = text;
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

function getExportFilename(ext) {
  const firstLine = editor.value
    .split('\n')
    .find((line) => line.trim() && !line.startsWith('#'))
    ?.replace(/^#+\s*/, '')
    .trim();

  const base = firstLine
    ? firstLine.slice(0, 40).replace(/[^\w\u00C0-\u024F\u1E00-\u1EFF\s-]/gi, '')
    : 'tai-lieu-toan';

  const date = new Date().toISOString().slice(0, 10);
  return `${base || 'tai-lieu-toan'}-${date}.${ext}`;
}

async function exportPdf() {
  if (!editor.value.trim()) {
    setStatus('Chưa có nội dung để xuất PDF', true);
    return;
  }

  showOverlay('Đang tạo file PDF...');

  try {
    const opt = {
      margin: [12, 12, 12, 12],
      filename: getExportFilename('pdf'),
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
    setStatus(`Đã xuất PDF: ${opt.filename}`);
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
    const markdown = preprocessMarkdown(editor.value);
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

document.getElementById('tab-editor').addEventListener('click', () => setMobileTab('editor'));
document.getElementById('tab-preview').addEventListener('click', () => setMobileTab('preview'));

document.getElementById('btn-pdf').addEventListener('click', exportPdf);
if (ENABLE_DOCX_EXPORT) {
  document.getElementById('btn-docx').addEventListener('click', exportDocx);
}

const guideOverlay = document.getElementById('guide-overlay');

function openGuide() {
  guideOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeGuide() {
  guideOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

document.getElementById('btn-guide').addEventListener('click', openGuide);
document.getElementById('btn-guide-close').addEventListener('click', closeGuide);

guideOverlay.addEventListener('click', (e) => {
  if (e.target === guideOverlay) closeGuide();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !guideOverlay.classList.contains('hidden')) closeGuide();
});

function getFormPromptData() {
  return {
    subject: document.getElementById('gf-subject').value.trim(),
    grade: document.getElementById('gf-grade').value.trim(),
    time: document.getElementById('gf-time').value.trim(),
    totalPoints: document.getElementById('gf-total').value.trim(),
    includeMc: document.getElementById('gf-include-mc').checked,
    mcCount: document.getElementById('gf-mc-count').value,
    mcPoints: document.getElementById('gf-mc-points').value.trim(),
    includeEssay: document.getElementById('gf-include-essay').checked,
    essayCount: document.getElementById('gf-essay-count').value,
    essayPoints: document.getElementById('gf-essay-points').value.trim(),
    topics: document.getElementById('gf-topics').value,
    difficulty: document.getElementById('gf-difficulty').value.trim(),
    notes: document.getElementById('gf-notes').value,
  };
}

document.getElementById('btn-copy-prompt').addEventListener('click', async () => {
  const btn = document.getElementById('btn-copy-prompt');
  const data = getFormPromptData();

  if (!data.topics?.trim()) {
    document.getElementById('gf-topics').focus();
    btn.textContent = 'Nhập chủ đề trước!';
    setTimeout(() => { btn.textContent = 'Copy prompt'; }, 2000);
    return;
  }

  const prompt = buildPromptFromForm(data);

  try {
    await navigator.clipboard.writeText(prompt);
    const prev = btn.textContent;
    btn.textContent = 'Đã copy!';
    setTimeout(() => { btn.textContent = prev; }, 2000);
  } catch {
    btn.textContent = 'Không copy được';
    setTimeout(() => { btn.textContent = 'Copy prompt'; }, 2000);
  }
});

renderPreview();

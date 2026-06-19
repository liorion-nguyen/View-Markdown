import { saveAs } from 'file-saver';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';

import { buildExamPrompt } from './buildExamPrompt.js';
import {
  convertChartBlocksToDocxMarkdown,
  renderMarkdownWithCharts,
} from './chart-blocks.js';
import { wireCustomSelects } from './components/custom-select.js';
import { renderExamForm } from './exam-form-config.js';
import { getExamFormData } from './exam-form-data.js';
import {
  clearFieldError,
  clearFormErrors,
} from './form-validation.js';
import { HELP_TIPS, renderGuidePage } from './guide.js';
import { screenFromPath } from './routes.js';
import { wireWorkspaceResizers } from './workspace-resize.js';

/** Bật lại khi sẵn sàng phát hành xuất DOCX */
const ENABLE_DOCX_EXPORT = true;

const GEMINI_KEY_STORAGE = 'codelab-gemini-api-key';
const AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE';
const GEMINI_USER_KEY_ERROR = 'GEMINI_USER_KEY_ERROR';

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

/**
 * Khởi tạo ứng dụng client (landing, guide, workspace).
 * @param {HTMLElement} app
 * @param {{ navigate?: (path: string) => void }} [options]
 */
export function initApp(app, { navigate, pathname: initialPathname } = {}) {
  if (app.dataset.appInitialized === 'true') {
    return { syncScreen: app._syncScreen };
  }
  app.dataset.appInitialized = 'true';

  app.innerHTML = `
  <header class="site-header">
    <div class="site-header__inner">
      <a href="/" class="site-header__logo" aria-label="Về trang giới thiệu">
        <img src="/logo-codelab.png" alt="CodeLab" height="40" />
      </a>

      <nav class="site-nav site-nav--desktop" aria-label="Điều hướng chính">
        <div class="site-nav__track">
          <a class="site-nav__item" href="/" data-nav-path="/">
            <svg class="site-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 10.5L12 4l8 6.5V19a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-8.5z"/></svg>
            <span>Giới thiệu</span>
          </a>
          <a class="site-nav__item" href="/guide" data-nav-path="/guide">
            <svg class="site-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 6.5V19M6 8.5h12M8 3.5h8a2 2 0 012 2v14a2 2 0 01-2 2H8a2 2 0 01-2-2v-14a2 2 0 012-2z"/></svg>
            <span>Hướng dẫn</span>
          </a>
          <a class="site-nav__item site-nav__item--accent" href="/workspace" data-nav-path="/workspace">
            <svg class="site-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3l1.7 4.8L18.5 9.5l-4.8 1.7L12 16l-1.7-4.8L5.5 9.5l4.8-1.7L12 3z"/></svg>
            <span>Tạo đề AI</span>
          </a>
          <a class="site-nav__item" href="/compose" data-nav-path="/compose">
            <svg class="site-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 4h8l2 2h4v14H4V4h4l2-2zm0 6h8M8 12h8M8 16h5"/></svg>
            <span>Tạo đề</span>
          </a>
        </div>
      </nav>

      <div class="site-header__tools">
        <button type="button" class="btn btn--ghost header-workspace-action" id="btn-help" aria-haspopup="dialog">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 115.82 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span class="btn__label">Mẹo</span>
        </button>
        <button type="button" class="btn btn--outline header-workspace-action" id="btn-pdf">
          <span class="btn__label btn__label--hide-sm">Xuất </span>PDF
        </button>
        ${
          ENABLE_DOCX_EXPORT
            ? `<button type="button" class="btn btn--primary header-workspace-action" id="btn-docx">
          <span class="btn__label btn__label--hide-sm">Xuất </span>DOCX
        </button>`
            : ''
        }
        <button type="button" class="site-header__menu-btn" id="btn-mobile-menu" aria-expanded="false" aria-controls="mobile-nav-drawer" aria-label="Mở menu">
          <span class="site-header__menu-icon" aria-hidden="true"></span>
        </button>
      </div>
    </div>
  </header>

  <div class="mobile-nav hidden" id="mobile-nav-drawer" aria-hidden="true">
    <button type="button" class="mobile-nav__backdrop" id="mobile-nav-backdrop" aria-label="Đóng menu" tabindex="-1"></button>
    <div class="mobile-nav__panel" role="dialog" aria-modal="true" aria-labelledby="mobile-nav-title">
      <header class="mobile-nav__head">
        <div class="mobile-nav__brand">
          <span class="mobile-nav__eyebrow">CodeLab Study</span>
          <h2 id="mobile-nav-title">Menu</h2>
        </div>
        <button type="button" class="mobile-nav__close" id="btn-mobile-menu-close" aria-label="Đóng menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </header>

      <nav class="mobile-nav__links" aria-label="Trang">
        <a class="mobile-nav__link" href="/" data-nav-path="/">
          <span class="mobile-nav__link-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10.5L12 4l8 6.5V19a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-8.5z"/></svg>
          </span>
          <span class="mobile-nav__link-text">
            <strong>Giới thiệu</strong>
            <small>Trang chủ & tính năng</small>
          </span>
        </a>
        <a class="mobile-nav__link" href="/guide" data-nav-path="/guide">
          <span class="mobile-nav__link-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6.5V19M6 8.5h12M8 3.5h8a2 2 0 012 2v14a2 2 0 01-2 2H8a2 2 0 01-2-2v-14a2 2 0 012-2z"/></svg>
          </span>
          <span class="mobile-nav__link-text">
            <strong>Hướng dẫn</strong>
            <small>Cách tạo đề & xuất file</small>
          </span>
        </a>
        <a class="mobile-nav__link mobile-nav__link--accent" href="/workspace" data-nav-path="/workspace">
          <span class="mobile-nav__link-icon mobile-nav__link-icon--ai" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.7 4.8L18.5 9.5l-4.8 1.7L12 16l-1.7-4.8L5.5 9.5l4.8-1.7L12 3z"/></svg>
          </span>
          <span class="mobile-nav__link-text">
            <strong>Tạo đề AI</strong>
            <small>AI soạn đề trực tiếp</small>
          </span>
        </a>
        <a class="mobile-nav__link" href="/compose" data-nav-path="/compose">
          <span class="mobile-nav__link-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 4h8l2 2h4v14H4V4h4l2-2zm0 6h8M8 12h8M8 16h5"/></svg>
          </span>
          <span class="mobile-nav__link-text">
            <strong>Tạo đề thủ công</strong>
            <small>Prompt → ChatGPT/Gemini</small>
          </span>
        </a>
      </nav>

      <div class="mobile-nav__section mobile-nav__section--tools header-workspace-action">
        <p class="mobile-nav__section-label">Công cụ</p>
        <button type="button" class="mobile-nav__tool" id="btn-mobile-help">
          <span>Mẹo sử dụng</span>
        </button>
        <button type="button" class="mobile-nav__tool" id="btn-mobile-pdf">Xuất PDF</button>
        ${
          ENABLE_DOCX_EXPORT
            ? `<button type="button" class="mobile-nav__tool mobile-nav__tool--primary" id="btn-mobile-docx">Xuất DOCX</button>`
            : ''
        }
      </div>
    </div>
  </div>

  <section class="landing-screen" id="landing-screen" data-screen="landing">
    <main class="landing-main">
      <section class="landing-hero" id="landing">
        <div class="landing-hero__copy">
          <span class="landing-hero__badge">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.7 4.8L18.5 9.5l-4.8 1.7L12 16l-1.7-4.8L5.5 9.5l4.8-1.7L12 3zM5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14zm14 0l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z"/></svg>
            AI tạo đề thi · CodeLab Study
          </span>
          <h1>Soạn đề kiểm tra nhanh hơn với <span>trợ lý AI</span></h1>
          <p>
            Dành cho giáo viên và học sinh THCS, THPT: chọn môn, khối lớp, cấu trúc đề —
            AI soạn nội dung, hiển thị công thức KaTeX và xuất PDF/DOCX chuẩn sư phạm.
          </p>
          <div class="landing-hero__actions">
            <a class="landing-btn landing-btn--ai" href="/workspace">
              Tạo đề ngay (Sử dụng AI)
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 5.5L20 12l-6.5 6.5-1.4-1.4 4.1-4.1H4v-2h12.2l-4.1-4.1 1.4-1.4z"/></svg>
            </a>
            <a class="landing-btn landing-btn--ghost" href="/compose">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8l2 2h4v14H4V4h4l2-2zm0 6h8M8 12h8M8 16h5"/></svg>
              Tạo đề (Thủ công)
            </a>
          </div>
        </div>

        <div class="landing-visual" aria-label="Minh họa giao diện tạo đề bằng AI">
          <div class="landing-visual__frame">
            <div class="landing-visual__pane landing-visual__pane--back">
              <span></span><span></span><span></span><span></span>
            </div>
            <div class="landing-visual__pane landing-visual__pane--editor">
              <div class="landing-visual__bar"></div>
              <div class="landing-visual__row is-purple"></div>
              <div class="landing-visual__row"></div>
              <div class="landing-visual__row is-wide"></div>
              <div class="landing-visual__row is-blue"></div>
              <div class="landing-visual__row is-short"></div>
            </div>
            <div class="landing-visual__paper">
              <strong>ĐỀ KIỂM TRA</strong>
              <span></span><span></span><span></span><span></span><span></span>
            </div>
            <div class="landing-visual__base"></div>
          </div>
        </div>
      </section>

      <section class="landing-section" id="landing-features" aria-labelledby="landing-features-title">
        <div class="landing-section__head">
          <h2 id="landing-features-title">Mọi thứ bạn cần để soạn đề</h2>
          <p>Từ lớp 6 đến lớp 12 — giáo viên ra đề kiểm tra, học sinh tự luyện đều dùng được trên trình duyệt.</p>
        </div>

        <div class="landing-bento">
          <article class="landing-feature landing-feature--input">
            <span class="landing-feature__icon">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v2H4V6zm0 5h10v2H4v-2zm0 5h16v2H4v-2z"/></svg>
            </span>
            <h3>Cấu hình đề theo lớp & môn</h3>
            <p>Chọn môn học, khối lớp, số câu trắc nghiệm/tự luận, chủ đề, độ khó và loại bài kiểm tra — không cần soạn từ đầu.</p>
          </article>

          <article class="landing-feature landing-feature--ai">
            <span class="landing-feature__pulse"></span>
            <span class="landing-feature__icon landing-feature__icon--gradient">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 00-4 12.7V17a2 2 0 002 2h4a2 2 0 002-2v-2.3A7 7 0 0012 2zm-2 19h4v-2h-4v2zm2-17a5 5 0 012.5 9.3l-.5.3V17h-4v-3.4l-.5-.3A5 5 0 0112 4z"/></svg>
            </span>
            <h3>AI soạn đề theo yêu cầu</h3>
            <p>Trợ lý AI sinh bản nháp theo chương trình, hỗ trợ bảng đáp án và lời giải — bạn chỉnh sửa trước khi in.</p>
            <div class="landing-chips">
              <span>Cơ bản</span><span>Trung bình</span><span>Nâng cao</span>
            </div>
          </article>

          <article class="landing-feature landing-feature--export">
            <span class="landing-feature__icon landing-feature__icon--dark">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16l4-5h-3V4h-2v7H8l4 5zm-8 2h16v2H4v-2z"/></svg>
            </span>
            <h3>Xuất PDF & Word</h3>
            <p>Tải file đề hoàn chỉnh để in ấn, giao bài hoặc lưu trữ — định dạng gọn, dễ đọc trên giấy A4.</p>
          </article>

          <article class="landing-feature landing-feature--preview">
            <div>
              <span class="landing-feature__icon landing-feature__icon--muted">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5c5 0 8.5 4.2 9.7 6.2a1.5 1.5 0 010 1.6C20.5 14.8 17 19 12 19s-8.5-4.2-9.7-6.2a1.5 1.5 0 010-1.6C3.5 9.2 7 5 12 5zm0 2c-3.8 0-6.7 3-7.8 5 1.1 2 4 5 7.8 5s6.7-3 7.8-5C18.7 10 15.8 7 12 7zm0 2.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5z"/></svg>
              </span>
              <h3>Xem trước công thức & biểu đồ</h3>
              <p>KaTeX hiển thị công thức toán ngay khi soạn. Hỗ trợ biểu đồ cho môn Địa lý — thấy kết quả trước khi xuất file.</p>
            </div>
            <div class="landing-preview-art" aria-hidden="true">
              <span></span><span></span><span></span><span></span>
            </div>
          </article>
        </div>
      </section>

      <section class="landing-section landing-section--workflow" id="landing-workflow" aria-labelledby="landing-workflow-title">
        <div class="landing-section__head">
          <h2 id="landing-workflow-title">3 bước — từ yêu cầu đến bộ đề</h2>
          <p>Quy trình gọn cho giáo viên soạn đề lớp và học sinh tự tạo đề luyện tập.</p>
        </div>
        <div class="landing-steps">
          <article>
            <strong>01</strong>
            <h3>Điền thông tin đề</h3>
            <p>Chọn môn, khối lớp, số câu TN/TL, chủ đề và tuỳ chọn (đáp án, lời giải, học kỳ…).</p>
          </article>
          <article class="is-active">
            <strong>02</strong>
            <h3>AI soạn bản nháp</h3>
            <p>Nhấn Tạo đề — AI sinh nội dung theo thời gian thực, bạn theo dõi ngay trên màn hình.</p>
          </article>
          <article>
            <strong>03</strong>
            <h3>Chỉnh & xuất file</h3>
            <p>Sửa Markdown nếu cần, xem trước rồi xuất PDF hoặc DOCX để in hoặc giao bài.</p>
          </article>
        </div>
      </section>

      <section class="landing-trust" aria-label="Đối tượng sử dụng">
        <div>
          <div class="landing-avatars" aria-hidden="true">
            <span>GV</span><span>HS</span><span>AI</span><span>12</span>
          </div>
          <h2>Dành cho giáo viên & học sinh</h2>
          <p>
            CodeLab Study là công cụ miễn phí trong hệ sinh thái CodeLab — giúp soạn đề nhanh hơn,
            học sinh chủ động luyện tập theo đúng khối lớp và môn học.
          </p>
        </div>
        <div class="landing-metrics">
          <article><strong>Đa môn</strong><span>Toán, Văn, Anh, Lý, Hóa…</span></article>
          <article><strong>Lớp 6–12</strong><span>THCS & THPT</span></article>
        </div>
      </section>

      <section class="landing-cta">
        <h2>Bắt đầu tạo đề đầu tiên của bạn</h2>
        <p>Không cần đăng ký, không cần cài đặt — mở trình duyệt và bắt đầu soạn đề với AI ngay hôm nay.</p>
        <a class="landing-btn landing-btn--ai" href="/workspace">Vào màn tạo đề</a>
      </section>
    </main>
  </section>

  <section class="guide-screen hidden" id="guide-screen" data-screen="guide">
    ${renderGuidePage()}
  </section>

  <section class="screen screen--workspace hidden" id="workspace-screen" data-screen="workspace" data-mobile-tab="create">
  <nav class="mobile-tabs" aria-label="Chuyển panel" data-workspace="ai">
    <button type="button" class="mobile-tabs__btn is-active" data-tab="create" id="tab-create">Tạo đề</button>
    <button type="button" class="mobile-tabs__btn" data-tab="editor" id="tab-editor">Soạn thảo</button>
    <button type="button" class="mobile-tabs__btn" data-tab="preview" id="tab-preview">Xem trước</button>
  </nav>

  <main class="workspace workspace-shell" id="workspace-layout">
    <aside class="panel panel--create panel--sidebar is-active" data-panel="create">
      <div class="panel__label panel__label--tech">
        <span class="panel__label-dot panel__label-dot--ai" aria-hidden="true"></span>
        Tạo đề bằng AI
      </div>
      <div class="sidebar-panel">
        <div class="sidebar-form-card">
        ${renderExamForm({
          prefix: 'ef-',
          formId: 'exam-form',
          actionsHtml: `
          <div class="exam-form__actions exam-form__actions--ai">
            <button type="button" class="btn btn--primary btn--block btn--ai" id="btn-generate">
              Tạo đề bằng AI
            </button>
            <button type="button" class="ai-key-link" id="btn-ai-settings">
              <span class="ai-key-link__dot" id="ai-key-dot" hidden aria-hidden="true"></span>
              Cấu hình API Gemini riêng
            </button>
          </div>`,
        })}
        </div>
      </div>
    </aside>

    <div class="workspace-resizer" data-resizer="left" role="separator" aria-orientation="vertical" aria-label="Kéo để đổi độ rộng form" tabindex="0"></div>

    <div class="workspace-main">
    <section class="panel panel--editor" data-panel="editor">
      <div class="panel__label panel__label--tech">
        <span class="panel__label-dot panel__label-dot--editor" aria-hidden="true"></span>
        Markdown
      </div>
      <textarea class="editor" id="editor" spellcheck="false" placeholder="Bấm Tạo đề bằng AI để hệ thống soạn nội dung..."></textarea>
      <div class="status" id="status">Sẵn sàng</div>
    </section>

    <div class="workspace-resizer" data-resizer="mid" role="separator" aria-orientation="vertical" aria-label="Kéo để đổi độ rộng soạn thảo và xem trước" tabindex="0"></div>

    <section class="panel panel--preview" data-panel="preview">
      <div class="panel__label panel__label--tech">
        <span class="panel__label-dot panel__label-dot--preview" aria-hidden="true"></span>
        Xem trước
      </div>
      <div class="preview-wrap">
        <article class="preview" id="preview"></article>
      </div>
    </section>
    </div>
  </main>
  </section>

  <section class="screen screen--workspace screen--compose hidden" id="compose-screen" data-screen="compose" data-mobile-tab="prompt">
  <nav class="mobile-tabs" aria-label="Chuyển panel" data-workspace="compose">
    <button type="button" class="mobile-tabs__btn is-active" data-tab="prompt" id="tab-compose-prompt">Prompt</button>
    <button type="button" class="mobile-tabs__btn" data-tab="editor" id="tab-compose-editor">Dán đề</button>
    <button type="button" class="mobile-tabs__btn" data-tab="preview" id="tab-compose-preview">Xem trước</button>
  </nav>

  <main class="workspace workspace-shell workspace--compose" id="compose-layout">
    <aside class="panel panel--create panel--prompt panel--sidebar is-active" data-panel="prompt">
      <div class="panel__label panel__label--tech">
        <span class="panel__label-dot panel__label-dot--compose" aria-hidden="true"></span>
        Thiết kế prompt
      </div>
      <div class="sidebar-panel compose-panel">
        <div class="compose-steps" aria-label="Quy trình tạo đề">
          <span class="compose-step"><strong>1</strong> Điền form</span>
          <span class="compose-step"><strong>2</strong> Copy prompt</span>
          <span class="compose-step"><strong>3</strong> Dán & xuất</span>
        </div>
        <div class="sidebar-form-card compose-form-card">
        ${renderExamForm({
          prefix: 'cf-',
          formId: 'compose-form',
          actionsHtml: `
          <div class="exam-form__actions exam-form__actions--compose">
            <button type="button" class="btn btn--primary btn--block btn--ai" id="btn-build-prompt">
              Tạo & sao chép prompt
            </button>
          </div>`,
        })}
        </div>
      </div>
    </aside>

    <div class="workspace-resizer" data-resizer="left" role="separator" aria-orientation="vertical" aria-label="Kéo để đổi độ rộng form" tabindex="0"></div>

    <div class="workspace-main">
    <section class="panel panel--editor" data-panel="editor">
      <div class="panel__label panel__label--tech">
        <span class="panel__label-dot panel__label-dot--editor" aria-hidden="true"></span>
        Dán Markdown
      </div>
      <textarea class="editor" id="compose-editor" spellcheck="false" placeholder="Dán nội dung đề Markdown từ ChatGPT/Gemini vào đây..."></textarea>
      <div class="status" id="compose-status">Sẵn sàng — dán nội dung để xem trước và xuất file</div>
    </section>

    <div class="workspace-resizer" data-resizer="mid" role="separator" aria-orientation="vertical" aria-label="Kéo để đổi độ rộng soạn thảo và xem trước" tabindex="0"></div>

    <section class="panel panel--preview" data-panel="preview">
      <div class="panel__label panel__label--tech">
        <span class="panel__label-dot panel__label-dot--preview" aria-hidden="true"></span>
        Xem trước
      </div>
      <div class="preview-wrap">
        <article class="preview" id="compose-preview"></article>
      </div>
    </section>
    </div>
  </main>
  </section>

  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__grid">
        <div class="site-footer__brand">
          <a href="https://codelab.pro.vn" target="_blank" rel="noopener">
            <img src="/logo-codelab.png" alt="CodeLab" height="36" class="site-footer__logo" />
          </a>
          <p class="site-footer__tagline">
            <strong>CodeLab Study</strong> — công cụ AI tạo đề thi miễn phí cho giáo viên và học sinh,
            tích hợp trong hệ sinh thái giáo dục CodeLab.
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
          <h4>CodeLab Study</h4>
          <ul>
            <li><a href="/">Giới thiệu</a></li>
            <li><a href="/guide">Hướng dẫn</a></li>
            <li><a href="/workspace">Tạo đề AI</a></li>
            <li><a href="/compose">Tạo đề</a></li>
          </ul>
        </div>

        <div class="site-footer__col">
          <h4>CodeLab</h4>
          <ul>
            <li><a href="https://codelab.pro.vn" target="_blank" rel="noopener">Trang chủ</a></li>
            <li><a href="https://codelab.pro.vn" target="_blank" rel="noopener">Khoá học</a></li>
            <li><a href="https://codelab.pro.vn" target="_blank" rel="noopener">Liên hệ</a></li>
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

  <div class="ai-alert-overlay hidden" id="ai-alert-overlay" role="dialog" aria-modal="true" aria-labelledby="ai-alert-title">
    <div class="ai-alert">
      <button type="button" class="ai-alert__close" id="btn-ai-alert-close" aria-label="Đóng">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>

      <div class="ai-alert__hero" aria-hidden="true">
        <div class="ai-alert__orb ai-alert__orb--1"></div>
        <div class="ai-alert__orb ai-alert__orb--2"></div>
        <div class="ai-alert__icon-wrap">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </div>
      </div>

      <div class="ai-alert__body">
        <p class="ai-alert__eyebrow">CodeLab AI Engine</p>
        <h2 class="ai-alert__title" id="ai-alert-title">Hệ thống AI đang quá tải</h2>
        <p class="ai-alert__desc">
          Nhiều giáo viên đang tạo đề cùng lúc trên hạ tầng Gemini dùng chung.
          Yêu cầu của bạn tạm thời chưa xử lý được — không phải lỗi từ phía bạn.
        </p>

        <div class="ai-alert__options">
          <article class="ai-alert__option">
            <div class="ai-alert__option-icon ai-alert__option-icon--manual" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <div class="ai-alert__option-text">
              <h3>Tạo đề thủ công</h3>
              <p>Sao chép prompt → dán vào ChatGPT/Gemini → xuất PDF/DOCX ngay trên CodeLab.</p>
            </div>
            <button type="button" class="btn btn--outline btn--sm" id="btn-ai-go-compose">Dùng chế độ thủ công</button>
          </article>

          <article class="ai-alert__option ai-alert__option--key">
            <div class="ai-alert__option-icon ai-alert__option-icon--key" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
            </div>
            <div class="ai-alert__option-text">
              <h3>Dùng API Gemini riêng</h3>
              <p>Miễn phí tại Google AI Studio — quota riêng, không chia sẻ với người khác.</p>
            </div>
            <label class="ai-alert__field">
              <span class="ai-alert__field-label">Gemini API Key</span>
              <div class="ai-alert__input-wrap">
                <input type="password" class="ai-alert__input" id="ai-modal-key" placeholder="AIza..." autocomplete="off" spellcheck="false" />
                <button type="button" class="ai-alert__input-toggle" id="btn-ai-key-toggle" aria-label="Hiện API key" aria-pressed="false">
                  <svg class="ai-alert__input-toggle-icon ai-alert__input-toggle-icon--show" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg class="ai-alert__input-toggle-icon ai-alert__input-toggle-icon--hide" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><path d="M1 1l22 22"/><path d="M14.12 14.12a3 3 0 01-4.24-4.24"/>
                  </svg>
                </button>
              </div>
            </label>
            <p class="ai-alert__saved-hint hidden" id="ai-alert-saved-hint">
              Key đã lưu trên trình duyệt — mỗi lần tạo đề sẽ ưu tiên dùng key của bạn.
            </p>
            <p class="ai-alert__user-error hidden" id="ai-alert-user-error" role="alert"></p>
            <div class="ai-alert__key-actions">
              <button type="button" class="btn btn--primary btn--sm" id="btn-ai-save-key">Lưu & thử lại</button>
              <a class="ai-alert__link" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Lấy API key miễn phí →</a>
            </div>
          </article>
        </div>

        <p class="ai-alert__note">
          API key lưu trên trình duyệt của bạn. Khi tạo đề thành công, key có thể được lưu ẩn danh trên máy chủ
          (chỉ dùng nội bộ, không chia sẻ công khai) để cải thiện dịch vụ khi hệ thống quá tải.
        </p>
      </div>
    </div>
  </div>

  <div class="toast-stack" id="toast-stack" aria-live="polite" aria-atomic="true"></div>
`;

  const editor = document.getElementById('editor');
  const preview = document.getElementById('preview');
  const status = document.getElementById('status');
  const composeEditor = document.getElementById('compose-editor');
  const composePreview = document.getElementById('compose-preview');
  const composeStatus = document.getElementById('compose-status');
  const btnBuildPrompt = document.getElementById('btn-build-prompt');
  const overlay = document.getElementById('overlay');
  const overlayText = document.getElementById('overlay-text');
  const btnGenerate = document.getElementById('btn-generate');
  const aiAlertOverlay = document.getElementById('ai-alert-overlay');
  const aiModalKeyInput = document.getElementById('ai-modal-key');
  const btnAiKeyToggle = document.getElementById('btn-ai-key-toggle');
  const aiKeyDot = document.getElementById('ai-key-dot');
  const aiAlertTitle = document.getElementById('ai-alert-title');
  const aiAlertDesc = document.querySelector('.ai-alert__desc');
  const aiAlertUserError = document.getElementById('ai-alert-user-error');
  const aiAlertSavedHint = document.getElementById('ai-alert-saved-hint');
  const screens = Array.from(document.querySelectorAll('[data-screen]'));

  let renderTimer = null;
  let composeRenderTimer = null;
  let lastExamPayload = null;
  let generateAbort = null;
  let isGenerating = false;

  function getEditorCtx() {
    if (getActiveScreen() === 'compose') {
      return {
        editor: composeEditor,
        preview: composePreview,
        setStatus(message, isError = false) {
          composeStatus.textContent = message;
          composeStatus.classList.toggle('status--error', isError);
        },
      };
    }
    return {
      editor,
      preview,
      setStatus(message, isError = false) {
        status.textContent = message;
        status.classList.toggle('status--error', isError);
      },
    };
  }

  function isMobileView() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  function getActiveMobileTab(screenRoot) {
    return (
      screenRoot?.querySelector('.mobile-tabs__btn.is-active')?.dataset.tab ?? 'create'
    );
  }

  function getActiveScreenRoot() {
    const active = getActiveScreen();
    if (active === 'compose') return document.getElementById('compose-screen');
    if (active === 'workspace') return document.getElementById('workspace-screen');
    return null;
  }

  function getActiveScreen() {
    return screenFromPath(window.location.pathname);
  }

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle('status--error', isError);
  }

  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
  const btnMobileMenu = document.getElementById('btn-mobile-menu');

  function openMobileNav() {
    mobileNavDrawer.classList.remove('hidden');
    requestAnimationFrame(() => {
      mobileNavDrawer.classList.add('is-open');
    });
    mobileNavDrawer.setAttribute('aria-hidden', 'false');
    btnMobileMenu.setAttribute('aria-expanded', 'true');
    document.body.classList.add('mobile-nav-open');
  }

  function closeMobileNav() {
    if (!mobileNavDrawer.classList.contains('is-open')) return;
    mobileNavDrawer.classList.remove('is-open');
    mobileNavDrawer.setAttribute('aria-hidden', 'true');
    btnMobileMenu.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('mobile-nav-open');
    window.setTimeout(() => {
      if (!mobileNavDrawer.classList.contains('is-open')) {
        mobileNavDrawer.classList.add('hidden');
      }
    }, 280);
  }

  function syncScreenState(pathname) {
    const active = screenFromPath(pathname ?? window.location.pathname);
    const currentPath = (pathname ?? window.location.pathname).replace(/\/$/, '') || '/';

    app.classList.toggle('app--landing', active === 'landing');
    app.classList.toggle('app--workspace', active === 'workspace');
    app.classList.toggle('app--compose', active === 'compose');
    app.classList.toggle('app--guide', active === 'guide');

    for (const screen of screens) {
      const isActive = screen.dataset.screen === active;
      screen.classList.toggle('hidden', !isActive);
      screen.classList.toggle('is-active', isActive);
    }

    app.querySelectorAll('[data-nav-path]').forEach((link) => {
      link.classList.toggle('is-active', link.dataset.navPath === currentPath);
    });

    closeMobileNav();
  }

  function renderPreviewFor(ctx, { light = false } = {}) {
    const source = ctx.editor.value;

    if (!source.trim()) {
      ctx.preview.innerHTML = '';
      ctx.preview.classList.remove('preview--streaming');
      ctx.setStatus(
        ctx.editor === composeEditor
          ? 'Sẵn sàng — dán nội dung để xem trước và xuất file'
          : 'Sẵn sàng',
      );
      return;
    }

    try {
      ctx.preview.innerHTML = renderMarkdownWithCharts(source, { light });
      ctx.preview.classList.toggle('preview--streaming', light);
      ctx.setStatus(
        light ? `Đang tạo... · ${source.length} ký tự` : `Đã render · ${source.length} ký tự`,
      );
    } catch {
      try {
        ctx.preview.innerHTML = renderMarkdownWithCharts(source, { light: true });
        ctx.preview.classList.add('preview--streaming');
        ctx.setStatus(light ? `Đang tạo... · ${source.length} ký tự` : 'Sẵn sàng');
      } catch {
        ctx.preview.innerHTML = '';
        ctx.setStatus('Đang xử lý...', true);
      }
    }
  }

  function renderPreview({ light = false } = {}) {
    renderPreviewFor(getEditorCtx(), { light });
  }

  function renderComposePreview({ light = false } = {}) {
    renderPreviewFor(
      { editor: composeEditor, preview: composePreview, setStatus: (m, e) => {
        composeStatus.textContent = m;
        composeStatus.classList.toggle('status--error', e);
      }},
      { light },
    );
  }

  function scheduleRender(options = {}) {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      renderPreview(options);
    }, options.light ? 120 : 300);
  }

  function scheduleComposeRender(options = {}) {
    clearTimeout(composeRenderTimer);
    composeRenderTimer = setTimeout(() => {
      renderComposePreview(options);
    }, options.light ? 120 : 300);
  }

  function showOverlay(text) {
    overlayText.textContent = text;
    overlay.classList.remove('hidden');
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  const TOAST_ICON_SUCCESS = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

  function escapeToastText(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function dismissToast(toast) {
    if (!toast || toast.classList.contains('toast--leave')) return;
    clearTimeout(toast._timer);
    toast.classList.remove('toast--visible');
    toast.classList.add('toast--leave');
    setTimeout(() => toast.remove(), 320);
  }

  function showToast({ type = 'success', title, message = '', duration = 5500, action = null } = {}) {
    const stack = document.getElementById('toast-stack');
    if (!stack || !title) return;

    stack.querySelectorAll('.toast').forEach((existing) => dismissToast(existing));

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <div class="toast__accent" aria-hidden="true"></div>
      <div class="toast__icon" aria-hidden="true">${TOAST_ICON_SUCCESS}</div>
      <div class="toast__body">
        <p class="toast__title">${escapeToastText(title)}</p>
        ${message ? `<p class="toast__message">${escapeToastText(message)}</p>` : ''}
        ${action ? `<button type="button" class="toast__action">${escapeToastText(action.label)}</button>` : ''}
      </div>
      <button type="button" class="toast__close" aria-label="Đóng">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      <div class="toast__progress" style="--toast-duration: ${duration}ms"></div>
    `;

    stack.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast--visible'));

    toast.querySelector('.toast__close')?.addEventListener('click', () => dismissToast(toast));
    toast.querySelector('.toast__action')?.addEventListener('click', () => {
      action?.onClick?.();
      dismissToast(toast);
    });

    toast._timer = setTimeout(() => dismissToast(toast), duration);
  }

  function getUserGeminiKey() {
    try {
      return localStorage.getItem(GEMINI_KEY_STORAGE)?.trim() || '';
    } catch {
      return '';
    }
  }

  function saveUserGeminiKey(key) {
    const trimmed = key.trim();
    try {
      if (trimmed) localStorage.setItem(GEMINI_KEY_STORAGE, trimmed);
      else localStorage.removeItem(GEMINI_KEY_STORAGE);
    } catch {
      /* ignore quota / private mode */
    }
    updateAiKeyIndicator();
  }

  function updateAiKeyIndicator() {
    const hasKey = Boolean(getUserGeminiKey());
    aiKeyDot.hidden = !hasKey;
  }

  function setAiAlertCopy({ reason = 'unavailable', message = '' } = {}) {
    const hasKey = Boolean(getUserGeminiKey());
    aiAlertUserError.classList.add('hidden');
    aiAlertUserError.textContent = '';
    aiAlertSavedHint.classList.add('hidden');

    if (reason === 'user-key-error') {
      aiAlertTitle.textContent = 'API key Gemini gặp sự cố';
      aiAlertDesc.textContent =
        'Key đã lưu không gọi được Gemini. Xem chi tiết bên dưới và cập nhật key nếu cần.';
      aiAlertUserError.textContent =
        message || 'Gemini từ chối yêu cầu với API key đã lưu.';
      aiAlertUserError.classList.remove('hidden');
      return;
    }

    if (reason === 'settings') {
      aiAlertTitle.textContent = 'API Gemini riêng';
      aiAlertDesc.textContent = hasKey
        ? 'Key của bạn được lưu trên trình duyệt và ưu tiên dùng mỗi lần tạo đề.'
        : 'Nhập API key miễn phí từ Google AI Studio — quota riêng, không phụ thuộc máy chủ CodeLab.';
      if (hasKey) aiAlertSavedHint.classList.remove('hidden');
      return;
    }

    aiAlertTitle.textContent = 'Hệ thống AI đang quá tải';
    aiAlertDesc.textContent =
      'Nhiều giáo viên đang tạo đề cùng lúc trên hạ tầng Gemini dùng chung. Yêu cầu của bạn tạm thời chưa xử lý được — không phải lỗi từ phía bạn.';
    if (hasKey) aiAlertSavedHint.classList.remove('hidden');
  }

  function setAiKeyVisible(visible) {
    aiModalKeyInput.type = visible ? 'text' : 'password';
    btnAiKeyToggle.setAttribute('aria-pressed', String(visible));
    btnAiKeyToggle.setAttribute('aria-label', visible ? 'Ẩn API key' : 'Hiện API key');
    btnAiKeyToggle.classList.toggle('is-visible', visible);
  }

  function openAiAlert({ reason = 'unavailable', message = '' } = {}) {
    aiModalKeyInput.value = getUserGeminiKey();
    setAiKeyVisible(false);
    aiAlertOverlay.dataset.reason = reason;
    setAiAlertCopy({ reason, message });
    aiAlertOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (reason === 'settings' || reason === 'user-key-error') {
      aiModalKeyInput.focus();
    }
  }

  function closeAiAlert() {
    aiAlertOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function isAiServiceError(data) {
    if (!data || typeof data !== 'object') return true;
    if (data.code === GEMINI_USER_KEY_ERROR) return false;
    if (!data.code) return true;
    if (data.code === AI_SERVICE_UNAVAILABLE) return true;
    return false;
  }

  function showAiUnavailableAlert() {
    openAiAlert({ reason: 'unavailable' });
  }

  function showGeminiUserKeyError(message) {
    openAiAlert({ reason: 'user-key-error', message });
  }

  function handleAiGenerateError(data) {
    if (data?.code === GEMINI_USER_KEY_ERROR) {
      showGeminiUserKeyError(data.message);
      setStatus(data.message || 'API key Gemini lỗi', true);
      return true;
    }
    if (isAiServiceError(data)) {
      showAiUnavailableAlert();
      setStatus('AI tạm thời không khả dụng', true);
      return true;
    }
    return false;
  }

  function buildGeneratePayload(formPayload) {
    const body = { ...formPayload };
    const userKey = getUserGeminiKey();
    if (userKey) body.geminiApiKey = userKey;
    return body;
  }

  function buildPrompt() {
    const data = getExamFormData('cf-', 'compose-form');
    if (!data) return null;
    return buildExamPrompt(data);
  }

  async function buildAndCopyPrompt() {
    const prompt = buildPrompt();
    if (!prompt) return;

    try {
      await navigator.clipboard.writeText(prompt);
      composeStatus.textContent = 'Đã sao chép prompt — dán vào ChatGPT hoặc Gemini.';
      composeStatus.classList.remove('status--error');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = prompt;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        composeStatus.textContent = 'Đã sao chép prompt — dán vào ChatGPT hoặc Gemini.';
        composeStatus.classList.remove('status--error');
      } catch {
        composeStatus.textContent = 'Không sao chép được — thử lại hoặc dùng trình duyệt khác.';
        composeStatus.classList.add('status--error');
      }
      document.body.removeChild(ta);
    }

    const originalLabel = 'Tạo & sao chép prompt';
    btnBuildPrompt.textContent = 'Đã sao chép!';
    setTimeout(() => {
      btnBuildPrompt.textContent = originalLabel;
    }, 2000);
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
    const screenRoot = document.getElementById('workspace-screen');
    const onMobile = isMobileView();
    const activeTab = getActiveMobileTab(screenRoot);

    if (onMobile && activeTab === 'editor' && !force) return;
    if (isGenerating && !force) return;

    clearFormErrors(document.getElementById('exam-form'));

    const payload = getExamFormData('ef-', 'exam-form');
    if (!payload) return;

    lastExamPayload = payload;

    if (generateAbort) generateAbort.abort();
    generateAbort = new AbortController();

    isGenerating = true;
    btnGenerate.disabled = true;
    editor.value = '';
    setStatus('AI đang tạo đề...');
    setMobileTab('editor', screenRoot);
    scheduleRender({ light: true });

    try {
      const response = await fetch('/api/exam/generate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildGeneratePayload(payload)),
        signal: generateAbort.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (handleAiGenerateError(data)) return;
        throw new Error(data?.message || AI_SERVICE_UNAVAILABLE);
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
          const charCount = data.markdown.length.toLocaleString('vi-VN');
          const workspaceScreen = document.getElementById('workspace-screen');
          showToast({
            type: 'success',
            title: 'Đã tạo đề xong!',
            message: `${charCount} ký tự · Xem trước hoặc xuất PDF/DOCX`,
            action: isMobileView()
              ? {
                  label: 'Xem trước',
                  onClick: () => setMobileTab('preview', workspaceScreen),
                }
              : null,
          });
        } else if (event === 'error') {
          if (handleAiGenerateError(data)) return;
          throw new Error(data.message || AI_SERVICE_UNAVAILABLE);
        }
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (getUserGeminiKey()) {
        showGeminiUserKeyError('Không kết nối được máy chủ. Kiểm tra mạng và thử lại.');
      } else {
        showAiUnavailableAlert();
      }
      setStatus('AI tạm thời không khả dụng', true);
    } finally {
      isGenerating = false;
      btnGenerate.disabled = false;
      generateAbort = null;
    }
  }

  function getExportFilename(sourceEditor) {
    const lines = sourceEditor.value.split('\n');

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
    return `CodeLab - ${slug || 'tai-lieu'} - ${date}`;
  }

  async function exportPdf() {
    const ctx = getEditorCtx();
    if (!ctx.editor.value.trim()) {
      ctx.setStatus('Chưa có nội dung để xuất PDF', true);
      return;
    }

    renderPreviewFor(ctx);
    showOverlay('Đang tạo file PDF...');

    try {
      const filename = `${getExportFilename(ctx.editor)}.pdf`;
      const { default: html2pdf } = await import('html2pdf.js');
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

      await html2pdf().set(opt).from(ctx.preview).save();
      ctx.setStatus(`Đã xuất PDF: ${filename}`);
    } catch (err) {
      ctx.setStatus(`Lỗi xuất PDF: ${err.message}`, true);
    } finally {
      hideOverlay();
    }
  }

  async function exportDocx() {
    const ctx = getEditorCtx();
    if (!ctx.editor.value.trim()) {
      ctx.setStatus('Chưa có nội dung để xuất DOCX', true);
      return;
    }

    showOverlay('Đang tạo file DOCX (Pandoc)...');

    try {
      const markdown = convertChartBlocksToDocxMarkdown(ctx.editor.value);
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
      const filename = `${getExportFilename(ctx.editor)}.docx`;
      saveAs(blob, filename);
      ctx.setStatus(`Đã xuất DOCX: ${filename}`);
    } catch (err) {
      ctx.setStatus(`Lỗi xuất DOCX: ${err.message}`, true);
    } finally {
      hideOverlay();
    }
  }

  editor.addEventListener('input', scheduleRender);
  composeEditor.addEventListener('input', scheduleComposeRender);

  function setMobileTab(tab, screenRoot) {
    if (!screenRoot) return;
    screenRoot.dataset.mobileTab = tab;
    screenRoot.querySelectorAll('.mobile-tabs__btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.tab === tab);
    });
    screenRoot.querySelectorAll('.panel[data-panel]').forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.panel === tab);
    });
  }

  function setComposeMobileTab(tab) {
    setMobileTab(tab, document.getElementById('compose-screen'));
  }

  document.getElementById('tab-create').addEventListener('click', () => {
    setMobileTab('create', document.getElementById('workspace-screen'));
  });

  document.getElementById('tab-editor').addEventListener('click', () => {
    setMobileTab('editor', document.getElementById('workspace-screen'));
  });

  document.getElementById('tab-preview').addEventListener('click', () => {
    setMobileTab('preview', document.getElementById('workspace-screen'));
  });

  document.getElementById('tab-compose-prompt').addEventListener('click', () => {
    setComposeMobileTab('prompt');
  });

  document.getElementById('tab-compose-editor').addEventListener('click', () => {
    setComposeMobileTab('editor');
  });

  document.getElementById('tab-compose-preview').addEventListener('click', () => {
    setComposeMobileTab('preview');
  });

  btnBuildPrompt.addEventListener('click', buildAndCopyPrompt);

  document.getElementById('btn-pdf').addEventListener('click', exportPdf);
  if (ENABLE_DOCX_EXPORT) {
    document.getElementById('btn-docx').addEventListener('click', exportDocx);
  }

  btnGenerate.addEventListener('click', () => generateExam());

  document.getElementById('btn-ai-settings').addEventListener('click', () => {
    openAiAlert({ reason: 'settings' });
  });

  aiModalKeyInput.addEventListener('input', () => {
    aiAlertUserError.classList.add('hidden');
    aiAlertUserError.textContent = '';
  });

  btnAiKeyToggle.addEventListener('click', () => {
    setAiKeyVisible(aiModalKeyInput.type === 'password');
  });

  document.getElementById('btn-ai-alert-close').addEventListener('click', closeAiAlert);
  aiAlertOverlay.addEventListener('click', (e) => {
    if (e.target === aiAlertOverlay) closeAiAlert();
  });

  document.getElementById('btn-ai-go-compose').addEventListener('click', () => {
    closeAiAlert();
    if (navigate) navigate('/compose');
    else window.location.assign('/compose');
  });

  document.getElementById('btn-ai-save-key').addEventListener('click', () => {
    const key = aiModalKeyInput.value.trim();
    if (!key) {
      aiAlertUserError.textContent = 'Vui lòng nhập API key trước khi lưu.';
      aiAlertUserError.classList.remove('hidden');
      aiModalKeyInput.focus();
      return;
    }

    saveUserGeminiKey(key);
    showToast({
      type: 'success',
      title: 'Đã lưu API key',
      message: 'Key của bạn sẽ được ưu tiên dùng mỗi lần tạo đề trên trình duyệt này.',
    });
    closeAiAlert();
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

  btnMobileMenu.addEventListener('click', openMobileNav);
  document.getElementById('btn-mobile-menu-close').addEventListener('click', closeMobileNav);
  document.getElementById('mobile-nav-backdrop').addEventListener('click', closeMobileNav);
  document.getElementById('btn-mobile-help').addEventListener('click', () => {
    closeMobileNav();
    openHelp();
  });
  document.getElementById('btn-mobile-pdf').addEventListener('click', () => {
    closeMobileNav();
    exportPdf();
  });
  if (ENABLE_DOCX_EXPORT) {
    document.getElementById('btn-mobile-docx').addEventListener('click', () => {
      closeMobileNav();
      exportDocx();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !helpOverlay.classList.contains('hidden')) closeHelp();
    if (e.key === 'Escape' && !aiAlertOverlay.classList.contains('hidden')) closeAiAlert();
    if (e.key === 'Escape' && mobileNavDrawer.classList.contains('is-open')) closeMobileNav();
  });

  updateAiKeyIndicator();

  wireCustomSelects(['ef-subject', 'ef-grade', 'ef-exam-type', 'cf-subject', 'cf-grade', 'cf-exam-type']);
  wireWorkspaceResizers(app);

  if (window.matchMedia('(max-width: 768px)').matches) {
    setMobileTab('create', document.getElementById('workspace-screen'));
    setComposeMobileTab('prompt');
  }

  for (const prefix of ['ef-', 'cf-']) {
    for (const id of [`${prefix}subject`, `${prefix}grade`]) {
      document.getElementById(id).addEventListener('combovaluechange', () => {
        clearFieldError(id);
      });
    }
    for (const id of [`${prefix}mc-count`, `${prefix}essay-count`]) {
      document.getElementById(id).addEventListener('input', () => {
        clearFieldError(`${prefix}questions-group`);
      });
    }
  }

  app._syncScreen = syncScreenState;

  if (navigate) {
    app.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="/"]:not([target="_blank"])');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('//')) return;
      e.preventDefault();
      navigate(href);
    });
  }

  syncScreenState(initialPathname ?? window.location.pathname);
  renderPreview();

  return { syncScreen: syncScreenState };
}

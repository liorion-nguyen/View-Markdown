import { screenFromPath } from './routes.js';

export const ONBOARDING_STORAGE_KEY = 'codelab-onboarding-v1';

export function isOnboardingComplete() {
  try {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'done';
  } catch {
    return false;
  }
}

export function markOnboardingComplete() {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'done');
  } catch {
    /* ignore */
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitFor(condition, { timeout = 4000, interval = 50 } = {}) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (condition()) {
        resolve();
        return;
      }
      if (Date.now() - start >= timeout) {
        reject(new Error('timeout'));
        return;
      }
      setTimeout(tick, interval);
    };
    tick();
  });
}

const TOUR_STEPS = [
  {
    id: 'welcome',
    screen: 'landing',
    placement: 'center',
    title: 'Chào mừng đến CodeLab Study!',
    body:
      'Công cụ AI giúp giáo viên và học sinh soạn đề kiểm tra, chỉnh Markdown có công thức và xuất PDF/DOCX. Hướng dẫn ngắn này chỉ mất vài phút.',
  },
  {
    id: 'nav',
    screen: 'landing',
    placement: 'bottom',
    resolveTarget: ({ isMobileView }) =>
      isMobileView()
        ? document.getElementById('btn-mobile-menu')
        : document.querySelector('.site-nav [data-nav-path="/workspace"]'),
    title: 'Menu điều hướng',
    body:
      'Chuyển giữa <strong>Giới thiệu</strong>, <strong>Hướng dẫn</strong>, <strong>Tạo đề AI</strong> và <strong>Tạo đề thủ công</strong>. Nút <strong>Tạo đề AI</strong> là cách nhanh nhất.',
  },
  {
    id: 'hero-cta',
    screen: 'landing',
    target: '.landing-hero__actions .landing-btn--ai',
    placement: 'top',
    title: 'Bắt đầu nhanh',
    body: 'Nhấn <strong>Tạo đề ngay</strong> để mở màn AI — không cần đăng ký hay cài đặt.',
  },
  {
    id: 'features',
    screen: 'landing',
    target: '#landing-features',
    placement: 'top',
    title: 'Tính năng chính',
    body:
      'Cấu hình đề theo môn/lớp, AI soạn nội dung, xem trước công thức KaTeX và xuất file in ấn.',
  },
  {
    id: 'form',
    screen: 'workspace',
    target: '#exam-form',
    placement: 'right',
    title: 'Form thông tin đề',
    body:
      'Chọn <strong>môn học</strong>, <strong>khối lớp</strong>, số câu TN/TL, chủ đề, độ khó và các tuỳ chọn (đáp án, lời giải…).',
    beforeEnter: async ({ isMobileView, setWorkspaceMobileTab }) => {
      if (isMobileView()) setWorkspaceMobileTab('create');
    },
  },
  {
    id: 'generate',
    screen: 'workspace',
    target: '#btn-generate',
    placement: 'top',
    title: 'Tạo đề bằng AI',
    body:
      'Sau khi điền form, nhấn đây — AI soạn đề theo thời gian thực và hiện dần ở cột Markdown.',
    beforeEnter: async ({ isMobileView, setWorkspaceMobileTab }) => {
      if (isMobileView()) setWorkspaceMobileTab('create');
    },
  },
  {
    id: 'editor',
    screen: 'workspace',
    target: '#editor',
    placement: 'left',
    title: 'Soạn thảo Markdown',
    body:
      'Chỉnh sửa nội dung trực tiếp sau khi AI tạo. Công thức ngắn: <code>\\( ... \\)</code>, riêng dòng: <code>\\[ ... \\]</code>.',
    beforeEnter: async ({ isMobileView, setWorkspaceMobileTab }) => {
      if (isMobileView()) setWorkspaceMobileTab('editor');
    },
  },
  {
    id: 'preview',
    screen: 'workspace',
    target: '#preview',
    placement: 'left',
    title: 'Xem trước',
    body: 'Bản xem trước cập nhật theo thời gian thực — kiểm tra công thức, bố cục trước khi xuất file.',
    beforeEnter: async ({ isMobileView, setWorkspaceMobileTab }) => {
      if (isMobileView()) setWorkspaceMobileTab('preview');
    },
  },
  {
    id: 'export',
    screen: 'workspace',
    placement: 'bottom',
    title: 'Xuất PDF & DOCX',
    body:
      'Trên desktop: nút <strong>Xuất PDF</strong> và <strong>Xuất DOCX</strong> trên header. Trên mobile: mở menu (☰) → chọn xuất file. Tên file lấy từ dòng <code># ĐỀ KIỂM TRA...</code>.',
    beforeEnter: async ({ isMobileView, setWorkspaceMobileTab }) => {
      if (isMobileView()) setWorkspaceMobileTab('create');
    },
    resolveTarget: ({ isMobileView }) =>
      isMobileView()
        ? document.getElementById('btn-mobile-menu')
        : document.getElementById('btn-pdf'),
  },
  {
    id: 'guide',
    screen: 'workspace',
    placement: 'bottom',
    title: 'Hướng dẫn chi tiết',
    body:
      'Mục <strong>Hướng dẫn</strong> trên menu có FAQ, quy trình tạo đề thủ công và mẹo soạn Markdown.',
    beforeEnter: async ({ isMobileView, setWorkspaceMobileTab }) => {
      if (isMobileView()) setWorkspaceMobileTab('create');
    },
    resolveTarget: ({ isMobileView }) =>
      isMobileView()
        ? document.getElementById('btn-mobile-menu')
        : document.querySelector('.site-nav [data-nav-path="/guide"]'),
  },
  {
    id: 'done',
    screen: 'workspace',
    placement: 'center',
    title: 'Sẵn sàng tạo đề!',
    body:
      'Bạn đã nắm các bước cơ bản. Hãy điền form và nhấn <strong>Tạo đề bằng AI</strong> — chúc bạn soạn đề hiệu quả!',
  },
];

function pathForScreen(screen) {
  if (screen === 'landing') return '/';
  if (screen === 'guide') return '/guide';
  return `/${screen}`;
}

/**
 * @param {{
 *   navigate?: (path: string) => void;
 *   syncScreen?: (pathname?: string) => void;
 *   isMobileView?: () => boolean;
 *   setWorkspaceMobileTab?: (tab: string) => void;
 *   openMobileNav?: () => void;
 *   closeMobileNav?: () => void;
 * }} options
 */
export function createOnboardingTour(options = {}) {
  const {
    navigate = (path) => window.location.assign(path),
    syncScreen,
    isMobileView = () => window.matchMedia('(max-width: 768px)').matches,
    setWorkspaceMobileTab = () => {},
    openMobileNav,
    closeMobileNav,
  } = options;

  let root = null;
  let backdrop = null;
  let spotlight = null;
  let popover = null;
  let titleEl = null;
  let bodyEl = null;
  let progressEl = null;
  let btnPrev = null;
  let btnNext = null;
  let btnSkip = null;
  let currentIndex = 0;
  let active = false;
  let repositionTimer = null;

  const ctx = {
    isMobileView,
    setWorkspaceMobileTab,
    navigate,
    syncScreen,
    openMobileNav,
    closeMobileNav,
  };

  function ensureDom() {
    if (root) return;

    root = document.createElement('div');
    root.className = 'onboarding-tour hidden';
    root.innerHTML = `
      <div class="onboarding-tour__backdrop" aria-hidden="true"></div>
      <div class="onboarding-tour__spotlight" aria-hidden="true"></div>
      <div
        class="onboarding-tour__popover"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-tour-title"
      >
        <p class="onboarding-tour__progress" id="onboarding-tour-progress"></p>
        <h2 class="onboarding-tour__title" id="onboarding-tour-title"></h2>
        <div class="onboarding-tour__body" id="onboarding-tour-body"></div>
        <div class="onboarding-tour__actions">
          <button type="button" class="btn btn--outline onboarding-tour__btn-prev" id="onboarding-tour-prev">
            Quay lại
          </button>
          <button type="button" class="btn btn--primary onboarding-tour__btn-next" id="onboarding-tour-next">
            Tiếp
          </button>
        </div>
        <button type="button" class="onboarding-tour__skip" id="onboarding-tour-skip">
          Bỏ qua hướng dẫn
        </button>
      </div>
    `;

    document.body.appendChild(root);
    backdrop = root.querySelector('.onboarding-tour__backdrop');
    spotlight = root.querySelector('.onboarding-tour__spotlight');
    popover = root.querySelector('.onboarding-tour__popover');
    titleEl = root.querySelector('#onboarding-tour-title');
    bodyEl = root.querySelector('#onboarding-tour-body');
    progressEl = root.querySelector('#onboarding-tour-progress');
    btnPrev = root.querySelector('#onboarding-tour-prev');
    btnNext = root.querySelector('#onboarding-tour-next');
    btnSkip = root.querySelector('#onboarding-tour-skip');

    btnPrev.addEventListener('click', () => goTo(currentIndex - 1));
    btnNext.addEventListener('click', () => {
      if (currentIndex >= TOUR_STEPS.length - 1) finish();
      else goTo(currentIndex + 1);
    });
    btnSkip.addEventListener('click', finish);

    window.addEventListener('resize', scheduleReposition);
    window.addEventListener('scroll', scheduleReposition, true);
  }

  function scheduleReposition() {
    if (!active) return;
    if (repositionTimer) cancelAnimationFrame(repositionTimer);
    repositionTimer = requestAnimationFrame(() => {
      repositionTimer = null;
      positionStep(TOUR_STEPS[currentIndex]);
    });
  }

  async function ensureScreen(screen) {
    const current = screenFromPath(window.location.pathname);
    if (current === screen) return;

    const path = pathForScreen(screen);
    navigate(path);
    syncScreen?.(path);
    await wait(80);
    await waitFor(() => screenFromPath(window.location.pathname) === screen);
  }

  function resolveTarget(step) {
    if (step.resolveTarget) return step.resolveTarget(ctx);
    if (!step.target) return null;
    return document.querySelector(step.target);
  }

  function positionStep(step) {
    const target = resolveTarget(step);
    const placement = step.placement ?? 'bottom';
    const pad = 8;
    const gap = 14;
    const viewportPad = 12;

    if (!target || placement === 'center') {
      spotlight.style.display = 'none';
      popover.style.left = '50%';
      popover.style.top = '50%';
      popover.style.transform = 'translate(-50%, -50%)';
      popover.dataset.placement = 'center';
      return;
    }

    target.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    const rect = target.getBoundingClientRect();

    spotlight.style.display = 'block';
    spotlight.style.top = `${rect.top - pad}px`;
    spotlight.style.left = `${rect.left - pad}px`;
    spotlight.style.width = `${rect.width + pad * 2}px`;
    spotlight.style.height = `${rect.height + pad * 2}px`;

    const popRect = popover.getBoundingClientRect();
    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = rect.top - gap - popRect.height;
        left = rect.left + rect.width / 2 - popRect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - popRect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - popRect.height / 2;
        left = rect.left - gap - popRect.width;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - popRect.height / 2;
        left = rect.right + gap;
        break;
      default:
        top = rect.bottom + gap;
        left = rect.left;
    }

    left = Math.max(viewportPad, Math.min(left, window.innerWidth - popRect.width - viewportPad));
    top = Math.max(viewportPad, Math.min(top, window.innerHeight - popRect.height - viewportPad));

    popover.style.transform = 'none';
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
    popover.dataset.placement = placement;
  }

  async function showStep(index) {
    ensureDom();
    const step = TOUR_STEPS[index];
    if (!step) return;

    currentIndex = index;
    active = true;
    root.classList.remove('hidden');
    document.body.classList.add('onboarding-tour-open');

    await ensureScreen(step.screen);
    if (step.beforeEnter) await step.beforeEnter(ctx);
    await wait(60);

    progressEl.textContent = `Bước ${index + 1} / ${TOUR_STEPS.length}`;
    titleEl.textContent = step.title;
    bodyEl.innerHTML = step.body;

    btnPrev.disabled = index === 0;
    btnNext.textContent = index === TOUR_STEPS.length - 1 ? 'Hoàn tất' : 'Tiếp';

    requestAnimationFrame(() => {
      positionStep(step);
      requestAnimationFrame(() => positionStep(step));
    });
  }

  async function goTo(index) {
    if (index < 0 || index >= TOUR_STEPS.length) return;
    await showStep(index);
  }

  function finish() {
    active = false;
    markOnboardingComplete();
    closeMobileNav?.();
    if (root) root.classList.add('hidden');
    document.body.classList.remove('onboarding-tour-open');
    spotlight.style.display = 'none';
  }

  return {
    start: async () => {
      if (isOnboardingComplete()) return;
      await goTo(0);
    },
    restart: async () => {
      await goTo(0);
    },
    finish,
    isActive: () => active,
  };
}

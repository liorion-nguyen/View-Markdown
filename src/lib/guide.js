/** Mẹo ngắn — panel trợ giúp (?) trên workspace */
export const HELP_TIPS = [
  'Giáo viên: mô tả chủ đề càng cụ thể (chương, dạng bài) thì AI soạn đề càng sát chương trình.',
  'Học sinh: tạo đề luyện tập theo đúng môn và khối lớp đang học.',
  'Sau khi AI tạo đề, bạn có thể chỉnh sửa trực tiếp trong ô Markdown.',
  'Tiêu đề đề nên bắt đầu bằng # ĐỀ KIỂM TRA ... để file xuất có tên hợp lý.',
  'PDF phù hợp in ấn; DOCX tiện chỉnh sửa thêm trên Word.',
  'Công thức ngắn trong câu: \\( ... \\). Công thức riêng dòng: \\[ ... \\] ở đầu dòng, không thụt lề.',
  'Môn Địa lý: dùng khối ```chart``` với type, title, labels, data trên các dòng riêng.',
];

const GUIDE_PATHS = [
  {
    id: 'ai',
    badge: 'Khuyên dùng',
    badgeClass: 'guide-path-card__badge--ai',
    title: 'Tạo đề bằng AI',
    href: '/workspace',
    cta: 'Mở Tạo đề AI',
    ctaClass: 'landing-btn landing-btn--ai',
    desc: 'Điền form → AI soạn đề trực tiếp → chỉnh sửa → xuất PDF/DOCX. Nhanh nhất cho giáo viên bận rộn.',
    steps: [
      'Vào <strong>Tạo đề AI</strong> trên menu.',
      'Điền môn, khối, số câu TN/TL, chủ đề, độ khó và tuỳ chọn đề.',
      'Nhấn <strong>Tạo đề bằng AI</strong> — nội dung hiện dần ở cột Markdown.',
      'Chỉnh sửa nếu cần, xem trước bên phải, rồi <strong>Xuất PDF</strong> hoặc <strong>Xuất DOCX</strong> trên header.',
    ],
  },
  {
    id: 'manual',
    badge: 'Dự phòng',
    badgeClass: 'guide-path-card__badge--manual',
    title: 'Tạo đề thủ công',
    href: '/compose',
    cta: 'Mở Tạo đề',
    ctaClass: 'landing-btn landing-btn--outline',
    desc: 'Sao chép prompt → dán vào ChatGPT/Gemini → copy kết quả Markdown về CodeLab. Dùng khi AI dùng chung quá tải.',
    steps: [
      'Vào <strong>Tạo đề</strong> trên menu.',
      'Điền form giống màn AI, nhấn <strong>Tạo & sao chép prompt</strong>.',
      'Dán prompt vào ChatGPT hoặc Gemini, chờ AI trả về Markdown.',
      'Copy kết quả → tab <strong>Dán đề</strong> → xuất PDF/DOCX.',
    ],
  },
];

const FORM_FIELDS = [
  { field: 'Môn học / Khối lớp', required: true, note: 'Chọn từ danh sách hoặc gõ tên môn tùy chỉnh.' },
  { field: 'Số câu TN / TL', required: true, note: 'Ít nhất một trong hai phải lớn hơn 0.' },
  { field: 'Chủ đề / Nội dung', required: false, note: 'Càng cụ thể càng tốt — VD: "Chương 3: Hàm số bậc nhất, tập xác định".' },
  { field: 'Loại kiểm tra', required: false, note: '15 phút, giữa kỳ, cuối kỳ… giúp AI căn độ dài và cấu trúc.' },
  { field: 'Độ khó', required: false, note: 'Cơ bản / Nâng cao / Hỗn hợp.' },
  { field: 'Thời gian làm bài', required: false, note: 'VD: 45 phút — hiển thị trên đề.' },
  { field: 'Tuỳ chọn đề', required: false, note: 'Bảng đáp án, lời giải, học kỳ I/II, trắc nghiệm 4 phương án…' },
  { field: 'Yêu cầu thêm', required: false, note: 'Ghi chú riêng: sát SGK, không đảo phương án, v.v.' },
];

const MARKDOWN_GUIDE = [
  {
    title: 'Tiêu đề đề thi',
    code: '# ĐỀ KIỂM TRA 45 PHÚT — MÔN TOÁN — LỚP 10',
    note: 'Dòng # đầu tiên dùng làm tên file khi xuất PDF/DOCX.',
  },
  {
    title: 'Công thức trong câu',
    code: 'Tập xác định: \\( D = \\mathbb{R} \\setminus \\{1\\} \\)',
    note: 'Dùng \\( ... \\) cho công thức ngắn trong dòng.',
  },
  {
    title: 'Công thức riêng dòng',
    code: '\\[ \\int_0^1 x^2 \\, dx = \\frac{1}{3} \\]',
    note: 'Đặt \\[ ... \\] ở đầu dòng, không thụt lề.',
  },
  {
    title: 'Trắc nghiệm',
    code: '**Câu 1.** Cho hàm số...\\nA. ...\\nB. ...\\nC. ...\\nD. ...',
    note: 'Mỗi phương án trên một dòng; AI thường tách Phần I / Phần II nếu bật tuỳ chọn.',
  },
];

export const FAQ_ITEMS = [
  {
    q: 'AI báo quá tải / không tạo được đề?',
    a: 'Hệ thống dùng hạ tầng Gemini chung. Khi nhiều người dùng cùng lúc, hãy thử lại sau vài phút, dùng <strong>Tạo đề thủ công</strong>, hoặc cấu hình <strong>API Gemini riêng</strong> (miễn phí tại Google AI Studio) trong màn Tạo đề AI.',
  },
  {
    q: 'Công thức Toán/Lý không hiển thị đúng?',
    a: 'Kiểm tra cú pháp \\( \\) và \\[ \\]. Tránh thụt lề trước \\[. Sau khi sửa, tab Xem trước cập nhật tự động.',
  },
  {
    q: 'Xuất PDF bị cắt trang hoặc lệch?',
    a: 'Rút gọn bảng quá rộng, tách công thức dài sang dòng riêng. PDF tối ưu cho in A4; DOCX tiện chỉnh layout trên Word.',
  },
  {
    q: 'Tôi là học sinh — dùng được không?',
    a: 'Có. Chọn đúng môn, khối và chủ đề đang học để tạo đề luyện tập. Có thể giảm số câu và chọn độ khó Cơ bản.',
  },
];

function renderSteps(steps) {
  return steps
    .map(
      (text, i) => `
        <li class="guide-step">
          <span class="guide-step__num">${i + 1}</span>
          <span class="guide-step__text">${text}</span>
        </li>`,
    )
    .join('');
}

/** HTML trang /guide */
export function renderGuidePage() {
  return `
    <main class="guide-page" aria-labelledby="guide-page-title">
      <section class="guide-page__hero">
        <span class="guide-page__eyebrow">Hướng dẫn · CodeLab Study</span>
        <h1 id="guide-page-title">Hướng dẫn sử dụng chi tiết</h1>
        <p class="guide-page__lead">
          CodeLab Study giúp giáo viên và học sinh tạo đề kiểm tra, chỉnh sửa Markdown có công thức Toán/Lý,
          và xuất PDF/DOCX chuẩn in ấn. Chọn một trong hai cách làm việc bên dưới.
        </p>
        <nav class="guide-page__toc" aria-label="Mục lục hướng dẫn">
          <a href="#guide-paths">Hai cách tạo đề</a>
          <a href="#guide-form">Form thông tin</a>
          <a href="#guide-markdown">Markdown & công thức</a>
          <a href="#guide-export">Xuất file</a>
          <a href="#guide-faq">Câu hỏi thường gặp</a>
        </nav>
      </section>

      <section class="guide-section" id="guide-paths" aria-labelledby="guide-paths-title">
        <header class="guide-section__head">
          <h2 id="guide-paths-title">Hai cách tạo đề</h2>
          <p>AI trực tiếp trên CodeLab, hoặc thủ công qua ChatGPT/Gemini — cùng một form, cùng khả năng xuất file.</p>
        </header>
        <div class="guide-path-grid">
          ${GUIDE_PATHS.map(
            (path) => `
            <article class="guide-path-card guide-path-card--${path.id}">
              <span class="guide-path-card__badge ${path.badgeClass}">${path.badge}</span>
              <h3>${path.title}</h3>
              <p class="guide-path-card__desc">${path.desc}</p>
              <ol class="guide-path-card__steps">
                ${renderSteps(path.steps)}
              </ol>
              <a class="${path.ctaClass}" href="${path.href}">${path.cta}</a>
            </article>`,
          ).join('')}
        </div>
      </section>

      <section class="guide-section" id="guide-form" aria-labelledby="guide-form-title">
        <header class="guide-section__head">
          <h2 id="guide-form-title">Giải thích form thông tin đề</h2>
          <p>Các trường dùng chung cho cả <strong>Tạo đề AI</strong> và <strong>Tạo đề thủ công</strong>.</p>
        </header>
        <div class="guide-table-wrap">
          <table class="guide-table">
            <thead>
              <tr>
                <th scope="col">Trường</th>
                <th scope="col">Bắt buộc</th>
                <th scope="col">Gợi ý</th>
              </tr>
            </thead>
            <tbody>
              ${FORM_FIELDS.map(
                (row) => `
                <tr>
                  <td><strong>${row.field}</strong></td>
                  <td>${row.required ? '<span class="guide-tag guide-tag--req">Có</span>' : '<span class="guide-tag">Không</span>'}</td>
                  <td>${row.note}</td>
                </tr>`,
              ).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <section class="guide-section" id="guide-markdown" aria-labelledby="guide-markdown-title">
        <header class="guide-section__head">
          <h2 id="guide-markdown-title">Markdown & công thức</h2>
          <p>Sau khi có nội dung (AI hoặc dán từ ngoài), bạn chỉnh trong ô Markdown — Xem trước cập nhật theo thời gian thực.</p>
        </header>
        <div class="guide-code-grid">
          ${MARKDOWN_GUIDE.map(
            (item) => `
            <article class="guide-code-card">
              <h3>${item.title}</h3>
              <pre class="guide-code-card__pre"><code>${item.code}</code></pre>
              <p>${item.note}</p>
            </article>`,
          ).join('')}
        </div>
        <aside class="guide-callout guide-callout--tip">
          <strong>Mẹo nhanh</strong>
          <ul>
            ${HELP_TIPS.map((t) => `<li>${t}</li>`).join('')}
          </ul>
        </aside>
      </section>

      <section class="guide-section" id="guide-export" aria-labelledby="guide-export-title">
        <header class="guide-section__head">
          <h2 id="guide-export-title">Xuất PDF & DOCX</h2>
          <p>Nút xuất nằm trên header khi bạn đang ở màn Tạo đề AI hoặc Tạo đề thủ công.</p>
        </header>
        <div class="guide-export-grid">
          <article class="guide-export-card">
            <div class="guide-export-card__icon guide-export-card__icon--pdf" aria-hidden="true">PDF</div>
            <h3>Xuất PDF</h3>
            <p>Phù hợp in ấn, giao đề cho học sinh. Giữ nguyên công thức và bố cục đề.</p>
          </article>
          <article class="guide-export-card">
            <div class="guide-export-card__icon guide-export-card__icon--docx" aria-hidden="true">DOC</div>
            <h3>Xuất DOCX</h3>
            <p>Mở bằng Word để chỉnh lề, thêm logo trường, watermark hoặc điều chỉnh chi tiết.</p>
          </article>
        </div>
        <p class="guide-section__foot">
          Tên file lấy từ dòng tiêu đề <code># ĐỀ KIỂM TRA...</code> — nên đặt tiêu đề rõ ràng trước khi xuất.
        </p>
      </section>

      <section class="guide-section guide-section--faq" id="guide-faq" aria-labelledby="guide-faq-title">
        <header class="guide-section__head">
          <h2 id="guide-faq-title">Câu hỏi thường gặp</h2>
        </header>
        <div class="guide-faq">
          ${FAQ_ITEMS.map(
            (item) => `
            <details class="guide-faq__item">
              <summary>${item.q}</summary>
              <p>${item.a}</p>
            </details>`,
          ).join('')}
        </div>
      </section>

      <section class="guide-page__cta">
        <h2>Sẵn sàng tạo đề?</h2>
        <p>Bắt đầu với AI trực tiếp, hoặc chuyển sang chế độ thủ công khi cần.</p>
        <div class="guide-page__cta-actions">
          <a class="landing-btn landing-btn--ai" href="/workspace">Tạo đề bằng AI</a>
          <a class="landing-btn landing-btn--outline" href="/compose">Tạo đề thủ công</a>
        </div>
      </section>
    </main>`;
}

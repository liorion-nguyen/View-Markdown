import { FORMAT_RULES } from './format-rules.js';

function isGeographySubject(subject) {
  const normalized = String(subject || '').toLowerCase();
  return normalized.includes('địa lí') || normalized.includes('địa lý');
}

function wantsCharts(data) {
  const haystack = `${data.topic || ''}\n${data.specificLessons || ''}\n${data.notes || ''}`.toLowerCase();
  return haystack.includes('biểu đồ') || haystack.includes('chart') || isGeographySubject(data.subject);
}

/**
 * @param {{
 *   schoolName?: string;
 *   subject: string;
 *   grade: string;
 *   schoolYear?: string;
 *   examType?: string;
 *   semester?: string;
 *   time?: string;
 *   examCode?: string;
 *   mcCount: number;
 *   mcScore?: string;
 *   essayCount: number;
 *   essayScoreDist?: string;
 *   difficulty?: string;
 *   cognitiveMatrix?: { recognize?: number|null; understand?: number|null; apply?: number|null; advanced?: number|null; } | null;
 *   topic?: string;
 *   specificLessons?: string;
 *   excludedTopics?: string;
 *   notes?: string;
 * }} data
 * @returns {string}
 */
export function buildExamPrompt(data) {
  const lines = [];

  // ── Vai trò ──────────────────────────────────────────────────────────────
  const schoolPart = data.schoolName?.trim()
    ? ` tại trường ${data.schoolName.trim()}`
    : '';
  lines.push(`Bạn là giáo viên môn ${data.subject || 'Toán'} lớp ${data.grade || '8'}${schoolPart}.`);
  lines.push('');
  lines.push(
    'Hãy soạn đề kiểm tra theo ĐÚNG MỘT định dạng quy định bên dưới — không dùng cách viết khác (không $, không thụt lề khối toán, không HTML).',
  );
  lines.push(
    'Chỉ trả về nội dung đề Markdown thuần, không giải thích thêm, không bọc trong code fence. Nếu môn Địa lý cần biểu đồ, dùng khối ```chart``` cố định theo quy tắc bên dưới.',
  );

  // ── Quy tắc riêng Địa lý ─────────────────────────────────────────────────
  if (isGeographySubject(data.subject)) {
    lines.push('');
    lines.push('QUY TẮC RIÊNG CHO MÔN ĐỊA LÍ:');
    lines.push('- Phải có ít nhất 1 câu trắc nghiệm đọc biểu đồ và ít nhất 1 bài tự luận phân tích biểu đồ nếu đề có dữ liệu biểu đồ.');
    lines.push('- Mỗi nơi có dữ liệu biểu đồ phải chèn đúng một khối ```chart``` độc lập.');
  }

  if (wantsCharts(data)) {
    lines.push('');
    lines.push('MẪU BIỂU ĐỒ BẮT BUỘC KHI CÓ DỮ LIỆU:');
    lines.push('```chart');
    lines.push('type: line');
    lines.push('title: Tên biểu đồ');
    lines.push('labels: Năm 2010 | Năm 2015 | Năm 2020');
    lines.push('data: 20 | 18 | 15');
    lines.push('unit: %');
    lines.push('```');
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(FORMAT_RULES);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('NỘI DUNG ĐỀ CẦN SOẠN:');

  // ── THÔNG TIN HEADER ──────────────────────────────────────────────────────
  lines.push('');
  lines.push('【THÔNG TIN ĐỀ】');

  if (data.schoolName?.trim()) {
    lines.push(`- Tên trường: ${data.schoolName.trim()}`);
  }

  const examTypeLabel = data.examType?.trim()
    ? data.examType.trim()
    : 'Kiểm tra';
  const semesterLabel = data.semester?.trim() ? ` – ${data.semester.trim()}` : '';
  lines.push(`- Loại: ${examTypeLabel}${semesterLabel}`);

  if (data.schoolYear?.trim()) {
    lines.push(`- Năm học: ${data.schoolYear.trim()}`);
  }

  if (data.examCode?.trim()) {
    lines.push(`- Mã đề: ${data.examCode.trim()}`);
  }

  if (data.time?.trim()) {
    lines.push(`- Thời gian làm bài: ${data.time.trim()}`);
  } else {
    lines.push('- KHÔNG ghi thời gian làm bài trên đề');
  }

  // ── CẤU TRÚC ĐỀ ──────────────────────────────────────────────────────────
  lines.push('');
  lines.push('【CẤU TRÚC ĐỀ】');

  if (data.mcCount > 0) {
    const mcScorePart = data.mcScore?.trim() ? ` × ${data.mcScore.trim()}/câu` : '';
    lines.push(`- Trắc nghiệm: ${data.mcCount} câu${mcScorePart}`);
  } else {
    lines.push('- KHÔNG tạo phần trắc nghiệm (Phần I)');
  }

  if (data.essayCount > 0) {
    const distPart = data.essayScoreDist?.trim()
      ? ` — phân bố điểm: ${data.essayScoreDist.trim()}`
      : '';
    lines.push(`- Tự luận: ${data.essayCount} bài${distPart}`);
  } else {
    lines.push('- KHÔNG tạo phần tự luận (Phần II)');
  }

  if (data.difficulty?.trim()) {
    lines.push(`- Độ khó tổng thể: ${data.difficulty.trim()}`);
  }

  // ── MA TRẬN NHẬN THỨC ────────────────────────────────────────────────────
  const cog = data.cognitiveMatrix;
  if (cog && Object.values(cog).some((v) => v !== null && v !== undefined)) {
    lines.push('');
    lines.push('【MA TRẬN NHẬN THỨC】');
    lines.push('Phân phối câu hỏi theo mức độ tư duy (số câu ước tính từ tỉ lệ):');

    const totalQ = data.mcCount + data.essayCount;
    const fmtLevel = (label, pct) => {
      if (pct === null || pct === undefined) return null;
      const count = totalQ > 0 ? Math.round((pct / 100) * totalQ) : null;
      return `- ${label}: ${pct}%${count !== null ? ` (≈ ${count} câu)` : ''}`;
    };

    const lvls = [
      fmtLevel('Nhận biết', cog.recognize),
      fmtLevel('Thông hiểu', cog.understand),
      fmtLevel('Vận dụng', cog.apply),
      fmtLevel('Vận dụng cao', cog.advanced),
    ].filter(Boolean);

    lvls.forEach((l) => lines.push(l));
  }

  // ── NỘI DUNG KIẾN THỨC ───────────────────────────────────────────────────
  lines.push('');
  lines.push('【NỘI DUNG KIẾN THỨC】');

  if (data.topic?.trim()) {
    lines.push(`- Chương / Chủ đề: ${data.topic.trim()}`);
  }

  if (data.specificLessons?.trim()) {
    lines.push(`- Bài học cụ thể cần ra: ${data.specificLessons.trim()}`);
  }

  if (data.excludedTopics?.trim()) {
    lines.push(`- NỘI DUNG KHÔNG RA (bắt buộc bỏ qua): ${data.excludedTopics.trim()}`);
  }

  if (!data.topic?.trim() && !data.specificLessons?.trim()) {
    lines.push(`- (Người dùng không chỉ định chủ đề — hãy ra đề bao quát chương trình ${data.subject} lớp ${data.grade})`);
  }

  // ── YÊU CẦU BỔ SUNG ──────────────────────────────────────────────────────
  if (data.notes?.trim()) {
    lines.push('');
    lines.push('【YÊU CẦU BỔ SUNG】');
    for (const note of data.notes.split('\n- ').filter(Boolean)) {
      lines.push(`- ${note.trim()}`);
    }
  }

  return lines.join('\n');
}

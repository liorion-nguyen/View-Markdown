import { marked } from 'marked';

import { preprocessForRender, preprocessForRenderLight, preprocessMarkdown } from './preprocess.js';

const CHART_BLOCK_RE = /```chart\s*\n([\s\S]*?)\n```/gi;
const CHART_TOKEN_PREFIX = 'VIEWMATH_CHART_';
const DEFAULT_COLORS = ['#2563eb', '#0f766e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function splitList(value) {
  return String(value)
    .split(/[|,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumber(value) {
  const normalized = String(value).trim().replace(/\s+/g, '').replace(',', '.');
  if (!normalized) return NaN;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : NaN;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return '';
  const rounded = Math.abs(value) >= 10 ? value.toFixed(0) : value.toFixed(1);
  return rounded.replace(/\.0$/, '').replace('.', ',');
}

function normalizeChartType(value) {
  const type = String(value || 'bar').trim().toLowerCase();
  if (type === 'line' || type === 'pie') return type;
  return 'bar';
}

function parseChartBlock(raw) {
  const chart = {
    type: 'bar',
    title: '',
    labels: [],
    data: [],
    unit: '',
    caption: '',
  };

  for (const line of String(raw).split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([a-zA-Z][\w-]*)\s*:\s*(.*)$/);
    if (!match) continue;

    const key = match[1].toLowerCase();
    const value = match[2].trim();

    if (key === 'type') {
      chart.type = normalizeChartType(value);
    } else if (key === 'title') {
      chart.title = value;
    } else if (key === 'labels') {
      chart.labels = splitList(value);
    } else if (key === 'data' || key === 'values') {
      chart.data = splitList(value)
        .map(parseNumber)
        .filter((number) => Number.isFinite(number));
    } else if (key === 'unit') {
      chart.unit = value;
    } else if (key === 'caption') {
      chart.caption = value;
    }
  }

  const itemCount = Math.min(chart.labels.length, chart.data.length);
  chart.labels = chart.labels.slice(0, itemCount);
  chart.data = chart.data.slice(0, itemCount);

  if (!chart.labels.length || !chart.data.length) {
    throw new Error('Biểu đồ thiếu nhãn hoặc số liệu');
  }

  if (!chart.title) {
    chart.title = 'Biểu đồ';
  }

  return chart;
}

function escapeMarkdownCell(value) {
  return String(value).replace(/\|/g, '\\|');
}

function formatChartFallbackTable(chart) {
  const lines = [];

  lines.push(`**Biểu đồ: ${chart.title}**`);
  lines.push('');
  lines.push(`_Loại biểu đồ: ${chart.type}${chart.unit ? ` | Đơn vị: ${chart.unit}` : ''}_`);
  lines.push('');
  lines.push('| Nhãn | Giá trị |');
  lines.push('|---|---:|');

  chart.labels.forEach((label, index) => {
    lines.push(`| ${escapeMarkdownCell(label)} | ${formatNumber(chart.data[index])} |`);
  });

  if (chart.caption) {
    lines.push('');
    lines.push(`_${chart.caption}_`);
  }

  return lines.join('\n');
}

function getScaleMax(values) {
  const maxValue = Math.max(...values, 0);
  if (maxValue <= 0) return 1;
  if (maxValue <= 10) return Math.ceil(maxValue);
  if (maxValue <= 50) return Math.ceil(maxValue / 5) * 5;
  if (maxValue <= 100) return Math.ceil(maxValue / 10) * 10;
  if (maxValue <= 500) return Math.ceil(maxValue / 50) * 50;
  return Math.ceil(maxValue / 100) * 100;
}

function renderPieChart(chart) {
  const width = 760;
  const height = 420;
  const title = escapeHtml(chart.title);
  const unit = chart.unit ? escapeHtml(chart.unit) : '';
  const caption = chart.caption ? escapeHtml(chart.caption) : '';
  const radius = 126;
  const cx = 230;
  const cy = 222;
  const total = chart.data.reduce((sum, value) => sum + value, 0) || 1;
  let startAngle = -90;

  const slices = chart.data.map((value, index) => {
    const fraction = value / total;
    const endAngle = startAngle + fraction * 360;
    const color = DEFAULT_COLORS[index % DEFAULT_COLORS.length];

    const startRad = (Math.PI / 180) * startAngle;
    const endRad = (Math.PI / 180) * endAngle;
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    startAngle = endAngle;

    return `
      <path d="M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" fill="${color}" />
    `;
  });

  const legend = chart.labels
    .map((label, index) => {
      const value = chart.data[index];
      const color = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
      const percent = ((value / total) * 100).toFixed(1).replace('.0', '');
      return `
        <li class="chart-block__legend-item">
          <span class="chart-block__swatch" style="background:${color}"></span>
          <span class="chart-block__legend-text">${escapeHtml(label)} <strong>${escapeHtml(formatNumber(value))}</strong>${unit ? ` ${unit}` : ''} (${percent}%)</span>
        </li>
      `;
    })
    .join('');

  return `
    <figure class="chart-block chart-block--pie" role="img" aria-label="${title}">
      <svg class="chart-block__svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <defs>
          <filter id="chart-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#0f172a" flood-opacity="0.08"/>
          </filter>
        </defs>
        <rect x="0" y="0" width="${width}" height="${height}" rx="24" fill="#ffffff" />
        <text x="28" y="34" class="chart-block__title" font-size="20" font-weight="700" fill="#0f172a">${title}</text>
        ${unit ? `<text x="28" y="56" class="chart-block__subtitle" font-size="12" fill="#64748b">Đơn vị: ${unit}</text>` : ''}
        <g filter="url(#chart-shadow)">
          ${slices.join('\n')}
        </g>
        <circle cx="${cx}" cy="${cy}" r="40" fill="#ffffff" opacity="0.95" />
        <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="13" font-weight="700" fill="#0f172a">Tổng</text>
        <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="18" font-weight="800" fill="#0f172a">${escapeHtml(formatNumber(total))}</text>
      </svg>
      <ul class="chart-block__legend">${legend}</ul>
      ${caption ? `<figcaption class="chart-block__caption">${caption}</figcaption>` : ''}
    </figure>
  `;
}

function renderCartesianChart(chart) {
  const width = 760;
  const height = 420;
  const padding = { top: 56, right: 28, bottom: 72, left: 64 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxValue = getScaleMax(chart.data);
  const title = escapeHtml(chart.title);
  const unit = chart.unit ? escapeHtml(chart.unit) : '';
  const caption = chart.caption ? escapeHtml(chart.caption) : '';
  const barCount = chart.data.length;
  const bandWidth = innerWidth / Math.max(barCount, 1);
  const barWidth = Math.max(18, Math.min(64, bandWidth * 0.62));
  const baselineY = padding.top + innerHeight;
  const ticks = 5;

  const gridLines = Array.from({ length: ticks + 1 }, (_, index) => {
    const ratio = index / ticks;
    const y = padding.top + innerHeight - innerHeight * ratio;
    const tickValue = (maxValue * ratio).toFixed(maxValue < 10 ? 1 : 0).replace(/\.0$/, '');
    return `
      <g>
        <line x1="${padding.left}" y1="${y.toFixed(2)}" x2="${width - padding.right}" y2="${y.toFixed(2)}" stroke="#e2e8f0" stroke-width="1" />
        <text x="${padding.left - 10}" y="${(y + 4).toFixed(2)}" text-anchor="end" font-size="11" fill="#64748b">${escapeHtml(tickValue)}</text>
      </g>
    `;
  });

  const bars = chart.data.map((value, index) => {
    const label = chart.labels[index];
    const xCenter = padding.left + bandWidth * index + bandWidth / 2;
    const barHeight = (value / maxValue) * innerHeight;
    const x = xCenter - barWidth / 2;
    const y = baselineY - barHeight;
    const color = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
    const labelY = baselineY + 18;
    const valueY = y - 8;

    return `
      <g>
        <rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barWidth.toFixed(2)}" height="${barHeight.toFixed(2)}" rx="8" fill="${color}" />
        <text x="${xCenter.toFixed(2)}" y="${valueY.toFixed(2)}" text-anchor="middle" font-size="12" font-weight="700" fill="#0f172a">${escapeHtml(formatNumber(value))}</text>
        <text x="${xCenter.toFixed(2)}" y="${labelY.toFixed(2)}" text-anchor="middle" font-size="12" fill="#334155">${escapeHtml(label)}</text>
      </g>
    `;
  });

  const linePoints = chart.data.map((value, index) => {
    const x = padding.left + bandWidth * index + bandWidth / 2;
    const y = baselineY - (value / maxValue) * innerHeight;
    return { x, y, value };
  });

  const linePath = linePoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  const series = chart.type === 'line'
    ? `
      <path d="${linePath}" fill="none" stroke="${DEFAULT_COLORS[0]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      ${linePoints
        .map((point, index) => {
          const color = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
          const label = chart.labels[index];
          return `
            <g>
              <circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="5.5" fill="${color}" stroke="#ffffff" stroke-width="2" />
              <text x="${point.x.toFixed(2)}" y="${(point.y - 10).toFixed(2)}" text-anchor="middle" font-size="12" font-weight="700" fill="#0f172a">${escapeHtml(formatNumber(point.value))}</text>
              <text x="${point.x.toFixed(2)}" y="${(baselineY + 18).toFixed(2)}" text-anchor="middle" font-size="12" fill="#334155">${escapeHtml(label)}</text>
            </g>
          `;
        })
        .join('')}
    `
    : bars.join('');

  return `
    <figure class="chart-block chart-block--${chart.type}" role="img" aria-label="${title}">
      <svg class="chart-block__svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <rect x="0" y="0" width="${width}" height="${height}" rx="24" fill="#ffffff" />
        <text x="28" y="34" class="chart-block__title" font-size="20" font-weight="700" fill="#0f172a">${title}</text>
        ${unit ? `<text x="28" y="56" class="chart-block__subtitle" font-size="12" fill="#64748b">Đơn vị: ${unit}</text>` : ''}
        ${gridLines.join('\n')}
        <line x1="${padding.left}" y1="${baselineY.toFixed(2)}" x2="${width - padding.right}" y2="${baselineY.toFixed(2)}" stroke="#94a3b8" stroke-width="1.2" />
        ${series}
      </svg>
      ${caption ? `<figcaption class="chart-block__caption">${caption}</figcaption>` : ''}
    </figure>
  `;
}

function renderChartHtml(chart) {
  return chart.type === 'pie' ? renderPieChart(chart) : renderCartesianChart(chart);
}

function replaceChartTokens(html, charts) {
  let result = html;

  for (const chart of charts) {
    const token = escapeRegExp(chart.token);
    const chartHtml = renderChartHtml(chart.definition);
    const paragraphPattern = new RegExp(`<p>\\s*${token}\\s*<\\/p>`, 'g');

    result = result.replace(paragraphPattern, chartHtml);
    result = result.replace(new RegExp(token, 'g'), chartHtml);
  }

  return result;
}

function extractChartBlocks(source) {
  const charts = [];
  const text = String(source).replace(CHART_BLOCK_RE, (_, body) => {
    const token = `${CHART_TOKEN_PREFIX}${charts.length}`;
    charts.push({ token, definition: parseChartBlock(body) });
    return `\n\n${token}\n\n`;
  });

  return { text, charts };
}

export function renderMarkdownWithCharts(source, { light = false } = {}) {
  const { text, charts } = extractChartBlocks(source);
  const processed = light ? preprocessForRenderLight(text) : preprocessForRender(text);
  const html = marked.parse(processed);
  return replaceChartTokens(html, charts);
}

export function convertChartBlocksToDocxMarkdown(source) {
  const text = String(source).replace(CHART_BLOCK_RE, (_, body) => {
    const chart = parseChartBlock(body);
    return `\n\n${formatChartFallbackTable(chart)}\n\n`;
  });

  return preprocessMarkdown(text);
}

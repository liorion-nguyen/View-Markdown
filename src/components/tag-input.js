import { labelWithRequired } from '../form-validation.js';

function escapeAttr(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function normalizeTags(value) {
  return String(value)
    .split(/[,\n;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function renderTagInput({
  id,
  label,
  placeholder = 'Nhập rồi nhấn Enter...',
  hint = '',
  required = false,
  value = '',
}) {
  const tags = normalizeTags(value);

  return `
    <div class="tag-input exam-field" id="${id}" data-tag-input data-value="${escapeAttr(JSON.stringify(tags))}" ${required ? 'data-required="true"' : ''}>
      <span class="exam-field__label">${labelWithRequired(label, required)}</span>
      <div class="tag-input__control">
        <div class="tag-input__chips" data-tag-chips></div>
        <input
          type="text"
          class="tag-input__input"
          data-tag-input-field
          placeholder="${escapeAttr(placeholder)}"
          autocomplete="off"
          spellcheck="false"
        />
        <button type="button" class="tag-input__add" data-tag-add aria-label="Thêm chủ đề">+</button>
      </div>
      ${hint ? `<span class="exam-field__hint">${hint}</span>` : ''}
      <p class="exam-field__error" data-field-error role="alert" hidden></p>
    </div>
  `;
}

export function getTagInputValues(inputId) {
  const root = document.getElementById(inputId);
  if (!root) return [];

  try {
    const raw = root.dataset.value || '[]';
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((item) => String(item).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function setTagInputValues(root, tags) {
  const clean = tags.map((tag) => String(tag).trim()).filter(Boolean);
  root.dataset.value = JSON.stringify(clean);

  const chips = root.querySelector('[data-tag-chips]');
  if (!chips) return;

  chips.innerHTML = clean
    .map(
      (tag, index) => `
        <span class="tag-input__chip" data-tag-chip>
          <span class="tag-input__chip-label">${escapeAttr(tag)}</span>
          <button type="button" class="tag-input__chip-remove" data-tag-remove aria-label="Xoá ${escapeAttr(tag)}" data-tag-index="${index}">×</button>
        </span>
      `,
    )
    .join('');

  root.dispatchEvent(new CustomEvent('tagchange', { bubbles: true }));
}

function addTag(root, value) {
  const next = String(value).trim();
  if (!next) return;

  const current = getTagInputValues(root.id);
  if (current.includes(next)) return;

  setTagInputValues(root, [...current, next]);
}

function removeTag(root, index) {
  const current = getTagInputValues(root.id);
  current.splice(index, 1);
  setTagInputValues(root, current);
}

export function wireTagInput(inputId) {
  const root = document.getElementById(inputId);
  if (!root || root.dataset.tagWired === 'true') return;

  const input = root.querySelector('[data-tag-input-field]');
  const addButton = root.querySelector('[data-tag-add]');
  let isComposing = false;

  setTagInputValues(root, getTagInputValues(inputId));

  input?.addEventListener('keydown', (e) => {
    if (isComposing) return;

    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      addTag(root, input.value);
      input.value = '';
      input.focus();
    }

    if (e.key === 'Backspace' && !input.value && getTagInputValues(inputId).length) {
      const current = getTagInputValues(inputId);
      current.pop();
      setTagInputValues(root, current);
    }

    if (e.key === 'Escape') {
      input.value = '';
    }
  });

  input?.addEventListener('compositionstart', () => {
    isComposing = true;
  });

  input?.addEventListener('compositionend', () => {
    isComposing = false;
  });

  addButton?.addEventListener('click', () => {
    addTag(root, input?.value ?? '');
    if (input) {
      input.value = '';
      input.focus();
    }
  });

  input?.addEventListener('paste', (e) => {
    const text = e.clipboardData?.getData('text') || '';
    if (!text) return;

    const chunks = text.split(/[,\n;]+/).map((item) => item.trim()).filter(Boolean);
    if (chunks.length > 1) {
      e.preventDefault();
      const current = getTagInputValues(inputId);
      for (const chunk of chunks) {
        if (!current.includes(chunk)) current.push(chunk);
      }
      setTagInputValues(root, current);
      input.value = '';
    }
  });

  root.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('[data-tag-remove]');
    if (!removeBtn) return;
    const index = Number(removeBtn.dataset.tagIndex);
    if (Number.isFinite(index)) removeTag(root, index);
    input?.focus();
  });

  root.dataset.tagWired = 'true';
}
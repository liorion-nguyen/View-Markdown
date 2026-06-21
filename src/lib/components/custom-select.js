import { labelWithRequired } from '../form-validation.js';

function escapeAttr(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function normalizeOption(option) {
  if (typeof option === 'string') {
    return { value: option, label: option };
  }
  return {
    value: option.value ?? '',
    label: option.label ?? option.value ?? '',
  };
}

function findOptionLabel(options, value) {
  const match = options.map(normalizeOption).find((opt) => opt.value === value);
  return match?.label ?? value;
}

/**
 * Combobox: mở dropdown thì ô nhập nằm ngay đầu danh sách, bên dưới là các gợi ý.
 * @param {{
 *   id: string;
 *   label: string;
 *   options: Array<string | { value: string; label: string }>;
 *   selected?: string;
 *   customPlaceholder?: string;
 *   hint?: string;
 *   required?: boolean;
 *   optgroupLabel?: string;
 * }} config
 */
export function renderCustomSelect({
  id,
  label,
  options,
  selected = '',
  customPlaceholder = 'Tự nhập...',
  hint = '',
  required = false,
  optgroupLabel = 'Gợi ý',
}) {
  const normalized = options.map(normalizeOption);
  const initialLabel = findOptionLabel(normalized, selected);

  const optionHtml = normalized
    .map((opt) => {
      const isActive = opt.value === selected ? ' is-active' : '';
      return `<button type="button" class="combo-select__option${isActive}" data-combo-option data-value="${escapeAttr(opt.value)}">${escapeAttr(opt.label)}</button>`;
    })
    .join('');

  return `
    <div
      class="combo-select exam-field"
      id="${id}"
      data-combo-select
      data-value="${escapeAttr(selected)}"
      ${required ? 'data-required="true"' : ''}
    >
      <span class="exam-field__label">${labelWithRequired(label, required)}</span>
      <div class="combo-select__control">
        <button
          type="button"
          class="combo-select__trigger"
          data-combo-trigger
          aria-haspopup="listbox"
          aria-expanded="false"
        >
          <span class="combo-select__value" data-combo-display>${escapeAttr(initialLabel)}</span>
          <svg class="combo-select__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="combo-select__panel hidden" data-combo-panel role="listbox">
          <div class="combo-select__custom" data-combo-custom-row>
            <input
              type="text"
              class="combo-select__input"
              data-combo-input
              placeholder="${escapeAttr(customPlaceholder)}"
              autocomplete="off"
            />
          </div>
          <div class="combo-select__group">
            <div class="combo-select__group-label">${escapeAttr(optgroupLabel)}</div>
            ${optionHtml}
          </div>
        </div>
      </div>
      ${hint ? `<span class="exam-field__hint">${hint}</span>` : ''}
      <p class="exam-field__error" data-field-error role="alert" hidden></p>
    </div>`;
}

/** @param {string} selectId */
export function getCustomSelectValue(selectId) {
  const root = document.getElementById(selectId);
  return root?.dataset.value?.trim() ?? '';
}

/** @param {string} selectId @param {string} value @param {string} [displayLabel] */
export function setCustomSelectValue(selectId, value, displayLabel) {
  const root = document.getElementById(selectId);
  if (!root) return;
  setComboValue(root, value, displayLabel ?? value);
}

function setComboValue(root, value, displayLabel) {
  root.dataset.value = value;
  const display = root.querySelector('[data-combo-display]');
  if (display) display.textContent = displayLabel;

  const panel = root._panel || root.querySelector('[data-combo-panel]');
  panel?.querySelectorAll('[data-combo-option]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.value === value);
  });
}

function closeCombo(root) {
  const panel = root._panel;
  const input = root._input;
  const trigger = root._trigger;

  const text = input?.value.trim();
  if (text) {
    setComboValue(root, text, text);
    if (input) input.value = '';
    root.dispatchEvent(new CustomEvent('combovaluechange', { bubbles: true }));
  }

  panel?.classList.add('hidden');
  panel?.removeAttribute('style');
  root.classList.remove('is-open');
  trigger?.setAttribute('aria-expanded', 'false');

  // Restore panel to its original position in DOM
  if (panel && root._originalParent && panel.parentNode === document.body) {
    root._originalParent.appendChild(panel);
  }

  // Cleanup scroll/resize listeners
  if (root._reposition) {
    window.removeEventListener('scroll', root._reposition, { capture: true });
    window.removeEventListener('resize', root._reposition);
    root._reposition = null;
  }
}

function positionPanel(trigger, panel) {
  const rect = trigger.getBoundingClientRect();
  const panelHeight = Math.min(panel.scrollHeight, 256); // max-height 16rem ≈ 256px
  const spaceBelow = window.innerHeight - rect.bottom - 8;
  const spaceAbove = rect.top - 8;

  panel.style.position = 'fixed';
  panel.style.left = `${rect.left}px`;
  panel.style.width = `${rect.width}px`;
  panel.style.maxHeight = '16rem';
  panel.style.zIndex = '999999'; // ensure it is above everything since it's on body now

  if (spaceBelow >= Math.min(panelHeight, 150) || spaceBelow >= spaceAbove) {
    // Open downward
    panel.style.top = `${rect.bottom + 4}px`;
    panel.style.bottom = '';
  } else {
    // Flip upward
    panel.style.bottom = `${window.innerHeight - rect.top + 4}px`;
    panel.style.top = '';
  }
}

function openCombo(root) {
  const panel = root._panel;
  const trigger = root._trigger;
  const input = root._input;

  document.querySelectorAll('[data-combo-select]').forEach((other) => {
    if (other !== root) closeCombo(other);
  });

  root.classList.add('is-open');
  panel?.classList.remove('hidden');
  trigger?.setAttribute('aria-expanded', 'true');

  if (trigger && panel) {
    // Append to body to escape container clip / transforms
    if (panel.parentNode !== document.body) {
      if (!root._originalParent) {
        root._originalParent = panel.parentNode;
      }
      document.body.appendChild(panel);
    }

    positionPanel(trigger, panel);

    // Reposition on scroll or resize while open
    const reposition = () => {
      if (!root.classList.contains('is-open')) return;
      positionPanel(trigger, panel);
    };
    root._reposition = reposition;
    window.addEventListener('scroll', reposition, { passive: true, capture: true });
    window.addEventListener('resize', reposition, { passive: true });
  }

  input?.focus();
}

/** @param {string} selectId */
export function wireCustomSelect(selectId) {
  const root = document.getElementById(selectId);
  if (!root || root.dataset.comboWired === 'true') return;

  const trigger = root.querySelector('[data-combo-trigger]');
  const panel = root.querySelector('[data-combo-panel]');
  const input = root.querySelector('[data-combo-input]');

  // Store references on root
  root._panel = panel;
  root._input = input;
  root._trigger = trigger;

  trigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = panel && !panel.classList.contains('hidden');
    if (isOpen) closeCombo(root);
    else openCombo(root);
  });

  panel?.querySelectorAll('[data-combo-option]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const value = btn.dataset.value ?? '';
      const label = btn.textContent?.trim() ?? value;
      setComboValue(root, value, label);
      if (input) input.value = '';
      closeCombo(root);
      trigger?.focus();
      root.dispatchEvent(new CustomEvent('combovaluechange', { bubbles: true }));
    });
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const text = input.value.trim();
      if (text) {
        setComboValue(root, text, text);
        input.value = '';
        closeCombo(root);
        trigger?.focus();
        root.dispatchEvent(new CustomEvent('combovaluechange', { bubbles: true }));
      }
    }
    if (e.key === 'Escape') {
      if (input) input.value = '';
      closeCombo(root);
      trigger?.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (!root.contains(e.target) && !panel?.contains(e.target)) closeCombo(root);
  });

  root.dataset.comboWired = 'true';
}

/** @param {string[]} selectIds */
export function wireCustomSelects(selectIds) {
  for (const id of selectIds) {
    wireCustomSelect(id);
  }
}

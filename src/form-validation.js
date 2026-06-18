export const REQUIRED_MARK = '<span class="exam-field__required" aria-hidden="true">*</span>';

/** @param {string} label */
export function labelWithRequired(label, required = false) {
  return required ? `${label} ${REQUIRED_MARK}` : label;
}

/** @param {string | HTMLElement} field */
function getFieldRoot(field) {
  if (typeof field === 'string') {
    const el = document.getElementById(field);
    return el?.closest('.exam-field, .combo-select, .exam-field-group') ?? null;
  }
  return field.closest('.exam-field, .combo-select, .exam-field-group');
}

/** @param {string | HTMLElement} field */
export function setFieldError(field, message) {
  const root = getFieldRoot(field);
  if (!root) return;

  let err = root.querySelector('[data-field-error]');
  if (!err) {
    err = document.createElement('p');
    err.className = 'exam-field__error';
    err.dataset.fieldError = '';
    err.setAttribute('role', 'alert');
    root.appendChild(err);
  }

  err.textContent = message;
  err.hidden = false;
  root.classList.add('is-invalid');
}

/** @param {string | HTMLElement} field */
export function clearFieldError(field) {
  const root = getFieldRoot(field);
  if (!root) return;

  const err = root.querySelector('[data-field-error]');
  if (err) {
    err.textContent = '';
    err.hidden = true;
  }
  root.classList.remove('is-invalid');
}

/** @param {HTMLFormElement | null} form */
export function clearFormErrors(form) {
  form?.querySelectorAll('.is-invalid').forEach((root) => {
    root.classList.remove('is-invalid');
    const err = root.querySelector('[data-field-error]');
    if (err) {
      err.textContent = '';
      err.hidden = true;
    }
  });
}

export function focusFirstInvalidField() {
  const first = document.querySelector('.is-invalid');
  first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const focusable = first?.querySelector(
    'input, select, textarea, button[data-combo-trigger]',
  );
  focusable?.focus({ preventScroll: true });
}

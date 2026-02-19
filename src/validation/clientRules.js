/**
 * Rule-based client-side validation. Rules are NOT authoritative.
 * They may change between renders or submissions (e.g. loaded from config, A/B test, or time).
 *
 * Each rule is a function: (fieldName, value, allValues) => errorMessage | null
 * Rules are stored in a registry so they can be replaced at runtime.
 */

// Default rule implementations (used when no override is set). Exported for runtime reset.
export const defaultEmailRule = (_, value) => {
  const v = (value ?? '').trim();
  if (!v) return 'Email is required';
  // Simple format check only; server may still reject (e.g. domain).
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(v) ? null : 'Enter a valid email address';
};

const defaultAmountRule = (_, value) => {
  if (value === '' || value === undefined) return 'Amount is required';
  const n = Number(value);
  if (Number.isNaN(n)) return 'Amount must be a number';
  // Client might say 0–5000; server says 1–1000. Rules can drift.
  if (n < 0) return 'Amount cannot be negative';
  if (n > 5000) return 'Amount cannot exceed 5000';
  return null;
};

const defaultNameRule = (_, value) => {
  const v = (value ?? '').trim();
  if (!v) return 'Name is required';
  return null;
};

/** Looser email rule: only "required". Used to demonstrate runtime rule change. */
export const looseEmailRule = (_, value) => ((value ?? '').trim() ? null : 'Email is required');

// Mutable registry: current rules per field. Can be replaced at runtime.
const rules = {
  email: defaultEmailRule,
  amount: defaultAmountRule,
  name: defaultNameRule,
};

/**
 * Run current client rules for all fields. Returns { fieldName: errorMessage }.
 * Only includes fields with an error. Caller must not treat this as authoritative.
 */
export function runClientValidation(values) {
  const errors = {};
  for (const field of Object.keys(rules)) {
    const message = rules[field](field, values[field], values);
    if (message) errors[field] = message;
  }
  return errors;
}

/**
 * Run client validation for a single field. Used when input changes to clear only that field's client error.
 */
export function runClientValidationForField(fieldName, value, allValues) {
  const rule = rules[fieldName];
  if (!rule) return null;
  return rule(fieldName, value, allValues);
}

/**
 * Replace the validation rule for a field. Demonstrates runtime rule updates.
 * Example: setClientRule('email', (_, v) => !v?.trim() ? 'Required' : null) for a looser rule.
 */
export function setClientRule(fieldName, ruleFn) {
  if (ruleFn && typeof ruleFn === 'function') {
    rules[fieldName] = ruleFn;
  }
}

/**
 * Get current rule for a field (for debugging or UI that shows "current rule").
 */
export function getClientRule(fieldName) {
  return rules[fieldName];
}

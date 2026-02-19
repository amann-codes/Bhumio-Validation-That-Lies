/**
 * Mock form submission API for "Validation That Lies".
 *
 * Server is the source of truth. It may:
 * - Reject inputs that passed client validation (e.g. domain not allowed, over limit).
 * - Accept inputs that failed client validation (simulates rule drift).
 *
 * Returns structured errors per field. Never mutates caller state.
 */

function delay(ms = 400) {
  return new Promise((r) => setTimeout(r, ms));
}

// Server-side rules (deliberately different from client rules).
const ALLOWED_EMAIL_DOMAINS = ['example.com', 'allowed.org'];
const SERVER_AMOUNT_MIN = 1;
const SERVER_AMOUNT_MAX = 1000;
const SERVER_REQUIRED_NAME_MIN_LENGTH = 2;

/**
 * Validates payload on the server. Returns { success: true } or { success: false, errors: { field: message } }.
 * Designed to contradict client validation: reject some valid-looking inputs, accept some client-invalid ones.
 */
function validateOnServer(payload) {
  const errors = {};

  // Email: server may reject domains that client accepted (e.g. client only checks format).
  const email = (payload.email || '').trim();
  if (!email) {
    errors.email = 'Email is required';
  } else {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain || !ALLOWED_EMAIL_DOMAINS.includes(domain)) {
      errors.email = 'Email domain not allowed';
    }
  }

  // Numeric: server has its own min/max (e.g. 1–1000). Client rules may differ or change.
  const amount = payload.amount;
  const num = amount === '' || amount === undefined ? NaN : Number(amount);
  if (Number.isNaN(num)) {
    errors.amount = 'Amount must be a number';
  } else if (num < SERVER_AMOUNT_MIN) {
    errors.amount = 'Amount must be at least ' + SERVER_AMOUNT_MIN;
  } else if (num > SERVER_AMOUNT_MAX) {
    errors.amount = 'Value exceeds server limit';
  }

  // Required text: server may require min length; client might not, or might change.
  const name = (payload.name || '').trim();
  if (name.length < SERVER_REQUIRED_NAME_MIN_LENGTH) {
    errors.name = name.length === 0 ? 'Name is required' : 'Name must be at least ' + SERVER_REQUIRED_NAME_MIN_LENGTH + ' characters';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  return { success: true };
}

/**
 * Submits form data to the mock server.
 * @param {{ email: string, amount: string|number, name: string }} payload
 * @returns {Promise<{ success: boolean, errors?: Record<string, string> }>}
 */
export async function submitForm(payload) {
  await delay(300 + Math.floor(Math.random() * 400));

  const normalized = {
    email: payload.email ?? '',
    amount: payload.amount,
    name: payload.name ?? '',
  };

  return validateOnServer(normalized);
}

# Validation That Lies — Explanation

This document explains how the implementation satisfies the assignment requirements: client vs server validation, state isolation, error handling, and preservation of user input.

---

## 1. How client-side validation rules are defined and updated

**Definition:** Client rules live in `src/validation/clientRules.js`. Each rule is a function:

- **Signature:** `(fieldName, value, allValues) => errorMessage | null`
- Rules are stored in a **mutable registry** (`rules` object) keyed by field name.
- Default rules are provided for `email`, `amount`, and `name` (e.g. format check for email, numeric range for amount, required check for name).

**Updates at runtime:** The module exports `setClientRule(fieldName, ruleFn)`. Any code (e.g. a feature flag, A/B test, or config loader) can replace the rule for a field at any time. The next validation run (on blur or submit) uses the **current** rule, not a snapshot. So:

- Rules can **change between renders** (e.g. after an effect that loads config).
- Rules can **change between submissions** (e.g. after a timer or user action that calls `setClientRule`).

Validation is **rule-based**: we do not hardcode conditionals in the form component; we call `runClientValidation(values)` or `runClientValidationForField(...)`, which read from the registry. This keeps the form agnostic to the actual rules and allows rules to be swapped without touching the UI.

---

## 2. Why client validation cannot be trusted

- **Server is the source of truth.** The mock server in `src/api/mockFormApi.js` applies its own rules (e.g. allowed email domains `@example.com`, `@allowed.org`; amount 1–1000; name min length 2). The client does not enforce these exactly and may never do so.
- **Client rules can change.** Because rules are in a mutable registry and can be updated at runtime, the client might accept something now and reject it after a rule change (or the opposite). So any "pass" on the client is only a best-effort hint, not a guarantee.
- **Intentional contradiction in the mock:** The server is implemented to **reject** some inputs that pass client validation (e.g. valid-looking email with wrong domain; amount in client range but over server limit) and could be extended to **accept** some inputs that the client currently rejects (e.g. if we relaxed a server rule or tightened a client rule). This models "validation that lies": the two sides are independent and can disagree.

Therefore the UI and state model never treat client validation as authoritative; they only use it to block submission and show immediate feedback, while server errors are what we display after submit and what we treat as the real outcome.

---

## 3. How server errors are merged without overwriting client errors

We **do not merge** client and server errors into one structure. They are stored and rendered **separately**:

- **State:** `clientErrors` and `serverErrors` are separate state objects in `useValidationForm` (see `src/hooks/useValidationForm.js`).
- **Submission flow:** On submit we run client validation and set `clientErrors`. If client validation fails, we never call the server. If it passes, we set `submissionState = 'submitting'` and clear **only** `serverErrors` (so we don't show stale server errors from a previous attempt). We do **not** clear `clientErrors` or `values`.
- **On server response:** If the server returns errors, we set `serverErrors` to `result.errors`. We never write server errors into `clientErrors` or vice versa. So server errors **override success** (we show them and keep form submittable again) but **never overwrite** client errors; both can be present at once.
- **Rendering:** The form component renders `clientErrors.email` and `serverErrors.email` (and same for other fields) as separate inline messages (with distinct classes, e.g. `client-error` vs `server-error`). So the user sees both sources of errors without conflating them.

---

## 4. How user input is preserved on all failure paths

- **Values are never cleared on validation failure.** The only state we update on submit are: `clientErrors`, `serverErrors`, and `submissionState`. We never set `values` to initial state or to empty when the server (or client) returns errors.
- **On client validation failure:** We set `clientErrors` and return without submitting. `values` are unchanged.
- **On server validation failure:** We set `serverErrors` and set `submissionState` back to `'idle'`. `values` are not touched; the form stays filled.
- **On network/exception:** We set a form-level `serverErrors._form` and set `submissionState` to `'idle'`. Again, `values` are not modified.
- Inputs are controlled: `value={values.email}` etc., so the only way the field content changes is through `setField`, which is only called from user input. No code path on failure calls `setField` or `setValues` to clear or reset the form. So **user input is preserved on every failure path**.

---

## 5. How error state is scoped and cleared correctly

- **Scoping:** Errors are keyed by field (`clientErrors.email`, `serverErrors.amount`, etc.). So each field has its own client and server error (and optionally a form-level `serverErrors._form`).

- **Clearing client errors:**  
  - When the user **changes a field**, we clear **only that field's** client error (in `setField` we do `delete next[name]` from `clientErrors`). Other fields' client errors are left as-is.  
  - On **successful** submit we clear all client errors.

- **Clearing server errors:**  
  - When the user **changes a field**, we clear **only that field's** server error (in `setField` we do `delete next[name]` from `serverErrors`). So fixing one field and resubmitting doesn't leave stale server errors on that field; other fields' server errors remain until the user edits those fields or resubmits.  
  - Before **each new submit** we clear the whole `serverErrors` object so we don't show previous run's server errors while the new request is in flight.  
  - On **successful** submit we clear all server errors.

- **Independence:** Clearing a client error does not clear the server error for that field, and clearing a server error does not clear the client error. So client and server errors are **cleared independently**, and only the **relevant** (that field's) errors are cleared on input change; unrelated errors are not wiped.

---

## Summary of state and failure handling

| State              | Role |
|--------------------|------|
| `values`           | User input; never cleared on validation failure. |
| `clientErrors`      | Result of current client rules; blocks submit; cleared per field on edit, all on success. |
| `serverErrors`      | Last server response errors; shown after submit; cleared per field on edit, all before new submit and on success. |
| `submissionState`   | `'idle' \| 'submitting' \| 'success'`; drives loading/disabled and success message. |

The implementation treats validation as **adversarial**: client and server can contradict each other; state is isolated; input is preserved; and errors are stored, rendered, and cleared separately so that trust boundaries and failure paths are handled correctly.

/**
 * Form UI for "Validation That Lies".
 * Renders client and server errors separately; preserves all user input on any failure.
 */

import React from 'react';
import { useValidationForm } from '../hooks/useValidationForm';
import { setClientRule, looseEmailRule, defaultEmailRule } from '../validation/clientRules';

export function ValidationForm() {
  const {
    values,
    setField,
    clientErrors,
    serverErrors,
    submissionState,
    handleSubmit,
    runClientValidationNow,
  } = useValidationForm();

  const isSubmitting = submissionState === 'submitting';
  const isSuccess = submissionState === 'success';

  // Show client errors on blur so user sees them immediately (client rules may have changed).
  const handleBlur = () => runClientValidationNow();

  // Demo: toggle email rule at runtime (strict format vs loose required-only).
  const [emailRuleStrict, setEmailRuleStrict] = React.useState(true);
  const toggleEmailRule = () => {
    setClientRule('email', emailRuleStrict ? looseEmailRule : defaultEmailRule);
    setEmailRuleStrict((prev) => !prev);
    runClientValidationNow();
  };

  return (
    <div className="validation-form-wrap">
      <h1 className="form-title">Validation That Lies</h1>
      <p className="form-description">
        Client and server validation are independent. Server may reject valid-looking input or accept
        what client rejected. All input is preserved on errors.
      </p>

      {isSuccess && (
        <div className="form-success" role="alert">
          Form submitted successfully.
        </div>
      )}

      <form onSubmit={handleSubmit} className="validation-form" noValidate>
        {/* Email */}
        <div className="field-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            value={values.email}
            onChange={(e) => setField('email', e.target.value)}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={!!(clientErrors.email || serverErrors.email)}
            aria-describedby={[clientErrors.email && 'email-client-err', serverErrors.email && 'email-server-err'].filter(Boolean).join(' ') || undefined}
          />
          {clientErrors.email && (
            <span id="email-client-err" className="error client-error" role="alert">
              {clientErrors.email}
            </span>
          )}
          {serverErrors.email && (
            <span id="email-server-err" className="error server-error" role="alert">
              {serverErrors.email}
            </span>
          )}
        </div>

        {/* Amount (numeric) */}
        <div className="field-group">
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            name="amount"
            value={values.amount}
            onChange={(e) => setField('amount', e.target.value)}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={!!(clientErrors.amount || serverErrors.amount)}
            aria-describedby={[clientErrors.amount && 'amount-client-err', serverErrors.amount && 'amount-server-err'].filter(Boolean).join(' ') || undefined}
          />
          {clientErrors.amount && (
            <span id="amount-client-err" className="error client-error" role="alert">
              {clientErrors.amount}
            </span>
          )}
          {serverErrors.amount && (
            <span id="amount-server-err" className="error server-error" role="alert">
              {serverErrors.amount}
            </span>
          )}
        </div>

        {/* Required text: Name */}
        <div className="field-group">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            name="name"
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={!!(clientErrors.name || serverErrors.name)}
            aria-describedby={[clientErrors.name && 'name-client-err', serverErrors.name && 'name-server-err'].filter(Boolean).join(' ') || undefined}
          />
          {clientErrors.name && (
            <span id="name-client-err" className="error client-error" role="alert">
              {clientErrors.name}
            </span>
          )}
          {serverErrors.name && (
            <span id="name-server-err" className="error server-error" role="alert">
              {serverErrors.name}
            </span>
          )}
        </div>

        {serverErrors._form && (
          <div className="error server-error form-level" role="alert">
            {serverErrors._form}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </form>

      <aside className="form-hints">
        <p><strong>Server rules (for testing):</strong></p>
        <ul>
          <li>Email: only <code>@example.com</code> or <code>@allowed.org</code> accepted.</li>
          <li>Amount: 1–1000 (client may show different range).</li>
          <li>Name: at least 2 characters.</li>
        </ul>
        <p style={{ marginTop: '1rem' }}>
          <strong>Runtime rule demo:</strong>{' '}
          <button type="button" className="rule-toggle-btn" onClick={toggleEmailRule}>
            Use {emailRuleStrict ? 'loose' : 'strict'} email rule
          </button>
          {' '}(client rules can change at runtime; server still applies its own.)
        </p>
      </aside>
    </div>
  );
}

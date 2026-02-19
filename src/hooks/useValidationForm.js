/**
 * Form state for "Validation That Lies".
 *
 * State is split so that:
 * - values: user input (never cleared by server or client errors)
 * - clientErrors: result of current client rules (may change; not authoritative)
 * - serverErrors: from last submission response (source of truth for server)
 * - submissionState: 'idle' | 'submitting' | 'success'
 *
 * Client and server errors are stored and cleared independently.
 * Changing a field clears only that field's client error (and optionally that field's server error).
 */

import { useState, useCallback } from 'react';
import { runClientValidation } from '../validation/clientRules';
import { submitForm } from '../api/mockFormApi';

const initialValues = { email: '', amount: '', name: '' };

export function useValidationForm() {
  const [values, setValues] = useState(initialValues);
  const [clientErrors, setClientErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [submissionState, setSubmissionState] = useState('idle'); // 'idle' | 'submitting' | 'success'

  const setField = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear only this field's client error when user edits (unrelated errors stay).
    setClientErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    // Clear this field's server error on edit so user can resubmit and get fresh server response.
    setServerErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const runClientValidationNow = useCallback(() => {
    const errors = runClientValidation(values);
    setClientErrors(errors);
    return errors;
  }, [values]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const errors = runClientValidation(values);
      setClientErrors(errors);

      if (Object.keys(errors).length > 0) {
        return; // Block submission while client reports errors (client rules are unstable but we still block).
      }

      setSubmissionState('submitting');
      setServerErrors({}); // Clear previous server errors before new attempt; do not touch values or clientErrors.

      try {
        const result = await submitForm(values);
        if (result.success) {
          setSubmissionState('success');
          setClientErrors({});
          setServerErrors({});
          // Optionally clear form: setValues(initialValues);
        } else {
          setSubmissionState('idle');
          setServerErrors(result.errors || {});
          // Never clear values or overwrite clientErrors with server errors; keep both separate.
        }
      } catch (err) {
        setSubmissionState('idle');
        setServerErrors({ _form: err.message || 'Submission failed' });
      }
    },
    [values]
  );

  return {
    values,
    setField,
    clientErrors,
    serverErrors,
    submissionState,
    handleSubmit,
    runClientValidationNow,
  };
}

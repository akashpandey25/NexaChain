import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Standard reusable class strings for inputs, selects, and textareas.
 * Adheres to institutional fintech design tokens.
 */
export const inputBaseClasses =
  'w-full h-10 px-3.5 py-2 bg-surface-canvas border border-border-subtle hover:border-border-strong focus:border-semantic-focus focus:ring-1 focus:ring-semantic-focus focus:outline-none rounded-input text-text-primary placeholder:text-text-muted text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const inputErrorClasses =
  'border-semantic-danger focus:border-semantic-danger focus:ring-semantic-danger';

/**
 * FormField Component
 * Accessible input container with semantic labels, error states, and helper hints.
 */
export const FormField = ({
  id,
  label,
  error,
  helperText,
  hint,
  required = false,
  children,
  className = ''
}) => {
  const effectiveHint = helperText || hint;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium text-text-secondary select-none"
        >
          {label}
          {required && (
            <span className="text-semantic-danger ml-1 font-semibold" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {children}

      {error && (
        <p
          id={id ? `${id}-error` : undefined}
          className="text-xs text-semantic-danger font-medium mt-1 flex items-center gap-1.5"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      {!error && effectiveHint && (
        <p
          id={id ? `${id}-helper` : undefined}
          className="text-xs text-text-muted mt-1 leading-normal"
        >
          {effectiveHint}
        </p>
      )}
    </div>
  );
};

export default FormField;

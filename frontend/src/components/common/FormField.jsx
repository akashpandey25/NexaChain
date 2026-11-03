import React from 'react';

/**
 * FormField Component
 * Accessible input container with label, validation error feedback, and helper text.
 */
export const FormField = ({
  id,
  label,
  error,
  helperText,
  required = false,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-slate-300">
          {label}
          {required && <span className="text-rose-400 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      {children}

      {error && (
        <p id={`${id}-error`} className="text-xs text-rose-400 mt-1 font-medium" role="alert">
          {error}
        </p>
      )}

      {!error && helperText && (
        <p id={`${id}-helper`} className="text-xs text-slate-500 mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default FormField;

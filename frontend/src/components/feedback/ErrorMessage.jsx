import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { AppButton } from '../common/AppButton';

/**
 * ErrorMessage Component
 * Standardized alert banner with semantic tokens and optional retry action.
 */
export const ErrorMessage = ({
  title = 'Something went wrong',
  message,
  errors = null,
  onRetry,
  className = ''
}) => {
  if (!message && (!errors || errors.length === 0)) return null;

  return (
    <div
      role="alert"
      className={`rounded-card bg-semantic-danger/10 border border-semantic-danger/30 p-4 text-text-primary text-xs sm:text-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-semantic-danger shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 space-y-1.5">
          {title && <h4 className="font-semibold text-semantic-danger">{title}</h4>}
          {message && <p className="text-text-secondary leading-relaxed">{message}</p>}

          {/* Validation error list if returned from backend */}
          {Array.isArray(errors) && errors.length > 0 && (
            <ul className="mt-2 list-disc list-inside space-y-0.5 text-xs text-text-secondary">
              {errors.map((err, idx) => (
                <li key={idx}>
                  {err.field ? <span className="font-semibold text-text-primary">{err.field}: </span> : null}
                  {err.message || String(err)}
                </li>
              ))}
            </ul>
          )}
        </div>
        {onRetry && (
          <AppButton
            type="button"
            variant="destructive"
            size="sm"
            onClick={onRetry}
            icon={RefreshCw}
            className="shrink-0"
          >
            Retry
          </AppButton>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;

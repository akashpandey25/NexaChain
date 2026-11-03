import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * ErrorMessage Component
 * Accessible alert banner for displaying server and validation errors with optional retry.
 */
export const ErrorMessage = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className = ''
}) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`rounded-lg bg-rose-950/40 border border-rose-800/60 p-4 text-rose-200 text-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 space-y-1">
          {title && <h4 className="font-semibold text-rose-300">{title}</h4>}
          <p className="text-rose-200/90 leading-relaxed">{message}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-900/60 hover:bg-rose-900 text-rose-200 text-xs font-medium border border-rose-700/50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Retry</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;

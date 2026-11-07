import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * EmptyState Component
 * Standardized empty feedback view with semantic surface tokens and typography.
 * Supports either a custom action React element or actionText + onAction callback.
 * 
 * @param {object} props
 * @param {React.ComponentType} [props.icon]
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.action] Custom action element
 * @param {string} [props.actionText] Button label
 * @param {Function} [props.onAction] Button click handler
 * @param {string} [props.className]
 */
export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There is currently no data available for this view.',
  action = null,
  actionText,
  onAction,
  className = ''
}) => {
  const renderedAction =
    action ||
    (actionText && onAction ? (
      <button
        type="button"
        onClick={onAction}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-button text-xs font-semibold bg-brand-primary hover:bg-brand-hover active:bg-emerald-700 text-brand-primary-foreground shadow-sm transition-all"
      >
        {actionText}
      </button>
    ) : null);

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-card bg-surface-card border border-border-subtle ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center text-text-secondary mb-4">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {renderedAction && <div>{renderedAction}</div>}
    </div>
  );
};

export default EmptyState;

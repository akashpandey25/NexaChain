import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * EmptyState Component
 * Displays helpful feedback when lists, transactions, or datasets have zero items.
 */
export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There is currently no data available for this view.',
  action = null,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800/80 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-slate-800/70 border border-slate-700/50 flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;

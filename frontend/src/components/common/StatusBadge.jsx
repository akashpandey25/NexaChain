import React from 'react';
import { getStatusStyle } from '../../utils/formatters';

/**
 * StatusBadge Component
 * Standardized status pill with dot indicator and semantic tokens.
 * 
 * @param {object} props
 * @param {string} props.status Status key ('active', 'pending', 'completed', 'cancelled', 'failed', etc.)
 * @param {boolean} [props.showDot=true] Whether to display the circular status indicator dot
 * @param {string} [props.label] Custom label override
 * @param {string} [props.size='sm'] Size variant: 'sm' (default table/card badge) or 'md'
 * @param {string} [props.className=''] Custom CSS classes
 */
export const StatusBadge = ({
  status,
  showDot = true,
  label: customLabel,
  size = 'sm',
  className = ''
}) => {
  const style = getStatusStyle(status);
  const sizeClasses =
    size === 'sm'
      ? 'text-[11px] px-2.5 py-0.5'
      : 'text-xs px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${style.badge} ${sizeClasses} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`}
          aria-hidden="true"
        />
      )}
      <span>{customLabel || style.label}</span>
    </span>
  );
};

export default StatusBadge;

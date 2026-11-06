import React from 'react';

/**
 * PageHeader Component
 * Standardized institutional page heading with title, subtitle, optional breadcrumbs/badges,
 * and responsive action controls. Eliminates aggressive uppercase shouting and enforces
 * semantic typography tokens.
 */
export const PageHeader = ({
  title,
  subtitle,
  actions,
  badge = null,
  breadcrumb = null,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 mb-6 border-b border-border-subtle ${className}`}
    >
      <div className="space-y-1">
        {breadcrumb && (
          <div className="text-xs text-text-muted mb-1 flex items-center gap-1.5">
            {breadcrumb}
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            {title}
          </h1>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>

        {subtitle && (
          <p className="text-xs sm:text-sm text-text-secondary max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;

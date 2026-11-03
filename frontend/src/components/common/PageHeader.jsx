import React from 'react';

/**
 * PageHeader Component
 * Provides responsive titles, subtitles, breadcrumb navigation, and page-level actions.
 */
export const PageHeader = ({
  title,
  subtitle,
  actions,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800 ${className}`}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
};

export default PageHeader;

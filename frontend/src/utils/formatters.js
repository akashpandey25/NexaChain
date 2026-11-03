/**
 * Formatting Utilities for NexaChain
 * 
 * Handles strict conversion of integer paise to Indian Rupees (INR),
 * regional Indian number formatting, date/time localization, and status badges.
 */

/**
 * Format integer paise into localized Indian Rupee currency string.
 * Strict financial precision: 1 Rupee = 100 Paise.
 * 
 * @param {number|null|undefined} paise Amount in integer paise
 * @param {object} [options] Intl.NumberFormat options
 * @returns {string} Formatted currency string (e.g. "₹1,50,000.00")
 */
export const formatPaiseToINR = (paise = 0, options = {}) => {
  const safePaise = typeof paise === 'number' && !isNaN(paise) ? paise : 0;
  const rupees = safePaise / 100;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(rupees);
};

/**
 * Format integer paise into compact Indian Rupee notation for KPI cards.
 * 
 * @param {number|null|undefined} paise Amount in integer paise
 * @returns {string} Compact currency string (e.g. "₹1.5L")
 */
export const formatPaiseToINRCompact = (paise = 0) => {
  const safePaise = typeof paise === 'number' && !isNaN(paise) ? paise : 0;
  const rupees = safePaise / 100;

  if (rupees >= 10000000) {
    return `₹${(rupees / 10000000).toFixed(2)} Cr`;
  }
  if (rupees >= 100000) {
    return `₹${(rupees / 100000).toFixed(2)} L`;
  }
  if (rupees >= 1000) {
    return `₹${(rupees / 1000).toFixed(1)}k`;
  }

  return formatPaiseToINR(safePaise);
};

/**
 * Format integer or decimal numbers with Indian numbering grouping (lakhs/crores).
 * 
 * @param {number|null|undefined} num Number to format
 * @returns {string} Formatted number string (e.g. "1,25,000")
 */
export const formatIndianNumber = (num = 0) => {
  const safeNum = typeof num === 'number' && !isNaN(num) ? num : 0;
  return new Intl.NumberFormat('en-IN').format(safeNum);
};

/**
 * Format an ISO date string or timestamp into readable date representation.
 * 
 * @param {string|Date|number|null|undefined} dateInput Date input
 * @param {object} [options] Intl.DateTimeFormat options
 * @returns {string} Formatted date (e.g. "03 Nov 2026")
 */
export const formatDate = (dateInput, options = {}) => {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';

    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...options
    }).format(d);
  } catch (err) {
    return '—';
  }
};

/**
 * Format an ISO date string or timestamp into short chart axis label.
 * 
 * @param {string|Date|null|undefined} dateInput Date input
 * @returns {string} Formatted chart date (e.g. "03 Nov")
 */
export const formatChartDate = (dateInput) => {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';

    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short'
    }).format(d);
  } catch (err) {
    return '';
  }
};

/**
 * Format an ISO date string into date + time.
 * 
 * @param {string|Date|null|undefined} dateInput Date input
 * @returns {string} Formatted datetime (e.g. "03 Nov 2026, 12:00 AM")
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';

    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch (err) {
    return '—';
  }
};

/**
 * Returns consistent Tailwind badge color styling based on investment/transaction status.
 * 
 * @param {string} status Status string ('active', 'pending', 'completed', 'cancelled')
 * @returns {{ badge: string, dot: string, label: string }}
 */
export const getStatusStyle = (status = '') => {
  const normalized = String(status).toLowerCase();

  switch (normalized) {
    case 'active':
      return {
        badge: 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60',
        dot: 'bg-emerald-400',
        label: 'ACTIVE'
      };
    case 'pending':
      return {
        badge: 'bg-amber-950/70 text-amber-400 border border-amber-800/60',
        dot: 'bg-amber-400',
        label: 'PENDING'
      };
    case 'completed':
      return {
        badge: 'bg-blue-950/70 text-blue-400 border border-blue-800/60',
        dot: 'bg-blue-400',
        label: 'COMPLETED'
      };
    case 'cancelled':
      return {
        badge: 'bg-rose-950/70 text-rose-400 border border-rose-800/60',
        dot: 'bg-rose-400',
        label: 'CANCELLED'
      };
    case 'processed':
      return {
        badge: 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60',
        dot: 'bg-emerald-400',
        label: 'PROCESSED'
      };
    default:
      return {
        badge: 'bg-slate-800 text-slate-300 border border-slate-700',
        dot: 'bg-slate-400',
        label: String(status || 'UNKNOWN').toUpperCase()
      };
  }
};

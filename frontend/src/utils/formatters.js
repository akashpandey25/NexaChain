/**
 * Formatting Utilities for NexaChain
 * 
 * Handles strict conversion of integer paise to Indian Rupees (INR),
 * regional Indian number formatting, timezone-safe business date localization,
 * and status badge styling.
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
 * Timezone-Safe Business Date Formatter.
 * 
 * The backend stores business dates normalized to UTC midnight representing the
 * calendar day in Asia/Kolkata (e.g. "2026-11-03T00:00:00.000Z" for 2026-11-03).
 * To prevent local browser timezones (such as US UTC-5) from shifting the date
 * to the previous day ("Nov 02"), this parser extracts the year-month-day components
 * directly or parses in UTC, guaranteeing the calendar day is never altered.
 * 
 * @param {string|Date|number|null|undefined} dateInput ISO date string or Date
 * @param {object} [options] Custom Intl.DateTimeFormat options
 * @returns {string} Safe formatted date (e.g. "03 Nov 2026")
 */
export const formatBusinessDate = (dateInput, options = {}) => {
  if (!dateInput) return '—';
  try {
    // If input is an ISO string with 'T', extract the calendar date part strictly
    if (typeof dateInput === 'string' && dateInput.includes('T')) {
      const datePart = dateInput.substring(0, 10); // "YYYY-MM-DD"
      const [yearStr, monthStr, dayStr] = datePart.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const day = parseInt(dayStr, 10);

      if (year && month && day) {
        const utcDate = new Date(Date.UTC(year, month - 1, day));
        return new Intl.DateTimeFormat('en-IN', {
          timeZone: 'UTC',
          day: '2-digit',
          month: 'short',
          year: options.year !== undefined ? options.year : 'numeric',
          ...options
        }).format(utcDate);
      }
    }

    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: options.year !== undefined ? options.year : 'numeric',
      ...options
    }).format(d);
  } catch (err) {
    return '—';
  }
};

/**
 * Format a business date for chart X-Axis labels without day-shifting.
 * Returns: "03 Nov"
 * 
 * @param {string|Date|null|undefined} dateInput Date input
 * @returns {string} Short chart date (e.g. "03 Nov")
 */
export const formatChartBusinessDate = (dateInput) => {
  if (!dateInput) return '';
  return formatBusinessDate(dateInput, { year: undefined });
};

/**
 * Format standard created/updated timestamps with local or Asia/Kolkata time.
 * 
 * @param {string|Date|null|undefined} dateInput Date input
 * @returns {string} Formatted date (e.g. "03 Nov 2026")
 */
export const formatDate = (dateInput, options = {}) => {
  return formatBusinessDate(dateInput, options);
};

/**
 * Format an ISO date string into date + time in Asia/Kolkata.
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
      timeZone: 'Asia/Kolkata',
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
 * @param {string} status Status string ('active', 'pending', 'completed', 'cancelled', 'processed', 'failed')
 * @returns {{ badge: string, dot: string, label: string }}
 */
export const getStatusStyle = (status = '') => {
  const normalized = String(status).toLowerCase();

  switch (normalized) {
    case 'active':
      return {
        badge: 'bg-semantic-positive/10 text-semantic-positive border border-semantic-positive/30',
        dot: 'bg-semantic-positive',
        label: 'ACTIVE'
      };
    case 'processed':
      return {
        badge: 'bg-semantic-positive/10 text-semantic-positive border border-semantic-positive/30',
        dot: 'bg-semantic-positive',
        label: 'PROCESSED'
      };
    case 'pending':
      return {
        badge: 'bg-semantic-pending/10 text-semantic-pending border border-semantic-pending/30',
        dot: 'bg-semantic-pending',
        label: 'PENDING'
      };
    case 'completed':
      return {
        badge: 'bg-surface-elevated text-text-secondary border border-border-strong',
        dot: 'bg-text-secondary',
        label: 'COMPLETED'
      };
    case 'cancelled':
      return {
        badge: 'bg-semantic-danger/10 text-semantic-danger border border-semantic-danger/30',
        dot: 'bg-semantic-danger',
        label: 'CANCELLED'
      };
    case 'failed':
      return {
        badge: 'bg-semantic-danger/10 text-semantic-danger border border-semantic-danger/30',
        dot: 'bg-semantic-danger',
        label: 'FAILED'
      };
    default:
      return {
        badge: 'bg-surface-elevated text-text-muted border border-border-subtle',
        dot: 'bg-text-muted',
        label: String(status || 'UNKNOWN').toUpperCase()
      };
  }
};

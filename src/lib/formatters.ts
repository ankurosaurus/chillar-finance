import { format, parseISO, isValid } from 'date-fns';

/**
 * Formats a number to Indian Rupee currency string.
 * Example: 12500 -> "₹12,500"
 * Example: 125000 -> "₹1,25,000"
 */
export function formatINR(amount: number, options?: { showDecimal?: boolean; showSymbol?: boolean }): string {
  const { showDecimal = false, showSymbol = true } = options || {};
  
  const absAmount = Math.abs(amount);
  const isNegative = amount < 0;

  // Format using Indian numbering system
  const formattedNumber = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: showDecimal ? 2 : 0,
    minimumFractionDigits: showDecimal ? 2 : 0,
  }).format(absAmount);

  const prefix = showSymbol ? (isNegative ? '-₹' : '₹') : (isNegative ? '-' : '');
  return `${prefix}${formattedNumber}`;
}

/**
 * Formats standard date into human readable forms.
 */
export function formatDate(dateInput: string | Date, pattern = 'd MMM yyyy'): string {
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(date)) return 'Invalid date';
    return format(date, pattern);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Formats date into day grouping label: "Today", "Yesterday", or "Fri, 2 Oct"
 */
export function formatDayGrouping(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return dateString;

    const today = new Date();
    const dateYear = date.getFullYear();
    const dateMonth = date.getMonth();
    const dateDay = date.getDate();

    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();

    if (dateYear === todayYear && dateMonth === todayMonth && dateDay === todayDay) {
      return 'Today';
    }

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (dateYear === yesterday.getFullYear() && dateMonth === yesterday.getMonth() && dateDay === yesterday.getDate()) {
      return 'Yesterday';
    }

    return format(date, 'EEE, d MMM');
  } catch {
    return dateString;
  }
}

/**
 * Formats compact numbers (e.g. 1.2k, 15k)
 */
export function formatCompactINR(amount: number): string {
  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}k`;
  }
  return formatINR(amount);
}

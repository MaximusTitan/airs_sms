import { format, formatDistanceToNow, FormatDistanceToNowOptions } from 'date-fns';

/**
 * Safely formats a date string using date-fns format function
 * @param dateString - The date string to format
 * @param formatStr - The format string to use (default: 'PPpp')
 * @returns Formatted date string or 'Invalid date' if formatting fails
 */
export const safeFormatDate = (dateString: string | Date | null | undefined, formatStr: string = 'PPpp'): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return format(date, formatStr);
  } catch {
    return 'Invalid date';
  }
};

/**
 * Safely formats a date string using date-fns formatDistanceToNow function
 * @param dateString - The date string to format
 * @param options - Format distance options (e.g., { addSuffix: true })
 * @returns Formatted relative time string or 'Invalid date' if formatting fails
 */
export const safeFormatDistanceToNow = (
  dateString: string | Date | null | undefined, 
  options?: FormatDistanceToNowOptions
): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return formatDistanceToNow(date, options);
  } catch {
    return 'Invalid date';
  }
};

/**
 * Extract date part from journal ID (handles both YYYY-MM-DD and YYYY-MM-DD-* formats)
 */
function extractDateFromJournalId(journalId: string): string {
  // If it's in the format YYYY-MM-DD-*, extract just the date part
  const dateMatch = journalId.match(/^(\d{4}-\d{2}-\d{2})/);
  return dateMatch ? dateMatch[1] : journalId;
}

/**
 * Format a date string (YYYY-MM-DD or YYYY-MM-DD-*) for display
 * Returns "Today", "Yesterday", or formatted date
 */
export function formatDateForDisplay(dateString: string): string {
  const datePart = extractDateFromJournalId(dateString);
  const date = new Date(datePart + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  
  if (dateOnly.getTime() === today.getTime()) {
    return 'Today';
  }
  
  if (dateOnly.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }
  
  // Format as "Jan 15, 2024"
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate a unique journal ID with format YYYY-MM-DD-HHMMSS
 */
export function generateJournalId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
}

/**
 * Parse a date string (YYYY-MM-DD) to Date object
 */
export function parseDateString(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}

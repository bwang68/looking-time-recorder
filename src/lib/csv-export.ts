import { formatTimestamp, sanitizeFilename } from '@/lib/utils';
import type { Trial } from '@/lib/types';

/**
 * Generate CSV content for a trial
 * Format: Trial Name, Total Duration, Interval, Start Time, End Time, Duration
 */
export function generateCSV(trial: Trial): string {
  const headers = ['Trial Name', 'Total Duration', 'Interval', 'Start Time', 'End Time', 'Duration'];
  const rows: string[] = [headers.join(',')];

  const totalDurationFormatted = formatTimestamp(trial.totalDuration);

  if (trial.intervals.length === 0) {
    // If no intervals, just add one row with trial info
    rows.push(
      `"${trial.name}","${totalDurationFormatted}","","","",""`
    );
  } else {
    // Add a row for each looking interval
    trial.intervals.forEach((interval, index) => {
      const startFormatted = formatTimestamp(interval.startTime);
      const endFormatted = formatTimestamp(interval.endTime);
      const durationFormatted = formatTimestamp(interval.endTime - interval.startTime);
      
      rows.push(
        `"${trial.name}","${totalDurationFormatted}","${index + 1}","${startFormatted}","${endFormatted}","${durationFormatted}"`
      );
    });
  }

  return rows.join('\n');
}

/**
 * Generate filename for CSV export
 * Format: trial-name_YYYY-MM-DD.csv
 */
export function generateFilename(trial: Trial): string {
  const date = new Date(trial.createdAt);
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const safeName = sanitizeFilename(trial.name);
  return `${safeName}_${dateStr}.csv`;
}

/**
 * Download trial data as a CSV file
 */
export function downloadCSV(trial: Trial): void {
  const csvContent = generateCSV(trial);
  const filename = generateFilename(trial);
  
  // Create blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}

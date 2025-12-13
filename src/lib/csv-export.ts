import { formatTimestamp, sanitizeFilename } from '@/lib/utils';
import type { Subject, Trial } from '@/lib/types';

/**
 * Generate CSV content for a subject with all their trials
 * Format: Subject ID, Trial Number, Total Duration, Interval, Start Time, End Time, Duration
 */
export function generateSubjectCSV(subject: Subject): string {
  const headers = ['Subject ID', 'Trial Number', 'Total Duration', 'Interval', 'Start Time', 'End Time', 'Duration'];
  const rows: string[] = [headers.join(',')];

  subject.trials.forEach((trial, trialIndex) => {
    const totalDurationFormatted = formatTimestamp(trial.totalDuration);
    const trialNumber = trialIndex + 1;

    if (trial.intervals.length === 0) {
      // If no intervals, just add one row with trial info
      rows.push(
        `"${subject.name}","${trialNumber}","${totalDurationFormatted}","","","",""`
      );
    } else {
      // Add a row for each looking interval
      trial.intervals.forEach((interval, index) => {
        const startFormatted = formatTimestamp(interval.startTime);
        const endFormatted = formatTimestamp(interval.endTime);
        const durationFormatted = formatTimestamp(interval.endTime - interval.startTime);
        
        rows.push(
          `"${subject.name}","${trialNumber}","${totalDurationFormatted}","${index + 1}","${startFormatted}","${endFormatted}","${durationFormatted}"`
        );
      });
    }
  });

  return rows.join('\n');
}

/**
 * Generate CSV content for a single trial (legacy support)
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
 * Generate filename for subject CSV export
 * Format: subject-name_YYYY-MM-DD.csv
 */
export function generateSubjectFilename(subject: Subject): string {
  const date = new Date(subject.createdAt);
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const safeName = sanitizeFilename(subject.name);
  return `${safeName}_${dateStr}.csv`;
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
 * Download subject data as a CSV file (all trials for the subject)
 */
export function downloadSubjectCSV(subject: Subject): void {
  const csvContent = generateSubjectCSV(subject);
  const filename = generateSubjectFilename(subject);
  
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

/**
 * Download trial data as a CSV file (legacy support)
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

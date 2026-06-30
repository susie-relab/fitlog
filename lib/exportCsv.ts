import { Activity } from '@/types';

const HEADERS = [
  'Date', 'Name', 'Exercise Type', 'Run Type', 'Duration (min)',
  'Distance (km)', 'Effort', 'Avg Pace (min/km)', 'Max Pace (min/km)',
  'Avg HR', 'Max HR', 'Intensity Mins', 'Is PB', 'PB Description', 'Notes',
];

function formatPace(v: number | null | undefined): string {
  if (!v) return '';
  const m = Math.floor(v);
  const s = Math.round((v - m) * 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function escapeCell(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return '';
  const str = String(v);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function activitiesToCsv(activities: Activity[]): string {
  const rows = activities.map(a => [
    a.date,
    a.name,
    a.exercise_type,
    a.run_type || '',
    a.duration_minutes,
    a.distance_km ?? '',
    a.effort,
    formatPace(a.pace_min_km),
    formatPace(a.max_pace_min_km),
    a.avg_hr ?? '',
    a.max_hr ?? '',
    a.intensity_minutes ?? '',
    a.is_pb ? 'Yes' : '',
    a.pb_description || '',
    a.notes || '',
  ].map(escapeCell).join(','));

  return [HEADERS.join(','), ...rows].join('\n');
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

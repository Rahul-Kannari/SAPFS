/**
 * Utility formatters for SAPFS frontend
 */

export const formatGPA = (gpa, decimals = 2) =>
  gpa !== null && gpa !== undefined ? parseFloat(gpa).toFixed(decimals) : '—';

export const formatPercent = (val, decimals = 1) =>
  val !== null && val !== undefined ? `${parseFloat(val).toFixed(decimals)}%` : '—';

export const formatDate = (date, options = {}) => {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', ...options
  });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export const formatRelativeTime = (date) => {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
  return formatDate(date);
};

export const getRiskColor = (risk) => ({
  low: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', hex: '#10b981' },
  medium: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', hex: '#f59e0b' },
  high: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', hex: '#ef4444' },
  critical: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', hex: '#7c3aed' },
})[risk] || { bg: 'bg-slate-100', text: 'text-slate-600', hex: '#94a3b8' };

export const getGPAColor = (gpa) => {
  if (gpa >= 8.5) return 'text-emerald-600 dark:text-emerald-400';
  if (gpa >= 7.0) return 'text-blue-600 dark:text-blue-400';
  if (gpa >= 6.0) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

export const getAttendanceColor = (pct) => {
  if (pct >= 85) return 'text-emerald-600';
  if (pct >= 75) return 'text-blue-600';
  if (pct >= 65) return 'text-amber-600';
  return 'text-red-600';
};

export const gradeFromMarks = (total, maxMarks = 100) => {
  const pct = (total / maxMarks) * 100;
  if (pct >= 91) return { grade: 'O',  gp: 10, color: 'text-emerald-600' };
  if (pct >= 81) return { grade: 'A+', gp: 9,  color: 'text-blue-600' };
  if (pct >= 71) return { grade: 'A',  gp: 8,  color: 'text-blue-500' };
  if (pct >= 61) return { grade: 'B+', gp: 7,  color: 'text-indigo-600' };
  if (pct >= 51) return { grade: 'B',  gp: 6,  color: 'text-amber-600' };
  if (pct >= 41) return { grade: 'C',  gp: 5,  color: 'text-orange-600' };
  return { grade: 'F', gp: 0, color: 'text-red-600' };
};

export const truncate = (str, len = 40) =>
  str && str.length > len ? `${str.slice(0, len)}…` : str;

export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

export const semesterLabel = (num) => {
  const ordinals = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
  return ordinals[num] ? `${ordinals[num]} Semester` : `Semester ${num}`;
};

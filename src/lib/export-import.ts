import { nowISO } from './utils';
import { emptyState } from './storage';
import type { AppState, JobApplication, UserPrefs } from '@/types';

export interface ExportBundle {
  exportedBy: string;
  exportedAt: string;
  version: string;
  totalApplications: number;
  userPrefs: UserPrefs;
  applications: JobApplication[];
}

export function buildExport(state: AppState): ExportBundle {
  return {
    exportedBy: 'JobTracker v3.1',
    exportedAt: nowISO(),
    version: '3.0',
    totalApplications: state.applications.length,
    userPrefs: state.userPrefs,
    applications: state.applications,
  };
}

export interface ParsedImport {
  applications: JobApplication[];
  userPrefs?: UserPrefs;
}

export function parseImport(raw: string): ParsedImport {
  const data = JSON.parse(raw) as Partial<ExportBundle> & { applications?: JobApplication[] };
  if (!data || !Array.isArray(data.applications)) {
    throw new Error('Invalid file: no applications array found.');
  }
  // Light validation — every record needs id/company/role/status.
  const valid = data.applications.filter(
    (a) => a && a.id && a.company !== undefined && a.role !== undefined && a.status,
  );
  return {
    applications: valid as JobApplication[],
    userPrefs: data.userPrefs,
  };
}

export function mergeApplications(
  existing: JobApplication[],
  incoming: JobApplication[],
): JobApplication[] {
  const ids = new Set(existing.map((a) => a.id));
  const merged = [...existing];
  for (const app of incoming) {
    if (!ids.has(app.id)) merged.push(app);
  }
  return merged;
}

// CSV export (bonus) — flat columns for spreadsheets.
export function toCSV(apps: JobApplication[]): string {
  const headers = [
    'Company', 'Role', 'Status', 'Source', 'Work Mode', 'Job Type',
    'Resume Version', 'Salary Min', 'Salary Max', 'Currency',
    'Applied Date', 'Follow-up', 'Priority', 'Location', 'Job URL',
  ];
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = apps.map((a) => [
    a.company, a.role, a.status, a.source, a.workMode, a.jobType,
    a.resumeVersion ?? '', a.salaryMin ?? '', a.salaryMax ?? '', a.salaryCurrency,
    a.appliedDate, a.followUpDate ?? '', a.priority, a.location, a.jobUrl,
  ].map(escape).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function freshStateFrom(
  apps: JobApplication[],
  prefs: UserPrefs | undefined,
  base: AppState,
): AppState {
  return {
    ...emptyState(),
    ...base,
    applications: apps,
    userPrefs: prefs ? { ...base.userPrefs, ...prefs } : base.userPrefs,
  };
}

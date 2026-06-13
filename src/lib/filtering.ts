import { daysSince, daysBetween } from './utils';
import { PRIORITY_ORDER } from './constants';
import type { JobApplication, FilterState, SortKey } from '@/types';

export function searchApps(apps: JobApplication[], query: string): JobApplication[] {
  const q = query.trim().toLowerCase();
  if (!q) return apps;
  return apps.filter((a) => {
    const haystack = [
      a.company, a.role, a.notes, a.recruiterName ?? '', a.resumeVersion ?? '',
      a.location, a.jdText ?? '', a.resumeText ?? '', ...a.tags, ...a.skills,
    ].join(' ').toLowerCase();
    return haystack.includes(q);
  });
}

export function filterApps(apps: JobApplication[], f: FilterState): JobApplication[] {
  return apps.filter((a) => {
    if (f.status?.length && !f.status.includes(a.status)) return false;
    if (f.source?.length && !f.source.includes(a.source)) return false;
    if (f.priority?.length && !f.priority.includes(a.priority)) return false;
    if (f.workMode?.length && !f.workMode.includes(a.workMode)) return false;
    if (f.jobType?.length && !f.jobType.includes(a.jobType)) return false;
    if (f.tags?.length && !f.tags.some((t) => a.tags.includes(t))) return false;

    if (f.salaryMin != null && (a.salaryMax ?? a.salaryMin ?? 0) < f.salaryMin) return false;
    if (f.salaryMax != null && (a.salaryMin ?? a.salaryMax ?? Infinity) > f.salaryMax) return false;

    if (f.dateRange?.from && a.appliedDate < f.dateRange.from) return false;
    if (f.dateRange?.to && a.appliedDate > f.dateRange.to) return false;

    if (f.hasJD && !a.jdText) return false;
    if (f.hasResume && !a.resumeText) return false;
    if (f.missingDocs && (a.jdText || a.resumeText)) return false;

    if (f.followUpOverdue) {
      if (!a.followUpDate || daysBetween(a.followUpDate, new Date()) >= 0) return false;
    }
    if (f.offerDeadlineSoon) {
      if (!a.responseDeadline) return false;
      const d = daysBetween(a.responseDeadline, new Date());
      if (d < 0 || d > 3) return false;
    }
    return true;
  });
}

export function sortApps(apps: JobApplication[], key: SortKey): JobApplication[] {
  const copy = [...apps];
  switch (key) {
    case 'newest':
      return copy.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    case 'oldest':
      return copy.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    case 'company':
      return copy.sort((a, b) => a.company.localeCompare(b.company));
    case 'priority':
      return copy.sort((a, b) => PRIORITY_ORDER.indexOf(b.priority) - PRIORITY_ORDER.indexOf(a.priority));
    case 'daysSince':
      return copy.sort((a, b) => daysSince(b.appliedDate) - daysSince(a.appliedDate));
    case 'salary':
      return copy.sort((a, b) => (b.salaryMax ?? b.salaryMin ?? 0) - (a.salaryMax ?? a.salaryMin ?? 0));
    default:
      return copy;
  }
}

export function countActiveFilters(f: FilterState): number {
  let n = 0;
  n += f.status?.length ?? 0;
  n += f.source?.length ?? 0;
  n += f.priority?.length ?? 0;
  n += f.workMode?.length ?? 0;
  n += f.jobType?.length ?? 0;
  n += f.tags?.length ?? 0;
  if (f.salaryMin != null) n++;
  if (f.salaryMax != null) n++;
  if (f.dateRange?.from || f.dateRange?.to) n++;
  if (f.hasJD) n++;
  if (f.hasResume) n++;
  if (f.missingDocs) n++;
  if (f.followUpOverdue) n++;
  if (f.offerDeadlineSoon) n++;
  return n;
}

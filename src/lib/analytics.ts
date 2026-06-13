import { daysBetween, daysSince, formatSalaryValue } from './utils';
import { STATUS_CONFIG, STATUS_ORDER, SOURCE_CONFIG, SOURCE_ORDER } from './constants';
import type { JobApplication, StatusValue, SourceValue } from '@/types';

const INACTIVE: ReadonlySet<StatusValue> = new Set(['rejected', 'withdrawn', 'ghosted']);

export interface Kpis {
  total: number;
  active: number;
  interviewing: number;
  offers: number;
  accepted: number;
  avgResponseDays: number;
  ghostRatePct: number;
}

export function computeKpis(apps: JobApplication[]): Kpis {
  const total = apps.length;
  const active = apps.filter((a) => !INACTIVE.has(a.status)).length;
  const interviewing = apps.filter((a) => a.status === 'interview').length;
  const offers = apps.filter((a) => ['offer', 'negotiating', 'accepted'].includes(a.status)).length;
  const accepted = apps.filter((a) => a.status === 'accepted').length;
  const ghosted = apps.filter((a) => a.status === 'ghosted').length;

  // Avg days from applied → first non-applied status change.
  const responseDeltas: number[] = [];
  for (const a of apps) {
    const firstResponse = a.statusHistory.find(
      (h) => h.status !== 'applied' && h.status !== 'wishlist',
    );
    if (firstResponse) {
      const d = daysBetween(firstResponse.timestamp, a.appliedDate);
      if (d >= 0) responseDeltas.push(d);
    }
  }
  const avgResponseDays = responseDeltas.length
    ? Math.round(responseDeltas.reduce((s, n) => s + n, 0) / responseDeltas.length)
    : 0;

  const ghostRatePct = total ? Math.round((ghosted / total) * 100) : 0;

  return { total, active, interviewing, offers, accepted, avgResponseDays, ghostRatePct };
}

export interface NameValueColor { name: string; value: number; color: string; key: string }

export function statusDistribution(apps: JobApplication[], label: (s: StatusValue) => string): NameValueColor[] {
  return STATUS_ORDER
    .map((s) => ({
      key: s,
      name: label(s),
      value: apps.filter((a) => a.status === s).length,
      color: STATUS_CONFIG[s].color,
    }))
    .filter((d) => d.value > 0);
}

export function sourceDistribution(apps: JobApplication[]): NameValueColor[] {
  return SOURCE_ORDER
    .map((s: SourceValue) => ({
      key: s,
      name: SOURCE_CONFIG[s].label,
      value: apps.filter((a) => a.source === s).length,
      color: SOURCE_CONFIG[s].color,
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function workModeDistribution(apps: JobApplication[], label: (k: string) => string): NameValueColor[] {
  const modes = [
    { key: 'remote', color: '#22C55E' },
    { key: 'hybrid', color: '#6366F1' },
    { key: 'onsite', color: '#F59E0B' },
  ];
  return modes
    .map((m) => ({ key: m.key, name: label(m.key), value: apps.filter((a) => a.workMode === m.key).length, color: m.color }))
    .filter((d) => d.value > 0);
}

export function jobTypeDistribution(apps: JobApplication[], label: (k: string) => string): NameValueColor[] {
  const types = [
    { key: 'fulltime', color: '#3B82F6' },
    { key: 'parttime', color: '#8B5CF6' },
    { key: 'contract', color: '#14B8A6' },
    { key: 'internship', color: '#EC4899' },
    { key: 'freelance', color: '#F97316' },
  ];
  return types
    .map((t) => ({ key: t.key, name: label(t.key), value: apps.filter((a) => a.jobType === t.key).length, color: t.color }))
    .filter((d) => d.value > 0);
}

// Applications over time — cumulative-by-day within range.
export function timelineSeries(apps: JobApplication[], rangeDays: number | 'all'): { date: string; count: number }[] {
  const today = new Date();
  const days = rangeDays === 'all'
    ? Math.max(7, Math.min(180, maxSpan(apps, today)))
    : rangeDays;
  const buckets: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = apps.filter((a) => a.appliedDate === key).length;
    buckets.push({ date: key, count });
  }
  return buckets;
}

function maxSpan(apps: JobApplication[], today: Date): number {
  let max = 7;
  for (const a of apps) {
    const d = daysBetween(today, a.appliedDate);
    if (d > max) max = d;
  }
  return max;
}

export function salaryHistogram(apps: JobApplication[]): { name: string; value: number }[] {
  const withSalary = apps.filter((a) => a.salaryMax != null || a.salaryMin != null);
  if (withSalary.length === 0) return [];
  // Normalize to annual INR-ish buckets using mid value (best-effort, no FX).
  const buckets = [
    { name: '<5L', min: 0, max: 500_000 },
    { name: '5–10L', min: 500_000, max: 1_000_000 },
    { name: '10–20L', min: 1_000_000, max: 2_000_000 },
    { name: '20–35L', min: 2_000_000, max: 3_500_000 },
    { name: '35–50L', min: 3_500_000, max: 5_000_000 },
    { name: '50L+', min: 5_000_000, max: Infinity },
  ];
  return buckets.map((b) => ({
    name: b.name,
    value: withSalary.filter((a) => {
      const mid = midSalary(a);
      return mid >= b.min && mid < b.max;
    }).length,
  }));
}

function midSalary(a: JobApplication): number {
  const min = a.salaryMin ?? a.salaryMax ?? 0;
  const max = a.salaryMax ?? a.salaryMin ?? 0;
  const base = (min + max) / 2;
  return a.salaryType === 'monthly' ? base * 12 : base;
}

// GitHub-style activity heatmap — last 17 weeks of applied-date counts.
export interface HeatCell { date: string; count: number }
export function activityHeatmap(apps: JobApplication[], weeks = 17): HeatCell[][] {
  const today = new Date();
  const day = today.getDay();
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - day)); // end of current week (Sat)
  const start = new Date(end);
  start.setDate(start.getDate() - (weeks * 7 - 1));

  const counts = new Map<string, number>();
  for (const a of apps) {
    const key = a.appliedDate;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const grid: HeatCell[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < weeks; w++) {
    const col: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const key = cursor.toISOString().slice(0, 10);
      col.push({ date: key, count: counts.get(key) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    grid.push(col);
  }
  return grid;
}

// Funnel: Applied → Screening → Interview → Offer → Accepted (counts of apps that ever reached the stage).
export function funnelData(apps: JobApplication[], label: (s: StatusValue) => string): { name: string; value: number; color: string }[] {
  const reached = (target: StatusValue[]) =>
    apps.filter((a) => a.statusHistory.some((h) => target.includes(h.status)) || target.includes(a.status)).length;

  const stages: { key: StatusValue; group: StatusValue[] }[] = [
    { key: 'applied', group: ['applied', 'follow_up', 'screening', 'interview', 'assignment', 'offer', 'negotiating', 'accepted'] },
    { key: 'screening', group: ['screening', 'interview', 'assignment', 'offer', 'negotiating', 'accepted'] },
    { key: 'interview', group: ['interview', 'assignment', 'offer', 'negotiating', 'accepted'] },
    { key: 'offer', group: ['offer', 'negotiating', 'accepted'] },
    { key: 'accepted', group: ['accepted'] },
  ];
  return stages.map((s) => ({
    name: label(s.key),
    value: reached(s.group),
    color: STATUS_CONFIG[s.key].color,
  }));
}

export interface SummaryStats {
  mostActiveDay: string;
  mostUsedSource: string;
  commonRejectionStage: string;
  longestActiveDays: number;
}

export function summaryStats(apps: JobApplication[]): SummaryStats {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayCounts = new Array(7).fill(0);
  for (const a of apps) dayCounts[new Date(a.appliedDate).getDay()]++;
  const maxDay = dayCounts.indexOf(Math.max(...dayCounts));

  const src = sourceDistribution(apps);
  const longest = apps
    .filter((a) => !INACTIVE.has(a.status))
    .reduce((m, a) => Math.max(m, daysSince(a.appliedDate)), 0);

  // Stage right before a rejection.
  const rejStages = new Map<string, number>();
  for (const a of apps.filter((x) => x.status === 'rejected')) {
    const hist = a.statusHistory.filter((h) => h.status !== 'rejected');
    const stage = hist.length ? hist[hist.length - 1].status : 'applied';
    rejStages.set(stage, (rejStages.get(stage) ?? 0) + 1);
  }
  let commonRej: StatusValue | '' = '';
  let max = 0;
  rejStages.forEach((v, k) => { if (v > max) { max = v; commonRej = k as StatusValue; } });

  return {
    mostActiveDay: apps.length ? dayNames[maxDay] : '—',
    mostUsedSource: src[0]?.name ?? '—',
    commonRejectionStage: commonRej || '—',
    longestActiveDays: longest,
  };
}

export { formatSalaryValue };

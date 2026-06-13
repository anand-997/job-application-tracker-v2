import { v4 as uuidv4 } from 'uuid';
import { CURRENCY_SYMBOL } from './constants';
import type { JobApplication, Currency } from '@/types';

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function uuid(): string {
  return uuidv4();
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

// Whole-day difference (a - b) in days; positive if a is later.
export function daysBetween(a: string | Date, b: string | Date): number {
  const da = new Date(a);
  const db = new Date(b);
  const ms = startOfDay(da).getTime() - startOfDay(db).getTime();
  return Math.round(ms / 86_400_000);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysSince(dateISO: string): number {
  return Math.max(0, daysBetween(new Date(), dateISO));
}

export function formatShortDate(dateISO?: string): string {
  if (!dateISO) return '—';
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function formatLongDate(dateISO?: string): string {
  if (!dateISO) return '—';
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function relativeTime(dateISO?: string): string {
  if (!dateISO) return '';
  const diff = daysSince(dateISO);
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  if (diff < 30) return `${diff} days ago`;
  if (diff < 60) return '1 month ago';
  return `${Math.floor(diff / 30)} months ago`;
}

// Compact salary, e.g. ₹18L for INR or $120k otherwise.
export function formatSalaryValue(value: number, currency: Currency): string {
  const sym = CURRENCY_SYMBOL[currency] ?? '';
  if (currency === 'INR') {
    if (value >= 10_000_000) return `${sym}${round(value / 10_000_000)}Cr`;
    if (value >= 100_000) return `${sym}${round(value / 100_000)}L`;
    if (value >= 1000) return `${sym}${round(value / 1000)}k`;
    return `${sym}${value}`;
  }
  if (value >= 1_000_000) return `${sym}${round(value / 1_000_000)}M`;
  if (value >= 1000) return `${sym}${round(value / 1000)}k`;
  return `${sym}${value}`;
}

function round(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

export function formatSalaryRange(job: JobApplication): string | null {
  const { salaryMin, salaryMax, salaryCurrency, salaryType } = job;
  if (salaryMin == null && salaryMax == null) return null;
  const per = salaryType === 'monthly' ? '/mo' : '/yr';
  if (salaryMin != null && salaryMax != null) {
    return `${formatSalaryValue(salaryMin, salaryCurrency)} – ${formatSalaryValue(salaryMax, salaryCurrency)} ${per}`;
  }
  const v = (salaryMin ?? salaryMax)!;
  return `${formatSalaryValue(v, salaryCurrency)} ${per}`;
}

export function companyDomain(company: string): string {
  const clean = company.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean ? `${clean}.com` : '';
}

export function clearbitLogo(company: string): string {
  return `https://logo.clearbit.com/${companyDomain(company)}`;
}

export function initials(company: string): string {
  const words = company.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Deterministic color from a string (fallback avatar background).
export function colorFromString(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function downloadJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(text: string, filename: string, type = 'text/plain'): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

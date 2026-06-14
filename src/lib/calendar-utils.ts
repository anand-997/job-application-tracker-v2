// Pure helpers for the calendar views — grid math, grouping, time geometry.
// No storage, no side effects.

import type { CalendarEvent, CalendarEventType } from '@/types';
import { EVENT_COLORS } from './calendar-events';

// Week-view geometry
export const WEEK_START_HOUR = 8;   // 8:00 AM
export const WEEK_END_HOUR = 20;    // 8:00 PM
export const SLOT_MINUTES = 30;
export const SLOT_PX = 30;          // 30px per 30-min slot → 1px per minute
export const PX_PER_MIN = SLOT_PX / SLOT_MINUTES;

// Event-type metadata for legend + filters (label resolved via i18n eventType.*)
export const CALENDAR_EVENT_TYPES: { type: CalendarEventType; color: string }[] = [
  { type: 'interview_round', color: EVENT_COLORS.interview_round },
  { type: 'follow_up', color: EVENT_COLORS.follow_up },
  { type: 'offer_deadline', color: EVENT_COLORS.offer_deadline },
  { type: 'applied', color: EVENT_COLORS.applied },
  { type: 'offer_received', color: EVENT_COLORS.offer_received },
  { type: 'interview_scheduled', color: EVENT_COLORS.interview_scheduled },
];

// Local YYYY-MM-DD (avoids UTC off-by-one from toISOString).
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isSameMonth(d: Date, ref: Date): boolean {
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

// Sunday-start matrix of full weeks covering the given month (leading/trailing days included).
export function getMonthMatrix(date: Date): Date[][] {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = addDays(first, -first.getDay()); // back up to Sunday
  const weeks: Date[][] = [];
  let cursor = start;
  // 6 weeks covers every month layout; trim trailing all-other-month week below.
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  // Drop a final week that's entirely in the next month (keeps grids tight at 5 rows when possible).
  if (weeks[5].every((d) => !isSameMonth(d, date))) weeks.pop();
  return weeks;
}

// 7 days (Sun..Sat) for the week containing `date`.
export function getWeekDays(date: Date): Date[] {
  const start = addDays(date, -date.getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function groupEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = e.date.slice(0, 10);
    const arr = map.get(key);
    if (arr) arr.push(e);
    else map.set(key, [e]);
  }
  return map;
}

export function getEventsForDate(events: CalendarEvent[], isoDate: string): CalendarEvent[] {
  return events.filter((e) => e.date.slice(0, 10) === isoDate);
}

// Upcoming events from today through +days, sorted ascending (events lib already sorts).
export function getUpcomingEvents(events: CalendarEvent[], days: number): CalendarEvent[] {
  const today = new Date();
  const todayISO = toISODate(today);
  const horizon = toISODate(addDays(today, days));
  return events.filter((e) => {
    const d = e.date.slice(0, 10);
    return d >= todayISO && d <= horizon;
  });
}

// ── Time geometry (week view) ──
function minutesFromStart(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m - WEEK_START_HOUR * 60;
}

export function timeToOffsetPx(time: string): number {
  return Math.max(0, minutesFromStart(time) * PX_PER_MIN);
}

export function durationToHeightPx(minutes: number): number {
  return Math.max(SLOT_PX, minutes * PX_PER_MIN);
}

export function nowOffsetPx(now = new Date()): number {
  return (now.getHours() * 60 + now.getMinutes() - WEEK_START_HOUR * 60) * PX_PER_MIN;
}

// "14:30" → "2:30 PM"
export function format12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

// "2:30–3:30 PM" style range
export function formatTimeRange(time?: string, endTime?: string): string {
  if (!time) return '';
  if (!endTime) return format12h(time);
  return `${format12h(time)} – ${format12h(endTime)}`;
}

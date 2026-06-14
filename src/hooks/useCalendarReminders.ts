'use client';

import { useEffect } from 'react';
import type { CalendarEvent } from '@/types';
import { fireBrowserNotification } from '@/lib/notifications';

// Schedules browser notifications for timed interview rounds that have a
// reminderMinutes set and fall within the next 24h. Pure browser Notification
// API — no backend, no push. Re-runs whenever the events list changes.
export function useCalendarReminders(events: CalendarEvent[]): void {
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const event of events) {
      if (event.type !== 'interview_round') continue;
      if (!event.time || !event.reminderMinutes) continue;

      const eventDateTime = new Date(`${event.date.slice(0, 10)}T${event.time}`);
      if (Number.isNaN(eventDateTime.getTime())) continue;

      const msUntilReminder = eventDateTime.getTime() - event.reminderMinutes * 60_000 - Date.now();

      // Only schedule reminders firing within the next 24h (timers don't survive reload).
      if (msUntilReminder > 0 && msUntilReminder < 24 * 60 * 60 * 1000) {
        timers.push(
          setTimeout(() => {
            fireBrowserNotification(
              `Interview in ${event.reminderMinutes} min`,
              `${event.company} · ${event.title}`,
            );
          }, msUntilReminder),
        );
      }
    }

    return () => timers.forEach(clearTimeout);
  }, [events]);
}

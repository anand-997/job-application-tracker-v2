import { daysSince, daysBetween, uuid, nowISO } from './utils';
import type { JobApplication, AppNotification } from '@/types';

// Build the live notification list from current applications (PRD §F9).
export function buildNotifications(apps: JobApplication[]): AppNotification[] {
  const out: AppNotification[] = [];
  const now = new Date();

  for (const app of apps) {
    if (app.status === 'rejected' || app.status === 'withdrawn') continue;

    // Follow-up due today / overdue
    if (app.followUpDate) {
      const diff = daysBetween(app.followUpDate, now); // >0 future, <0 past
      if (diff === 0) {
        out.push(mk('followUpDue', app, { days: 0 }));
      } else if (diff < 0) {
        out.push(mk('followUpOverdue', app, { days: Math.abs(diff) }));
      }
    }

    // Offer deadline within 3 days / expired
    if (app.responseDeadline && (app.status === 'offer' || app.status === 'negotiating')) {
      const diff = daysBetween(app.responseDeadline, now);
      if (diff < 0) {
        out.push(mk('offerExpired', app, { days: Math.abs(diff) }));
      } else if (diff <= 3) {
        out.push(mk('offerDeadline', app, { days: diff }));
      }
    }

    // Interview tomorrow
    if (app.interviewDate) {
      const diff = daysBetween(app.interviewDate, now);
      if (diff === 1) out.push(mk('interviewTomorrow', app, {}));
    }
  }
  return out;
}

function mk(
  type: AppNotification['type'],
  app: JobApplication,
  extra: Partial<AppNotification>,
): AppNotification {
  return {
    id: `${type}:${app.id}`,
    type,
    jobId: app.id,
    company: app.company,
    read: false,
    createdAt: nowISO(),
    ...extra,
  };
}

export function ghostNotification(count: number): AppNotification {
  return {
    id: `autoGhosted:${uuid()}`,
    type: 'autoGhosted',
    count,
    read: false,
    createdAt: nowISO(),
  };
}

// Browser notification API (PRD §F9)
export async function requestBrowserPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

export function fireBrowserNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}

export { daysSince };

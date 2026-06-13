import { daysSince, nowISO } from './utils';
import type { JobApplication } from '@/types';

// Statuses that are "settled" and never auto-ghosted.
const TERMINAL: ReadonlySet<JobApplication['status']> = new Set([
  'accepted', 'rejected', 'withdrawn', 'ghosted', 'offer', 'negotiating',
]);

export function detectGhosts(
  apps: JobApplication[],
  thresholdDays: number,
): { apps: JobApplication[]; ghostedIds: string[] } {
  const ghostedIds: string[] = [];
  const next = apps.map((app) => {
    if (TERMINAL.has(app.status)) return app;
    if (daysSince(app.lastActivityDate) > thresholdDays) {
      ghostedIds.push(app.id);
      const ts = nowISO();
      return {
        ...app,
        status: 'ghosted' as const,
        lastActivityDate: ts,
        updatedAt: ts,
        statusHistory: [
          ...app.statusHistory,
          { status: 'ghosted' as const, timestamp: ts, changedBy: 'auto_ghost' as const },
        ],
      };
    }
    return app;
  });
  return { apps: next, ghostedIds };
}

'use client';

import { useState } from 'react';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import type { CalendarEvent } from '@/types';
import { useT } from '@/i18n/I18nProvider';
import { daysBetween } from '@/lib/utils';
import { getUpcomingEvents, format12h, toISODate } from '@/lib/calendar-utils';

const MAX = 20;

export function UpcomingSidebar({ events, onOpenJob }: { events: CalendarEvent[]; onOpenJob: (id: string) => void }) {
  const { t } = useT();
  const [showAll, setShowAll] = useState(false);

  const today = new Date();
  const todayISO = toISODate(today);
  const upcoming = getUpcomingEvents(events, 60);
  const shown = showAll ? upcoming : upcoming.slice(0, MAX);

  // Bucket by whole-day distance from today.
  const buckets: { key: string; label: string; items: CalendarEvent[] }[] = [
    { key: 'today', label: t('calendar.today'), items: [] },
    { key: 'tomorrow', label: t('calendar.tomorrow'), items: [] },
    { key: 'thisWeek', label: t('calendar.thisWeek'), items: [] },
    { key: 'nextWeek', label: t('calendar.nextWeek'), items: [] },
    { key: 'later', label: t('calendar.later'), items: [] },
  ];
  for (const ev of shown) {
    const diff = daysBetween(ev.date.slice(0, 10), todayISO);
    const b = diff <= 0 ? 0 : diff === 1 ? 1 : diff <= 6 ? 2 : diff <= 13 ? 3 : 4;
    buckets[b].items.push(ev);
  }

  return (
    <aside className="scroll-thin hidden w-60 shrink-0 overflow-y-auto border-l border-border p-3 lg:block">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">{t('calendar.upcoming')}</h3>

      {upcoming.length === 0 && <p className="text-xs text-text-muted">{t('calendar.nothingScheduled')}</p>}

      <div className="space-y-4">
        {buckets.filter((b) => b.items.length > 0).map((b) => (
          <div key={b.key}>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{b.label}</p>
            <div className="space-y-1.5">
              {b.items.map((ev) => (
                <button key={ev.id} onClick={() => onOpenJob(ev.applicationId)} className="flex w-full gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-bg-hover">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ev.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs text-text-primary">{ev.title}</span>
                    <span className="flex items-center gap-1 text-[10px] text-text-muted">
                      {ev.isAllDay ? t('calendar.allDay') : format12h(ev.time!)}
                      {ev.durationMinutes && !ev.isAllDay && <span>· {ev.durationMinutes} min</span>}
                      {ev.meetLink && <ExternalLink className="h-2.5 w-2.5 text-accent" />}
                      {ev.isOverdue && <AlertTriangle className="h-2.5 w-2.5 text-error" />}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!showAll && upcoming.length > MAX && (
        <button onClick={() => setShowAll(true)} className="mt-3 text-[11px] font-medium text-accent hover:underline">
          {t('calendar.showAll')}
        </button>
      )}
    </aside>
  );
}

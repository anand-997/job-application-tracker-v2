'use client';

import { useEffect, useMemo, useState } from 'react';
import type { JobApplication } from '@/types';
import { useT } from '@/i18n/I18nProvider';
import { generateCalendarEvents } from '@/lib/calendar-events';
import { getWeekDays, addMonths, addDays } from '@/lib/calendar-utils';
import { requestBrowserPermission } from '@/lib/notifications';
import { useCalendarReminders } from '@/hooks/useCalendarReminders';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarLegend } from '@/components/calendar/CalendarLegend';
import { MonthView } from '@/components/calendar/MonthView';
import { WeekView } from '@/components/calendar/WeekView';
import { UpcomingSidebar } from '@/components/calendar/UpcomingSidebar';
import { defaultCalendarFilters, type CalendarFilterState } from '@/components/calendar/CalendarFilters';

const INACTIVE = new Set(['rejected', 'withdrawn', 'ghosted']);

export function CalendarView({ apps, onOpenJob }: { apps: JobApplication[]; onOpenJob: (id: string) => void }) {
  const { t } = useT();
  const [view, setView] = useState<'month' | 'week'>('month');
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [filters, setFilters] = useState<CalendarFilterState>(defaultCalendarFilters);

  // Request notification permission once on first calendar mount.
  useEffect(() => { void requestBrowserPermission(); }, []);

  const allEvents = useMemo(() => generateCalendarEvents(apps), [apps]);

  const inactiveIds = useMemo(
    () => new Set(apps.filter((a) => INACTIVE.has(a.status)).map((a) => a.id)),
    [apps],
  );

  const events = useMemo(() => allEvents.filter((e) => {
    if (!filters.types.has(e.type)) return false;
    if (filters.sources.size > 0 && !filters.sources.has(e.source)) return false;
    if (filters.scope === 'active' && inactiveIds.has(e.applicationId)) return false;
    return true;
  }), [allEvents, filters, inactiveIds]);

  // Reminders run off the (unfiltered) timed events so hidden filters don't drop alerts.
  useCalendarReminders(allEvents);

  const label = useMemo(() => {
    if (view === 'month') {
      return cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
    const wk = getWeekDays(cursor);
    const a = wk[0], b = wk[6];
    const sameMonth = a.getMonth() === b.getMonth();
    const left = a.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const right = b.toLocaleDateString('en-GB', sameMonth ? { day: 'numeric', year: 'numeric' } : { day: 'numeric', month: 'short', year: 'numeric' });
    return `${left} – ${right}`;
  }, [view, cursor]);

  const step = (dir: number) => setCursor((c) => (view === 'month' ? addMonths(c, dir) : addDays(c, dir * 7)));

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <CalendarHeader
          view={view} setView={setView} label={label}
          onPrev={() => step(-1)} onNext={() => step(1)} onToday={() => setCursor(new Date())}
          filters={filters} onFiltersChange={setFilters}
        />
        <div className="px-3 py-1.5"><CalendarLegend activeTypes={filters.types} /></div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {view === 'month'
            ? <MonthView monthDate={cursor} events={events} onOpenJob={onOpenJob} moreLabel={(n) => t('calendar.moreEvents', { n })} />
            : <WeekView weekDate={cursor} events={events} onOpenJob={onOpenJob} allDayLabel={t('calendar.allDay')} />}
        </div>
      </div>
      <UpcomingSidebar events={events} onOpenJob={onOpenJob} />
    </div>
  );
}

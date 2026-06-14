'use client';

import type { CalendarEventType } from '@/types';
import { useT } from '@/i18n/I18nProvider';
import { CALENDAR_EVENT_TYPES } from '@/lib/calendar-utils';

// Compact color legend: event type → color dot. Active types only.
export function CalendarLegend({ activeTypes }: { activeTypes: Set<CalendarEventType> }) {
  const { t } = useT();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {CALENDAR_EVENT_TYPES.filter((e) => activeTypes.has(e.type)).map((e) => (
        <span key={e.type} className="flex items-center gap-1.5 text-[11px] text-text-muted">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
          {t(`eventType.${e.type}`)}
        </span>
      ))}
    </div>
  );
}

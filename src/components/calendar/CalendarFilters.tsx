'use client';

import { SlidersHorizontal } from 'lucide-react';
import type { CalendarEventType, SourceValue } from '@/types';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';
import { CALENDAR_EVENT_TYPES } from '@/lib/calendar-utils';
import { SOURCE_ORDER, SOURCE_CONFIG } from '@/lib/constants';
import { Popover } from '@/components/ui/Popover';
import { Button, CheckRow } from '@/components/ui/primitives';

export interface CalendarFilterState {
  types: Set<CalendarEventType>;
  sources: Set<SourceValue>; // empty = all
  scope: 'all' | 'active';
}

export function defaultCalendarFilters(): CalendarFilterState {
  return { types: new Set(CALENDAR_EVENT_TYPES.map((e) => e.type)), sources: new Set(), scope: 'all' };
}

export function CalendarFilters({
  value, onChange,
}: { value: CalendarFilterState; onChange: (next: CalendarFilterState) => void }) {
  const { t } = useT();

  const toggleType = (type: CalendarEventType) => {
    const types = new Set(value.types);
    if (types.has(type)) types.delete(type); else types.add(type);
    onChange({ ...value, types });
  };
  const toggleSource = (src: SourceValue) => {
    const sources = new Set(value.sources);
    if (sources.has(src)) sources.delete(src); else sources.add(src);
    onChange({ ...value, sources });
  };

  const activeCount = CALENDAR_EVENT_TYPES.length - value.types.size + value.sources.size + (value.scope === 'active' ? 1 : 0);

  return (
    <Popover
      align="end"
      width="w-72"
      trigger={({ toggle, open }) => (
        <Button size="sm" variant={open ? 'secondary' : 'ghost'} onClick={toggle}>
          <SlidersHorizontal className="h-3.5 w-3.5" />{t('calendar.filters')}
          {activeCount > 0 && <span className="ml-1 rounded-full bg-accent px-1.5 text-[10px] font-semibold text-white">{activeCount}</span>}
        </Button>
      )}
    >
      {() => (
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-3">
          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">{t('calendar.showEventTypes')}</p>
            <div className="space-y-1">
              {CALENDAR_EVENT_TYPES.map((e) => (
                <label key={e.type} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-bg-hover">
                  <input type="checkbox" checked={value.types.has(e.type)} onChange={() => toggleType(e.type)} className="accent-[var(--accent)]" />
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
                  <span className="text-xs text-text-primary">{t(`eventType.${e.type}`)}</span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">{t('calendar.filterBySource')}</p>
            <div className="flex flex-wrap gap-1.5">
              {SOURCE_ORDER.map((src) => {
                const on = value.sources.has(src);
                return (
                  <button key={src} onClick={() => toggleSource(src)}
                    className={cn('rounded-full border px-2 py-0.5 text-[11px] transition-colors',
                      on ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:bg-bg-hover')}>
                    {SOURCE_CONFIG[src].label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-1">
            <CheckRow checked={value.scope === 'all'} onChange={() => onChange({ ...value, scope: 'all' })}>{t('calendar.showAllApps')}</CheckRow>
            <CheckRow checked={value.scope === 'active'} onChange={() => onChange({ ...value, scope: 'active' })}>{t('calendar.activeOnly')}</CheckRow>
          </section>

          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => onChange(defaultCalendarFilters())}>{t('calendar.reset')}</Button>
          </div>
        </div>
      )}
    </Popover>
  );
}

'use client';

import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useT } from '@/i18n/I18nProvider';
import { Button, Segmented } from '@/components/ui/primitives';
import { CalendarFilters, type CalendarFilterState } from './CalendarFilters';

export function CalendarHeader({
  view, setView, label, onPrev, onNext, onToday, filters, onFiltersChange,
}: {
  view: 'month' | 'week';
  setView: (v: 'month' | 'week') => void;
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  filters: CalendarFilterState;
  onFiltersChange: (f: CalendarFilterState) => void;
}) {
  const { t } = useT();
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
      <div className="flex items-center gap-0.5">
        <button onClick={onPrev} aria-label="Previous" className="rounded-lg p-1.5 text-text-secondary hover:bg-bg-hover"><ChevronLeft className="h-4 w-4" /></button>
        <button onClick={onNext} aria-label="Next" className="rounded-lg p-1.5 text-text-secondary hover:bg-bg-hover"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <h2 className="font-display text-lg font-bold text-text-primary">{label}</h2>
      <Button size="sm" variant="ghost" onClick={onToday}><CalendarDays className="h-3.5 w-3.5" />{t('calendar.today')}</Button>

      <div className="ml-auto flex items-center gap-2">
        <Segmented<'month' | 'week'>
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: 'month', label: t('calendar.month') },
            { value: 'week', label: t('calendar.week') },
          ]}
        />
        <CalendarFilters value={filters} onChange={onFiltersChange} />
      </div>
    </div>
  );
}

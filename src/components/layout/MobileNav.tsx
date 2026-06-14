'use client';

import { LayoutGrid, BarChart3, Plus, Settings, Table2, CalendarDays } from 'lucide-react';
import type { ViewMode } from '@/types';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

export function MobileNav({
  view, setView, onAddJob, onOpenSettings,
}: { view: ViewMode; setView: (v: ViewMode) => void; onAddJob: () => void; onOpenSettings: () => void }) {
  const { t } = useT();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border surface px-2 py-1.5 backdrop-blur-md sm:hidden">
      <Tab active={view === 'kanban'} onClick={() => setView('kanban')} icon={<LayoutGrid className="h-5 w-5" />} label={t('nav.board')} />
      <Tab active={view === 'table'} onClick={() => setView('table')} icon={<Table2 className="h-5 w-5" />} label={t('nav.table')} />
      <button onClick={onAddJob} aria-label={t('nav.addJob')} className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-drag">
        <Plus className="h-6 w-6" />
      </button>
      <Tab active={view === 'calendar'} onClick={() => setView('calendar')} icon={<CalendarDays className="h-5 w-5" />} label={t('nav.calendar')} />
      <Tab active={view === 'analytics'} onClick={() => setView('analytics')} icon={<BarChart3 className="h-5 w-5" />} label={t('nav.analytics')} />
      <Tab active={false} onClick={onOpenSettings} icon={<Settings className="h-5 w-5" />} label={t('nav.settings')} />
    </nav>
  );
}

function Tab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={cn('flex min-w-[56px] flex-col items-center gap-0.5 rounded-lg py-1 text-[10px]', active ? 'text-accent' : 'text-text-muted')}>
      {icon}{label}
    </button>
  );
}

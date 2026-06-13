'use client';

import { Plus, SlidersHorizontal, Moon, Sun, Settings, Download, LayoutGrid, Table2, BarChart3, Target } from 'lucide-react';
import type { ViewMode, SortKey } from '@/types';
import { useApp } from '@/context/AppProvider';
import { useT } from '@/i18n/I18nProvider';
import { buildExport } from '@/lib/export-import';
import { downloadJSON, cn } from '@/lib/utils';
import { SearchBar } from '@/components/filters/SearchBar';
import { SortDropdown } from '@/components/filters/SortDropdown';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Button, IconButton, Segmented } from '@/components/ui/primitives';

export function Header({
  view, setView, search, setSearch, sort, setSort,
  onOpenFilters, filterCount, onAddJob, onOpenSettings, onOpenJob, searchRef,
}: {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  search: string;
  setSearch: (v: string) => void;
  sort: SortKey;
  setSort: (v: SortKey) => void;
  onOpenFilters: () => void;
  filterCount: number;
  onAddJob: () => void;
  onOpenSettings: () => void;
  onOpenJob: (id: string) => void;
  searchRef: React.RefObject<HTMLInputElement>;
}) {
  const { state, setPrefs } = useApp();
  const { t } = useT();
  const { theme, language } = state.userPrefs;

  return (
    <header className="sticky top-0 z-30 border-b border-border surface backdrop-blur-md">
      <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white shadow-sm">
            <Target className="h-4.5 w-4.5" />
          </span>
          <div className="hidden leading-tight sm:block">
            <div className="font-display text-sm font-bold text-text-primary">{t('app.name')}</div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-text-muted">{t('app.motto')}</div>
          </div>
        </div>

        {/* Search (desktop) */}
        <div className="mx-2 hidden max-w-md flex-1 md:block">
          <SearchBar value={search} onChange={setSearch} inputRef={searchRef} />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={onOpenFilters}
            className="relative inline-flex h-9 items-center gap-1.5 rounded-lg border border-border surface-card px-3 text-sm text-text-secondary hover:bg-bg-hover"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden lg:inline">{t('header.filters')}</span>
            {filterCount > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{filterCount}</span>}
          </button>

          {view !== 'analytics' && <SortDropdown value={sort} onChange={setSort} />}

          {/* View toggle */}
          <div className="hidden sm:block">
            <Segmented<ViewMode>
              size="sm"
              value={view}
              onChange={setView}
              options={[
                { value: 'kanban', label: <span className="flex items-center gap-1"><LayoutGrid className="h-3.5 w-3.5" /><span className="hidden lg:inline">{t('nav.board')}</span></span> },
                { value: 'table', label: <span className="flex items-center gap-1"><Table2 className="h-3.5 w-3.5" /><span className="hidden lg:inline">{t('nav.table')}</span></span> },
                { value: 'analytics', label: <span className="flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" /><span className="hidden lg:inline">{t('nav.analytics')}</span></span> },
              ]}
            />
          </div>

          {/* Lang toggle */}
          <button
            onClick={() => setPrefs({ language: language === 'en' ? 'hi' : 'en' })}
            className={cn('inline-flex h-9 items-center rounded-lg border border-border surface-card px-2.5 text-xs font-semibold', language === 'hi' ? 'font-hindi' : '')}
            aria-label="Toggle language"
          >
            {language === 'en' ? 'EN' : 'हिं'}
          </button>

          <IconButton label={t('header.toggleTheme')} onClick={() => setPrefs({ theme: theme === 'dark' ? 'light' : 'dark' })}>
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </IconButton>

          <NotificationBell onOpenJob={onOpenJob} />

          <IconButton label={t('actions.export')} className="hidden sm:inline-flex" onClick={() => downloadJSON(buildExport(state), 'jobtracker-export.json')}>
            <Download className="h-4.5 w-4.5" />
          </IconButton>

          <IconButton label={t('nav.settings')} onClick={onOpenSettings}>
            <Settings className="h-4.5 w-4.5" />
          </IconButton>

          <Button variant="primary" size="md" onClick={onAddJob} className="hidden sm:inline-flex">
            <Plus className="h-4 w-4" /><span className="hidden lg:inline">{t('nav.addJob')}</span>
          </Button>
        </div>
      </div>

      {/* Search (mobile) */}
      <div className="px-3 pb-2.5 md:hidden">
        <SearchBar value={search} onChange={setSearch} />
      </div>
    </header>
  );
}

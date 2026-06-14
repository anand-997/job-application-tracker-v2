'use client';

import { useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { X } from 'lucide-react';
import type { JobApplication, StatusValue, ViewMode, SortKey, FilterState } from '@/types';
import { QUICK_STATUS_BY_NUMBER } from '@/lib/constants';
import { searchApps, filterApps, sortApps, countActiveFilters } from '@/lib/filtering';
import { downloadJSON } from '@/lib/utils';
import { buildExport } from '@/lib/export-import';
import { useApp } from '@/context/AppProvider';
import { useT } from '@/i18n/I18nProvider';
import { useToast } from '@/context/ToastProvider';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Providers } from './Providers';

import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { OnboardingModal } from '@/components/modals/OnboardingModal';
import { AddJobModal } from '@/components/modals/AddJobModal';
import { JobDetailDrawer } from '@/components/modals/JobDetailDrawer';
import { DeleteConfirmDialog } from '@/components/modals/DeleteConfirmDialog';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { ImportExportModal } from '@/components/modals/ImportExportModal';
import { TextViewerModal } from '@/components/modals/TextViewerModal';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { FilterChips } from '@/components/filters/FilterChips';
import { Button } from '@/components/ui/primitives';

const AnalyticsDashboard = dynamic(
  () => import('@/components/views/AnalyticsDashboard').then((m) => m.AnalyticsDashboard),
  { ssr: false, loading: () => <Loading /> },
);
const TableView = dynamic(
  () => import('@/components/views/TableView').then((m) => m.TableView),
  { ssr: false, loading: () => <Loading /> },
);

export default function Page() {
  return (
    <Providers>
      <AppShell />
    </Providers>
  );
}

function AppShell() {
  const {
    state, hydrated, deleteApplication, changeStatus, clearAll, setPrefs,
    backupStatus, backupFolderName, resumeBackup, linkDataFolder,
  } = useApp();
  const { t } = useT();
  const { toast } = useToast();
  const [resumeDismissed, setResumeDismissed] = useState(false);

  async function handleResume() {
    const ok = await resumeBackup();
    if (ok) toast({ message: t('settings.backup.reconnected'), variant: 'success' });
    else {
      // Folder/file gone or permission denied — offer to pick a new folder.
      const res = await linkDataFolder();
      if (res) toast({ message: res.mode === 'loaded' ? t('settings.backup.loaded', { n: res.count }) : t('onboarding.folderCreated'), variant: 'success' });
    }
  }

  const [view, setView] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [filters, setFilters] = useState<FilterState>({});

  const [addOpen, setAddOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<StatusValue | undefined>();
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<JobApplication | null>(null);
  const [viewer, setViewer] = useState<{ open: boolean; title: string; text: string }>({ open: false, title: '', text: '' });
  const [bannerHidden, setBannerHidden] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  const apps = state.applications;
  const filtered = useMemo(
    () => sortApps(filterApps(searchApps(apps, search), filters), sort),
    [apps, search, filters, sort],
  );

  const openAdd = (status?: StatusValue) => { setEditingApp(null); setDefaultStatus(status); setAddOpen(true); };
  const openEdit = (app: JobApplication) => { setEditingApp(app); setDrawerId(null); setAddOpen(true); };
  const openView = (text: string, title: string) => setViewer({ open: true, title, text });

  useKeyboardShortcuts({
    onSearch: () => searchRef.current?.focus(),
    onNew: () => openAdd(),
    onHelp: () => setSettingsOpen(true),
    onQuickStatus: (i) => { if (drawerId && QUICK_STATUS_BY_NUMBER[i]) changeStatus(drawerId, QUICK_STATUS_BY_NUMBER[i]); },
  });

  if (!hydrated) {
    return <div className="flex h-screen items-center justify-center text-text-muted">{t('common.loading')}</div>;
  }

  const showOnboarding = !state.userPrefs.onboarded;
  const filterCount = countActiveFilters(filters);

  return (
    <div className="flex h-screen flex-col">
      <Header
        view={view} setView={setView}
        search={search} setSearch={setSearch}
        sort={sort} setSort={setSort}
        onOpenFilters={() => setFiltersOpen(true)}
        filterCount={filterCount}
        onAddJob={() => openAdd()}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenJob={(id) => setDrawerId(id)}
        searchRef={searchRef}
      />

      {/* Guest banner */}
      {!bannerHidden && (
        <div className="flex items-center gap-2 border-b border-border bg-accent/5 px-4 py-1.5 text-xs text-text-secondary">
          <span>💾 {t('header.guestMode')}</span>
          <button onClick={() => setBannerHidden(true)} aria-label="Dismiss" className="ml-auto text-text-muted hover:text-text-primary"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Resume-folder banner — one-click re-grant of the linked data folder on return */}
      {backupStatus === 'needs-permission' && !resumeDismissed && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-warning/10 px-4 py-2 text-xs text-text-secondary">
          <span>🔗 {t('settings.backup.resumePrompt', { folder: backupFolderName ?? '' })}</span>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={handleResume}>{t('settings.backup.resume')}</Button>
            <Button size="sm" variant="ghost" onClick={() => setResumeDismissed(true)}>{t('settings.backup.notNow')}</Button>
          </div>
        </div>
      )}

      {/* Sample-data banner — one-click exit from "Explore with sample data" */}
      {state.userPrefs.sampleLoaded && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-accent/10 px-4 py-2 text-xs text-text-secondary">
          <span>🧪 {t('sample.notice')}</span>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={clearAll}>{t('sample.clear')}</Button>
            <Button size="sm" variant="ghost" onClick={() => setPrefs({ sampleLoaded: false })}>{t('sample.keep')}</Button>
          </div>
        </div>
      )}

      <FilterChips filters={filters} onChange={setFilters} />

      {/* Main view */}
      <main className="relative flex-1 overflow-hidden pb-16 sm:pb-0">
        {apps.length === 0 ? (
          <EmptyBoard onAdd={() => openAdd()} />
        ) : view === 'kanban' ? (
          <KanbanBoard apps={filtered} onOpen={(a) => setDrawerId(a.id)} onEdit={openEdit} onAdd={(s) => openAdd(s)} />
        ) : view === 'table' ? (
          <TableView apps={filtered} onOpen={(a) => setDrawerId(a.id)} />
        ) : (
          <AnalyticsDashboard apps={apps} />
        )}
      </main>

      {/* Info footer under the tracker — explains Guest Mode + how to back up / move data */}
      <footer className="hidden flex-wrap items-center gap-x-3 gap-y-1 border-t border-border surface px-4 py-2 text-[11px] text-text-muted sm:flex">
        <span className="font-medium text-text-secondary">💾 {t('footer.guestTitle')}</span>
        <span className="max-w-3xl">{t('footer.guestInfo')}</span>
        <span className="ml-auto flex items-center gap-3">
          <button
            onClick={() => downloadJSON(buildExport(state), 'jobtracker-export.json')}
            className="font-medium text-accent hover:underline"
          >
            {t('footer.exportNow')}
          </button>
          <button onClick={() => setImportOpen(true)} className="font-medium text-accent hover:underline">
            {t('footer.importNow')}
          </button>
        </span>
      </footer>

      <MobileNav view={view} setView={setView} onAddJob={() => openAdd()} onOpenSettings={() => setSettingsOpen(true)} />

      {/* Modals & drawers */}
      <OnboardingModal open={showOnboarding} />
      <AddJobModal open={addOpen} onClose={() => setAddOpen(false)} editing={editingApp} defaultStatus={defaultStatus} onView={openView} />
      <JobDetailDrawer
        appId={drawerId}
        open={!!drawerId}
        onClose={() => setDrawerId(null)}
        onEdit={() => { const a = apps.find((x) => x.id === drawerId); if (a) openEdit(a); }}
        onView={openView}
        onRequestDelete={() => { const a = apps.find((x) => x.id === drawerId); if (a) setDeleteTarget(a); }}
      />
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { deleteApplication(deleteTarget.id); setDrawerId(null); } }}
        company={deleteTarget?.company}
        role={deleteTarget?.role}
      />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onImport={() => { setSettingsOpen(false); setImportOpen(true); }} />
      <ImportExportModal open={importOpen} onClose={() => setImportOpen(false)} />
      <FilterPanel open={filtersOpen} onClose={() => setFiltersOpen(false)} filters={filters} onChange={setFilters} />
      <TextViewerModal open={viewer.open} onClose={() => setViewer((v) => ({ ...v, open: false }))} title={viewer.title} text={viewer.text} />
    </div>
  );
}

function Loading() {
  return <div className="flex h-full items-center justify-center text-text-muted">…</div>;
}

function EmptyBoard({ onAdd }: { onAdd: () => void }) {
  const { t } = useT();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border surface-card text-4xl">🎯</div>
      <div>
        <h2 className="font-display text-xl font-semibold text-text-primary">{t('empty.board')}</h2>
        <p className="mt-1 text-sm text-text-muted">{t('app.motto')}</p>
      </div>
      <button onClick={onAdd} className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover">
        + {t('nav.addJob')}
      </button>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Download, Upload, Trash2, FileSpreadsheet, HardDriveDownload, RefreshCw, Link2Off, FileJson } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button, Field, Input, Select, Segmented } from '@/components/ui/primitives';
import { useApp } from '@/context/AppProvider';
import { useT } from '@/i18n/I18nProvider';
import { useToast } from '@/context/ToastProvider';
import { buildExport, toCSV } from '@/lib/export-import';
import { downloadJSON, downloadText } from '@/lib/utils';

const SHORTCUTS: [string, string][] = [
  ['Ctrl/⌘ + K', 'Search'],
  ['N', 'New job'],
  ['1–9', 'Quick status'],
  ['Esc', 'Close'],
  ['?', 'This panel'],
];

export function SettingsModal({ open, onClose, onImport }: { open: boolean; onClose: () => void; onImport: () => void }) {
  const { state, setPrefs, clearAll } = useApp();
  const { t } = useT();
  const p = state.userPrefs;
  const [confirmText, setConfirmText] = useState('');

  return (
    <Modal open={open} onClose={onClose} title={t('settings.title')} size="lg">
      <div className="scroll-thin max-h-[68vh] space-y-6 overflow-y-auto p-5">
        {/* Appearance */}
        <Sec title={t('settings.appearance')}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t('settings.theme')}>
              <Segmented value={p.theme} onChange={(v) => setPrefs({ theme: v })}
                options={[{ value: 'dark', label: `🌙 ${t('settings.dark')}` }, { value: 'light', label: `☀️ ${t('settings.light')}` }]} />
            </Field>
            <Field label={t('settings.language')}>
              <Segmented value={p.language} onChange={(v) => setPrefs({ language: v })}
                options={[{ value: 'en', label: 'EN' }, { value: 'hi', label: 'हिं' }]} />
            </Field>
          </div>
        </Sec>

        {/* Profile */}
        <Sec title={t('settings.profile')}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t('settings.name')}><Input value={p.name ?? ''} onChange={(e) => setPrefs({ name: e.target.value || undefined })} /></Field>
            <Field label={t('settings.persona')}>
              <Segmented value={p.persona} onChange={(v) => setPrefs({ persona: v })}
                options={[{ value: 'student', label: `🎓 ${t('settings.student')}` }, { value: 'professional', label: `💼 ${t('settings.professional')}` }]} />
            </Field>
            <Field label={t('settings.defaultCurrency')}>
              <Select value={p.currency} onChange={(e) => setPrefs({ currency: e.target.value as typeof p.currency })}>
                {['INR', 'USD', 'EUR', 'GBP'].map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label={t('settings.defaultWorkMode')}>
              <Select value={p.defaultWorkMode ?? 'remote'} onChange={(e) => setPrefs({ defaultWorkMode: e.target.value as typeof p.defaultWorkMode })}>
                <option value="remote">{t('workMode.remote')}</option>
                <option value="hybrid">{t('workMode.hybrid')}</option>
                <option value="onsite">{t('workMode.onsite')}</option>
              </Select>
            </Field>
            <Field label={t('settings.noticePeriod')}>
              <Select value={String(p.noticePeriodDays ?? 30)} onChange={(e) => setPrefs({ noticePeriodDays: Number(e.target.value) })}>
                {[0, 30, 60, 90].map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </Field>
          </div>
        </Sec>

        {/* Behaviour */}
        <Sec title={t('settings.behaviour')}>
          <Field label={`${t('settings.ghostThreshold')}: ${p.ghostThresholdDays}`}>
            <input type="range" min={15} max={60} step={15} value={p.ghostThresholdDays}
              onChange={(e) => setPrefs({ ghostThresholdDays: Number(e.target.value) })} className="w-full accent-[var(--accent)]" />
            <div className="flex justify-between text-[10px] text-text-muted"><span>15</span><span>30</span><span>45</span><span>60</span></div>
          </Field>
        </Sec>

        {/* Data */}
        <Sec title={t('settings.dataManagement')}>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => downloadJSON(buildExport(state), 'jobtracker-export.json')}>
              <Download className="h-4 w-4" />{t('settings.exportJson')}
            </Button>
            <Button variant="secondary" onClick={() => downloadText(toCSV(state.applications), 'jobtracker.csv', 'text/csv')}>
              <FileSpreadsheet className="h-4 w-4" />{t('settings.exportCsv')}
            </Button>
            <Button variant="secondary" onClick={onImport}><Upload className="h-4 w-4" />{t('settings.importJson')}</Button>
          </div>
          <BackupBlock />
          <div className="mt-3 rounded-xl border border-error/30 bg-error/5 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={t('settings.clearConfirm')} className="max-w-[200px]" />
              <Button variant="danger" disabled={confirmText !== 'DELETE'} onClick={() => { clearAll(); setConfirmText(''); onClose(); }}>
                <Trash2 className="h-4 w-4" />{t('settings.clearData')}
              </Button>
            </div>
          </div>
        </Sec>

        {/* Shortcuts */}
        <Sec title={t('settings.shortcuts')}>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {SHORTCUTS.map(([k, label]) => (
              <div key={k} className="flex items-center justify-between rounded-lg bg-bg-hover px-3 py-1.5">
                <span className="text-xs text-text-secondary">{label}</span>
                <kbd className="rounded border border-border bg-bg-card px-1.5 py-0.5 font-mono text-[10px] text-text-primary">{k}</kbd>
              </div>
            ))}
          </div>
        </Sec>

        {/* About */}
        <Sec title={t('settings.about')}>
          <p className="text-sm text-text-secondary">{t('settings.aboutText')}</p>
          <p className="mt-1 font-mono text-xs text-text-muted">{t('settings.version')} 3.1.0 · {t('app.motto')}</p>
        </Sec>
      </div>
    </Modal>
  );
}

function BackupBlock() {
  const { t } = useT();
  const { toast } = useToast();
  const {
    backupStatus, backupFileName, lastSyncedAt,
    linkBackupFile, reconnectBackup, syncBackupNow, importFromBackup, unlinkBackup,
  } = useApp();
  const [busy, setBusy] = useState(false);

  // Wrap an async backup op with a busy guard + toast feedback.
  const run = (fn: () => Promise<unknown>, ok: string) => async () => {
    setBusy(true);
    try {
      const res = await fn();
      if (res === false || res === null) return; // cancelled / permission denied — stay quiet
      toast({ message: typeof res === 'number' ? t('settings.backup.loaded', { n: res }) : ok, variant: 'success' });
    } catch {
      toast({ message: t('settings.backup.syncFailed'), variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const lastSynced = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : t('settings.backup.never');

  return (
    <div className="mt-3 rounded-xl border border-border surface-card p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-text-primary">
        <HardDriveDownload className="h-4 w-4 text-accent" />{t('settings.backup.title')}
      </div>

      {backupStatus === 'unsupported' && (
        <p className="text-xs text-text-muted">{t('settings.backup.unsupportedNote')}</p>
      )}

      {backupStatus === 'unlinked' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-text-secondary">{t('settings.backup.intro')}</p>
          <Button variant="primary" disabled={busy} onClick={run(linkBackupFile, t('settings.backup.linked'))}>
            <FileJson className="h-4 w-4" />{t('settings.backup.choose')}
          </Button>
        </div>
      )}

      {backupStatus === 'needs-permission' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-warning">{t('settings.backup.needsPermission')}</p>
          <Button variant="primary" disabled={busy} onClick={run(reconnectBackup, t('settings.backup.reconnected'))}>
            <RefreshCw className="h-4 w-4" />{t('settings.backup.reconnect')}
          </Button>
        </div>
      )}

      {backupStatus === 'linked' && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
            <span className="text-text-secondary">
              {t('settings.backup.linkedAs')}: <span className="font-mono text-text-primary">{backupFileName}</span>
            </span>
            <span className="text-text-muted">{t('settings.backup.lastSynced')}: {lastSynced}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={busy} onClick={run(syncBackupNow, t('settings.backup.synced'))}>
              <RefreshCw className="h-4 w-4" />{t('settings.backup.syncNow')}
            </Button>
            <Button variant="secondary" disabled={busy} onClick={run(() => importFromBackup('replace'), t('settings.backup.loaded', { n: 0 }))}>
              <Upload className="h-4 w-4" />{t('settings.backup.loadFromFile')}
            </Button>
            <Button variant="secondary" disabled={busy} onClick={run(linkBackupFile, t('settings.backup.linked'))}>
              <FileJson className="h-4 w-4" />{t('settings.backup.changeFile')}
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => { unlinkBackup(); toast({ message: t('settings.backup.unlinked'), variant: 'success' }); }}>
              <Link2Off className="h-4 w-4" />{t('settings.backup.unlink')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</h3>
      {children}
    </section>
  );
}

'use client';

import { useRef, useState } from 'react';
import { Upload, FileJson } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/primitives';
import { useApp } from '@/context/AppProvider';
import { useT } from '@/i18n/I18nProvider';
import { useToast } from '@/context/ToastProvider';
import { parseImport } from '@/lib/export-import';
import type { JobApplication, UserPrefs } from '@/types';
import { cn } from '@/lib/utils';

export function ImportExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { importApplications } = useApp();
  const { t } = useT();
  const { toast } = useToast();
  const [parsed, setParsed] = useState<{ apps: JobApplication[]; prefs?: UserPrefs } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function readFile(file: File) {
    setError(null);
    try {
      const text = await file.text();
      const res = parseImport(text);
      setParsed({ apps: res.applications, prefs: res.userPrefs });
    } catch {
      setError(t('importExport.invalid'));
      setParsed(null);
    }
  }

  function doImport(mode: 'replace' | 'merge') {
    if (!parsed) return;
    const n = importApplications(parsed.apps, mode, parsed.prefs);
    toast({ message: t('importExport.imported', { n: Math.max(0, n) }), variant: 'success' });
    setParsed(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={t('importExport.title')} size="md">
      <div className="p-5">
        {!parsed ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) void readFile(f); }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors',
              dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50',
            )}
          >
            <Upload className="h-7 w-7 text-text-muted" />
            <span className="text-sm text-text-secondary">{t('importExport.dropJson')}</span>
            <input ref={inputRef} type="file" accept="application/json,.json" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void readFile(f); e.target.value = ''; }} />
          </div>
        ) : (
          <div className="rounded-xl border border-border surface-card p-4 text-center">
            <FileJson className="mx-auto h-8 w-8 text-accent" />
            <p className="mt-2 text-sm font-medium text-text-primary">{t('importExport.found', { n: parsed.apps.length })}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button variant="primary" className="flex-1" onClick={() => doImport('replace')}>{t('importExport.replaceAll')}</Button>
              <Button variant="secondary" className="flex-1" onClick={() => doImport('merge')}>{t('importExport.merge')}</Button>
            </div>
          </div>
        )}
        {error && <p className="mt-3 text-center text-sm text-error">{error}</p>}
      </div>
    </Modal>
  );
}

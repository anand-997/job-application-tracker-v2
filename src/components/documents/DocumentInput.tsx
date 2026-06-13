'use client';

import { useRef, useState } from 'react';
import { ClipboardList, Upload, Eye, X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { extractFileText, ExtractionError } from '@/lib/extract-text';
import { wordCount, cn } from '@/lib/utils';
import { useT } from '@/i18n/I18nProvider';
import { Segmented, Textarea } from '@/components/ui/primitives';

export interface DocValue {
  text?: string;
  fileName?: string;
  source?: 'paste' | 'upload';
}

export function DocumentInput({
  kind, value, onChange, onView,
}: {
  kind: 'jd' | 'resume';
  value: DocValue;
  onChange: (v: DocValue) => void;
  onView: (text: string, title: string) => void;
}) {
  const { t } = useT();
  const [tab, setTab] = useState<'paste' | 'upload'>(value.source ?? 'paste');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const words = value.text ? wordCount(value.text) : 0;
  const placeholder = kind === 'jd' ? t('docs.jdPlaceholder') : t('docs.resumePlaceholder');
  const title = kind === 'jd' ? t('fields.jobDescription') : t('fields.resumeUsed');

  async function handleFile(file: File) {
    setError(null);
    setWarning(null);
    if (value.text && !window.confirm(t('docs.replaceConfirm'))) return;
    setBusy(true);
    try {
      const res = await extractFileText(file);
      onChange({ text: res.text, fileName: file.name, source: 'upload' });
      if (res.warning) setWarning(res.warning);
    } catch (err) {
      setError(err instanceof ExtractionError ? err.message : 'Extraction failed. Please paste the text.');
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    onChange({ text: undefined, fileName: undefined, source: undefined });
    setError(null);
    setWarning(null);
  }

  return (
    <div className="rounded-xl border border-border surface-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-text-secondary">{title}</span>
        <Segmented
          size="sm"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'paste', label: <span className="flex items-center gap-1"><ClipboardList className="h-3 w-3" />{t('docs.paste')}</span> },
            { value: 'upload', label: <span className="flex items-center gap-1"><Upload className="h-3 w-3" />{t('docs.upload')}</span> },
          ]}
        />
      </div>

      {tab === 'paste' ? (
        <Textarea
          value={value.text ?? ''}
          onChange={(e) => onChange({ text: e.target.value || undefined, fileName: value.fileName, source: 'paste' })}
          placeholder={placeholder}
          className="min-h-[110px] font-mono text-xs"
        />
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void handleFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors',
            dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50',
          )}
        >
          {busy ? <Loader2 className="h-6 w-6 animate-spin text-accent" /> : <Upload className="h-6 w-6 text-text-muted" />}
          <span className="text-xs text-text-secondary">{busy ? t('docs.extracting') : t('docs.dropZone')}</span>
          <span className="text-[11px] text-text-muted">{t('docs.supported')}</span>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ''; }}
          />
        </div>
      )}

      {/* Status line */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
        {value.text ? (
          <span className="inline-flex items-center gap-1 text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t('docs.extracted', { n: words })}{value.fileName ? ` · ${value.fileName}` : ''}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-text-muted">
            <AlertTriangle className="h-3.5 w-3.5" />{kind === 'jd' ? t('docs.noJd') : t('docs.noResume')}
          </span>
        )}
        {value.text && (
          <>
            <button type="button" onClick={() => onView(value.text!, title)} className="inline-flex items-center gap-1 text-accent hover:underline">
              <Eye className="h-3.5 w-3.5" />{t('docs.view')}
            </button>
            <button type="button" onClick={clear} className="inline-flex items-center gap-1 text-text-muted hover:text-error">
              <X className="h-3.5 w-3.5" />{t('docs.clear')}
            </button>
          </>
        )}
      </div>

      {warning && <p className="mt-1.5 text-[11px] text-warning">⚠️ {warning}</p>}
      {error && <p className="mt-1.5 text-[11px] text-error">{error}</p>}
    </div>
  );
}

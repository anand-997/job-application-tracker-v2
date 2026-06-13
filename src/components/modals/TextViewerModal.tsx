'use client';

import { useMemo, useState } from 'react';
import { Search, Copy, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/primitives';
import { useT } from '@/i18n/I18nProvider';

export function TextViewerModal({
  open, onClose, title, text,
}: { open: boolean; onClose: () => void; title: string; text: string }) {
  const { t } = useT();
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState(false);

  const highlighted = useMemo(() => {
    if (!q.trim()) return [text];
    const parts: (string | { hit: string })[] = [];
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    let last = 0;
    for (const m of text.matchAll(re)) {
      const idx = m.index ?? 0;
      if (idx > last) parts.push(text.slice(last, idx));
      parts.push({ hit: m[0] });
      last = idx + m[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  }, [text, q]);

  function copyAll() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <div className="p-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('docs.searchWithin')} className="pl-9" />
        </div>
        <div className="scroll-thin max-h-[55vh] overflow-y-auto whitespace-pre-wrap rounded-xl border border-border surface-input p-3 font-mono text-xs leading-relaxed text-text-secondary">
          {highlighted.map((p, i) =>
            typeof p === 'string'
              ? <span key={i}>{p}</span>
              : <mark key={i} className="rounded bg-warning/40 text-text-primary">{p.hit}</mark>,
          )}
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={copyAll} className="inline-flex items-center gap-1.5 rounded-lg bg-bg-hover px-3 py-1.5 text-xs font-medium text-text-primary hover:opacity-90">
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t('docs.copied') : t('docs.copyAll')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

'use client';

import { X } from 'lucide-react';
import type { FilterState } from '@/types';
import { STATUS_LABELS, SOURCE_CONFIG } from '@/lib/constants';
import { useT } from '@/i18n/I18nProvider';

export function FilterChips({ filters, onChange }: { filters: FilterState; onChange: (f: FilterState) => void }) {
  const { t, lang } = useT();
  const chips: { key: string; label: string; remove: () => void }[] = [];

  const removeFromArr = (k: keyof FilterState, v: string) => {
    const arr = (filters[k] as string[] | undefined)?.filter((x) => x !== v);
    onChange({ ...filters, [k]: arr && arr.length ? arr : undefined });
  };

  filters.status?.forEach((s) => chips.push({ key: `st-${s}`, label: lang === 'hi' ? STATUS_LABELS[s].hi : STATUS_LABELS[s].en, remove: () => removeFromArr('status', s) }));
  filters.source?.forEach((s) => chips.push({ key: `sr-${s}`, label: SOURCE_CONFIG[s].label, remove: () => removeFromArr('source', s) }));
  filters.priority?.forEach((p) => chips.push({ key: `pr-${p}`, label: t(`priority.${p}`), remove: () => removeFromArr('priority', p) }));
  filters.workMode?.forEach((w) => chips.push({ key: `wm-${w}`, label: t(`workMode.${w}`), remove: () => removeFromArr('workMode', w) }));
  filters.jobType?.forEach((j) => chips.push({ key: `jt-${j}`, label: t(`jobType.${j}`), remove: () => removeFromArr('jobType', j) }));
  if (filters.salaryMin != null) chips.push({ key: 'smin', label: `≥ ${filters.salaryMin}`, remove: () => onChange({ ...filters, salaryMin: undefined }) });
  if (filters.salaryMax != null) chips.push({ key: 'smax', label: `≤ ${filters.salaryMax}`, remove: () => onChange({ ...filters, salaryMax: undefined }) });
  if (filters.hasJD) chips.push({ key: 'jd', label: t('filters.hasJd'), remove: () => onChange({ ...filters, hasJD: undefined }) });
  if (filters.hasResume) chips.push({ key: 'cv', label: t('filters.hasResume'), remove: () => onChange({ ...filters, hasResume: undefined }) });
  if (filters.missingDocs) chips.push({ key: 'miss', label: t('filters.missingDocs'), remove: () => onChange({ ...filters, missingDocs: undefined }) });
  if (filters.followUpOverdue) chips.push({ key: 'fuo', label: t('filters.followUpOverdue'), remove: () => onChange({ ...filters, followUpOverdue: undefined }) });
  if (filters.offerDeadlineSoon) chips.push({ key: 'ods', label: t('filters.offerSoon'), remove: () => onChange({ ...filters, offerDeadlineSoon: undefined }) });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-4 py-2">
      {chips.map((c) => (
        <button key={c.key} onClick={c.remove} className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent hover:bg-accent/25">
          {c.label}<X className="h-3 w-3" />
        </button>
      ))}
      <button onClick={() => onChange({})} className="text-xs text-text-muted hover:text-text-primary">{t('filters.clearAll')}</button>
    </div>
  );
}

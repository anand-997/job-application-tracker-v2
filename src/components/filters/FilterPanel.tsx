'use client';

import { useState } from 'react';
import { Trash2, Bookmark } from 'lucide-react';
import type { FilterState, StatusValue, SourceValue } from '@/types';
import {
  STATUS_ORDER, STATUS_CONFIG, STATUS_LABELS, SOURCE_ORDER, SOURCE_CONFIG,
  PRIORITY_ORDER, WORK_MODE_ORDER, JOB_TYPE_ORDER,
} from '@/lib/constants';
import { useApp } from '@/context/AppProvider';
import { useT } from '@/i18n/I18nProvider';
import { Modal } from '@/components/ui/Modal';
import { Button, Input, Switch } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

export function FilterPanel({
  open, onClose, filters, onChange,
}: { open: boolean; onClose: () => void; filters: FilterState; onChange: (f: FilterState) => void }) {
  const { state, savePreset, deletePreset } = useApp();
  const { t, lang } = useT();
  const [presetName, setPresetName] = useState('');

  const toggleArr = <T extends string>(key: keyof FilterState, val: T) => {
    const arr = (filters[key] as T[] | undefined) ?? [];
    const next = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
    onChange({ ...filters, [key]: next.length ? next : undefined });
  };
  const isOn = <T extends string>(key: keyof FilterState, val: T) =>
    ((filters[key] as T[] | undefined) ?? []).includes(val);

  const statusLabel = (s: StatusValue) => (lang === 'hi' ? STATUS_LABELS[s].hi : STATUS_LABELS[s].en);

  return (
    <Modal open={open} onClose={onClose} title={t('filters.title')} size="lg">
      <div className="scroll-thin max-h-[65vh] space-y-5 overflow-y-auto p-5">
        {/* Status */}
        <Group title={t('filters.status')}>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_ORDER.map((s) => (
              <Chip key={s} active={isOn('status', s)} color={STATUS_CONFIG[s].color} onClick={() => toggleArr<StatusValue>('status', s)}>
                {STATUS_CONFIG[s].icon} {statusLabel(s)}
              </Chip>
            ))}
          </div>
        </Group>

        {/* Source */}
        <Group title={t('filters.source')}>
          <div className="flex flex-wrap gap-1.5">
            {SOURCE_ORDER.map((s) => (
              <Chip key={s} active={isOn('source', s)} color={SOURCE_CONFIG[s].color} onClick={() => toggleArr<SourceValue>('source', s)}>
                {SOURCE_CONFIG[s].icon} {SOURCE_CONFIG[s].label}
              </Chip>
            ))}
          </div>
        </Group>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Group title={t('filters.priority')}>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITY_ORDER.map((p) => <Chip key={p} active={isOn('priority', p)} onClick={() => toggleArr('priority', p)}>{t(`priority.${p}`)}</Chip>)}
            </div>
          </Group>
          <Group title={t('filters.workMode')}>
            <div className="flex flex-wrap gap-1.5">
              {WORK_MODE_ORDER.map((w) => <Chip key={w} active={isOn('workMode', w)} onClick={() => toggleArr('workMode', w)}>{t(`workMode.${w}`)}</Chip>)}
            </div>
          </Group>
          <Group title={t('filters.jobType')}>
            <div className="flex flex-wrap gap-1.5">
              {JOB_TYPE_ORDER.map((j) => <Chip key={j} active={isOn('jobType', j)} onClick={() => toggleArr('jobType', j)}>{t(`jobType.${j}`)}</Chip>)}
            </div>
          </Group>
        </div>

        {/* Salary */}
        <Group title={t('filters.salaryRange')}>
          <div className="flex items-center gap-2">
            <Input type="number" placeholder="Min" value={filters.salaryMin ?? ''} onChange={(e) => onChange({ ...filters, salaryMin: e.target.value ? Number(e.target.value) : undefined })} />
            <span className="text-text-muted">–</span>
            <Input type="number" placeholder="Max" value={filters.salaryMax ?? ''} onChange={(e) => onChange({ ...filters, salaryMax: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
        </Group>

        {/* Toggles */}
        <Group title={t('filters.documents')}>
          <div className="space-y-2">
            <ToggleRow label={t('filters.hasJd')} checked={!!filters.hasJD} onChange={(v) => onChange({ ...filters, hasJD: v || undefined })} />
            <ToggleRow label={t('filters.hasResume')} checked={!!filters.hasResume} onChange={(v) => onChange({ ...filters, hasResume: v || undefined })} />
            <ToggleRow label={t('filters.missingDocs')} checked={!!filters.missingDocs} onChange={(v) => onChange({ ...filters, missingDocs: v || undefined })} />
            <ToggleRow label={t('filters.followUpOverdue')} checked={!!filters.followUpOverdue} onChange={(v) => onChange({ ...filters, followUpOverdue: v || undefined })} />
            <ToggleRow label={t('filters.offerSoon')} checked={!!filters.offerDeadlineSoon} onChange={(v) => onChange({ ...filters, offerDeadlineSoon: v || undefined })} />
          </div>
        </Group>

        {/* Saved presets */}
        <Group title={t('filters.presets')}>
          <div className="mb-2 flex gap-2">
            <Input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder={t('filters.presetName')} />
            <Button variant="secondary" onClick={() => { if (presetName.trim()) { savePreset(presetName.trim(), filters); setPresetName(''); } }}>
              <Bookmark className="h-4 w-4" />{t('filters.savePreset')}
            </Button>
          </div>
          {state.savedFilters.length === 0 ? (
            <p className="text-xs text-text-muted">{t('filters.noPresets')}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {state.savedFilters.map((p) => (
                <span key={p.id} className="inline-flex items-center gap-1 rounded-lg border border-border surface-card px-2 py-1 text-xs">
                  <button onClick={() => onChange(p.filters)} className="text-text-primary hover:text-accent">{p.name}</button>
                  <button onClick={() => deletePreset(p.id)} aria-label="Delete preset" className="text-text-muted hover:text-error"><Trash2 className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </Group>
      </div>

      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <Button variant="ghost" onClick={() => onChange({})}>{t('filters.clearAll')}</Button>
        <Button variant="primary" onClick={onClose}>{t('filters.apply')}</Button>
      </div>
    </Modal>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</h4>
      {children}
    </div>
  );
}

function Chip({ active, color, onClick, children }: { active: boolean; color?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn('rounded-full border px-2.5 py-1 text-xs font-medium transition-colors', active ? 'text-white' : 'border-border text-text-secondary hover:bg-bg-hover')}
      style={active ? { background: color ?? 'var(--accent)', borderColor: color ?? 'var(--accent)' } : undefined}
    >
      {children}
    </button>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-primary">{label}</span>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

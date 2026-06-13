'use client';

import { useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, Download, Star } from 'lucide-react';
import type { JobApplication, StatusValue } from '@/types';
import { STATUS_CONFIG, STATUS_LABELS, STATUS_ORDER, SOURCE_CONFIG, PRIORITY_CONFIG } from '@/lib/constants';
import { formatShortDate, daysSince, formatSalaryRange, downloadJSON, cn } from '@/lib/utils';
import { useApp } from '@/context/AppProvider';
import { useT } from '@/i18n/I18nProvider';
import { buildExport } from '@/lib/export-import';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { Popover, MenuItem } from '@/components/ui/Popover';
import { Button, CheckRow } from '@/components/ui/primitives';

type Col = 'company' | 'role' | 'status' | 'source' | 'workMode' | 'resume' | 'salary' | 'appliedDate' | 'followUp' | 'daysSince' | 'priority';

export function TableView({ apps, onOpen }: { apps: JobApplication[]; onOpen: (app: JobApplication) => void }) {
  const { state, changeStatus, deleteApplication } = useApp();
  const { t, lang } = useT();
  const [sortCol, setSortCol] = useState<Col>('appliedDate');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(0);

  const statusLabel = (s: StatusValue) => (lang === 'hi' ? STATUS_LABELS[s].hi : STATUS_LABELS[s].en);

  const sorted = useMemo(() => {
    const val = (a: JobApplication): string | number => {
      switch (sortCol) {
        case 'company': return a.company.toLowerCase();
        case 'role': return a.role.toLowerCase();
        case 'status': return STATUS_ORDER.indexOf(a.status);
        case 'source': return a.source;
        case 'workMode': return a.workMode;
        case 'resume': return a.resumeVersion ?? '';
        case 'salary': return a.salaryMax ?? a.salaryMin ?? 0;
        case 'appliedDate': return a.appliedDate;
        case 'followUp': return a.followUpDate ?? '';
        case 'daysSince': return daysSince(a.appliedDate);
        case 'priority': return ['low', 'medium', 'high', 'dream'].indexOf(a.priority);
      }
    };
    const copy = [...apps].sort((a, b) => {
      const va = val(a); const vb = val(b);
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [apps, sortCol, dir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / perPage));
  const pageRows = sorted.slice(page * perPage, page * perPage + perPage);

  function toggleSort(col: Col) {
    if (sortCol === col) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setDir('asc'); }
  }
  function toggleAll() {
    setSelected((prev) => (prev.size === pageRows.length ? new Set() : new Set(pageRows.map((a) => a.id))));
  }
  function toggleOne(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function exportSelected() {
    const chosen = apps.filter((a) => selected.has(a.id));
    downloadJSON(buildExport({ ...state, applications: chosen }), 'jobtracker-selected.json');
  }

  const headers: { col: Col; label: string }[] = [
    { col: 'company', label: t('table.company') },
    { col: 'role', label: t('table.role') },
    { col: 'status', label: t('table.status') },
    { col: 'source', label: t('table.source') },
    { col: 'workMode', label: t('table.workMode') },
    { col: 'resume', label: t('table.resumeVersion') },
    { col: 'salary', label: t('table.salary') },
    { col: 'appliedDate', label: t('table.appliedDate') },
    { col: 'followUp', label: t('table.followUp') },
    { col: 'daysSince', label: t('table.daysSince') },
    { col: 'priority', label: t('table.priority') },
  ];

  return (
    <div className="flex h-full flex-col px-4 pb-4">
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2">
          <span className="text-sm font-medium text-text-primary">{t('table.selected', { n: selected.size })}</span>
          <Popover
            width="w-48"
            trigger={({ toggle }) => <Button size="sm" variant="secondary" onClick={toggle}>{t('table.bulkStatus')}</Button>}
          >
            {(close) => (
              <div className="max-h-64 overflow-y-auto">
                {STATUS_ORDER.map((s) => (
                  <MenuItem key={s} icon={<span>{STATUS_CONFIG[s].icon}</span>} onClick={() => { selected.forEach((id) => changeStatus(id, s)); setSelected(new Set()); close(); }}>
                    {statusLabel(s)}
                  </MenuItem>
                ))}
              </div>
            )}
          </Popover>
          <Button size="sm" variant="secondary" onClick={exportSelected}><Download className="h-3.5 w-3.5" />{t('table.bulkExport')}</Button>
          <Button size="sm" variant="danger" onClick={() => { selected.forEach((id) => deleteApplication(id)); setSelected(new Set()); }}>
            <Trash2 className="h-3.5 w-3.5" />{t('table.bulkDelete')}
          </Button>
        </div>
      )}

      <div className="scroll-thin flex-1 overflow-auto rounded-xl border border-border surface">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="sticky top-0 z-10 surface-card text-left text-xs text-text-muted">
            <tr className="border-b border-border">
              <th className="w-10 px-3 py-2.5">
                <CheckRow checked={pageRows.length > 0 && selected.size === pageRows.length} onChange={toggleAll}><span className="sr-only">all</span></CheckRow>
              </th>
              {headers.map((h) => (
                <th key={h.col} className="whitespace-nowrap px-3 py-2.5 font-medium">
                  <button onClick={() => toggleSort(h.col)} className="inline-flex items-center gap-1 hover:text-text-primary">
                    {h.label}
                    {sortCol === h.col && (dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((a) => (
              <tr key={a.id} className="border-b border-border transition-colors hover:bg-bg-hover">
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <CheckRow checked={selected.has(a.id)} onChange={() => toggleOne(a.id)}><span className="sr-only">select</span></CheckRow>
                </td>
                <td className="cursor-pointer px-3 py-2" onClick={() => onOpen(a)}>
                  <div className="flex items-center gap-2">
                    <CompanyLogo company={a.company} size={24} />
                    <span className="font-medium text-text-primary">{a.company}</span>
                    {a.isFavorite && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                  </div>
                </td>
                <td className="cursor-pointer px-3 py-2 text-text-secondary" onClick={() => onOpen(a)}>{a.role}</td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={a.status}
                    onChange={(e) => changeStatus(a.id, e.target.value as StatusValue)}
                    className="cursor-pointer rounded-md border border-border bg-transparent px-1.5 py-1 text-xs"
                    style={{ color: STATUS_CONFIG[a.status].color }}
                  >
                    {STATUS_ORDER.map((s) => <option key={s} value={s} className="text-text-primary">{statusLabel(s)}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2 text-text-secondary">{SOURCE_CONFIG[a.source].icon} {SOURCE_CONFIG[a.source].label}</td>
                <td className="px-3 py-2 text-text-secondary">{t(`workMode.${a.workMode}`)}</td>
                <td className="px-3 py-2 text-text-secondary">{a.resumeVersion ?? '—'}</td>
                <td className="px-3 py-2 font-mono text-xs text-text-secondary">{formatSalaryRange(a) ?? '—'}</td>
                <td className="px-3 py-2 text-text-secondary">{formatShortDate(a.appliedDate)}</td>
                <td className="px-3 py-2 text-text-secondary">{a.followUpDate ? formatShortDate(a.followUpDate) : '—'}</td>
                <td className="px-3 py-2 text-text-secondary">{daysSince(a.appliedDate)}</td>
                <td className="px-3 py-2">
                  <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ color: PRIORITY_CONFIG[a.priority].color, background: `${PRIORITY_CONFIG[a.priority].color}1a` }}>
                    {t(`priority.${a.priority}`)}
                  </span>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr><td colSpan={12} className="px-3 py-10 text-center text-text-muted">{t('table.noRows')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
        <div className="flex items-center gap-2">
          <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(0); }} className="rounded-md border border-border bg-transparent px-2 py-1">
            {[25, 50, 100].map((n) => <option key={n} value={n} className="text-text-primary">{n}</option>)}
          </select>
          <span>{t('table.perPage')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>←</Button>
          <span>{page + 1} / {pageCount}</span>
          <Button size="sm" variant="ghost" disabled={page >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>→</Button>
        </div>
      </div>
    </div>
  );
}

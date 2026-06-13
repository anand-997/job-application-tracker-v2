'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronDown, Plus, Inbox } from 'lucide-react';
import type { JobApplication, StatusValue } from '@/types';
import { STATUS_CONFIG, STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/I18nProvider';
import { SortableJobCard } from './JobCard';

export function KanbanColumn({
  status, apps, collapsed, onToggle, onOpen, onEdit, onAdd, isOver,
}: {
  status: StatusValue;
  apps: JobApplication[];
  collapsed: boolean;
  onToggle: () => void;
  onOpen: (app: JobApplication) => void;
  onEdit: (app: JobApplication) => void;
  onAdd: (status: StatusValue) => void;
  isOver: boolean;
}) {
  const { t } = useT();
  const cfg = STATUS_CONFIG[status];
  const { setNodeRef } = useDroppable({ id: `col:${status}`, data: { type: 'column', status } });

  if (collapsed) {
    return (
      <div className="flex w-12 shrink-0 flex-col items-center gap-2 rounded-xl border border-border surface-card py-3">
        <button onClick={onToggle} aria-label="Expand column" className="text-text-secondary hover:text-text-primary">
          <ChevronDown className="h-4 w-4 -rotate-90" />
        </button>
        <span className="text-lg" aria-hidden>{cfg.icon}</span>
        <span
          className="mt-1 flex-1 text-xs font-medium text-text-secondary"
          style={{ writingMode: 'vertical-rl' }}
        >
          {STATUS_LABELS[status].en} · {apps.length}
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-[300px] shrink-0 flex-col">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 mb-2 flex items-center gap-2 rounded-xl border border-border surface-card px-3 py-2 backdrop-blur"
        style={{ borderTop: `2px solid ${cfg.color}` }}
      >
        <span className="text-base" aria-hidden>{cfg.icon}</span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-semibold text-text-primary">{STATUS_LABELS[status].en}</div>
          <div className="truncate font-hindi text-[11px] text-text-muted">{STATUS_LABELS[status].hi}</div>
        </div>
        <span className="rounded-full bg-bg-hover px-2 py-0.5 text-xs font-semibold text-text-secondary">{apps.length}</span>
        <button onClick={() => onAdd(status)} aria-label={t('empty.addJob')} className="text-text-muted hover:text-text-primary">
          <Plus className="h-4 w-4" />
        </button>
        <button onClick={onToggle} aria-label="Collapse column" className="text-text-muted hover:text-text-primary">
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div
        ref={setNodeRef}
        className={cn(
          'scroll-thin flex min-h-[120px] flex-1 flex-col gap-2 overflow-y-auto rounded-xl border border-dashed p-2 transition-colors',
          isOver ? 'border-2' : 'border-transparent',
        )}
        style={isOver ? { borderColor: cfg.color, background: `${cfg.color}0f` } : undefined}
      >
        <SortableContext items={apps.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          {apps.map((app) => (
            <SortableJobCard key={app.id} app={app} onOpen={() => onOpen(app)} onEdit={() => onEdit(app)} />
          ))}
        </SortableContext>

        {apps.length === 0 && (
          <button
            onClick={() => onAdd(status)}
            className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-3 py-6 text-center text-text-muted transition-colors hover:border-accent/50 hover:text-text-secondary"
          >
            <Inbox className="h-5 w-5" />
            <span className="text-xs">{t('empty.column')}</span>
            <span className="text-xs font-medium text-accent">+ {t('empty.addJob')}</span>
          </button>
        )}
      </div>
    </div>
  );
}

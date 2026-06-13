'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import {
  Star, MoreVertical, ExternalLink, Copy, Pencil, Trash2,
  CalendarPlus, Files, AlertTriangle, Clock, FileText,
} from 'lucide-react';
import { useState } from 'react';
import type { JobApplication } from '@/types';
import {
  SOURCE_CONFIG, STATUS_CONFIG, STATUS_LABELS, PRIORITY_CONFIG, STATUS_ORDER,
} from '@/lib/constants';
import { cn, formatShortDate, daysSince, formatSalaryRange, daysBetween } from '@/lib/utils';
import { useApp } from '@/context/AppProvider';
import { useT } from '@/i18n/I18nProvider';
import { Badge } from '@/components/ui/primitives';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { Popover, MenuItem } from '@/components/ui/Popover';

export function JobCardView({
  app, onOpen, onEdit, dragging,
}: { app: JobApplication; onOpen?: () => void; onEdit?: () => void; dragging?: boolean }) {
  const { toggleFavorite, duplicateApplication, deleteApplication, changeStatus, addRound } = useApp();
  const { t, lang } = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusSub, setStatusSub] = useState(false);

  const source = SOURCE_CONFIG[app.source];
  const priority = PRIORITY_CONFIG[app.priority];
  const salary = formatSalaryRange(app);

  const followUpOverdue = app.followUpDate ? daysBetween(app.followUpDate, new Date()) < 0 : false;
  const followUpDays = app.followUpDate ? Math.abs(daysBetween(app.followUpDate, new Date())) : 0;
  const offerDays = app.responseDeadline ? daysBetween(app.responseDeadline, new Date()) : null;
  const offerSoon = offerDays != null && offerDays >= 0 && offerDays <= 3 && (app.status === 'offer' || app.status === 'negotiating');

  const totalRounds = app.interviewRounds.length;
  const doneRounds = app.interviewRounds.filter((r) => r.outcome === 'passed' || !!r.completedDate).length;

  const statusLabel = (s: typeof app.status) => (lang === 'hi' ? STATUS_LABELS[s].hi : STATUS_LABELS[s].en);

  return (
    <div
      onClick={onOpen}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-xl border border-border surface-card p-3 shadow-card transition-all',
        'hover:border-accent/50 hover:shadow-drag',
        dragging && 'shadow-drag ring-2 ring-accent',
        app.status === 'ghosted' && 'opacity-80',
      )}
      style={{ borderLeft: `3px solid ${priority.color}` }}
    >
      {app.cardColor && (
        <span className="absolute right-0 top-0 h-10 w-10 -translate-y-5 translate-x-5 rotate-45" style={{ background: `${app.cardColor}33` }} />
      )}

      {/* Top row */}
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-sm" title={source.label} aria-hidden>{source.icon}</span>
        <CompanyLogo company={app.company} size={34} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate font-semibold text-text-primary">{app.company || '—'}</h4>
          </div>
          <p className="truncate text-xs text-text-secondary">{app.role || '—'}</p>
        </div>
        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
          <button
            aria-label={t('menu.favorite')}
            onClick={() => toggleFavorite(app.id)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg-hover"
          >
            <Star className={cn('h-4 w-4', app.isFavorite && 'fill-yellow-400 text-yellow-400')} />
          </button>
          <Popover
            open={menuOpen}
            onOpenChange={(v) => { setMenuOpen(v); if (!v) setStatusSub(false); }}
            trigger={({ toggle }) => (
              <button aria-label={t('menu.edit')} onClick={toggle} className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg-hover">
                <MoreVertical className="h-4 w-4" />
              </button>
            )}
          >
            {(close) => (
              statusSub ? (
                <div className="grid grid-cols-1 gap-0.5">
                  {STATUS_ORDER.map((s) => (
                    <MenuItem key={s} icon={<span>{STATUS_CONFIG[s].icon}</span>} onClick={() => { changeStatus(app.id, s); close(); }}>
                      {statusLabel(s)}
                    </MenuItem>
                  ))}
                </div>
              ) : (
                <>
                  <MenuItem icon={<Pencil className="h-4 w-4" />} onClick={() => { onEdit?.(); close(); }}>{t('menu.edit')}</MenuItem>
                  {app.jobUrl && (
                    <MenuItem icon={<ExternalLink className="h-4 w-4" />} onClick={() => { window.open(app.jobUrl, '_blank'); close(); }}>{t('menu.open')}</MenuItem>
                  )}
                  {app.jobUrl && (
                    <MenuItem icon={<Copy className="h-4 w-4" />} onClick={() => { navigator.clipboard.writeText(app.jobUrl); close(); }}>{t('menu.copyUrl')}</MenuItem>
                  )}
                  <MenuItem icon={<span className="text-xs">↗</span>} onClick={() => setStatusSub(true)}>{t('menu.changeStatus')}</MenuItem>
                  <MenuItem icon={<CalendarPlus className="h-4 w-4" />} onClick={() => { addRound(app.id); close(); }}>{t('menu.addRound')}</MenuItem>
                  <MenuItem icon={<Files className="h-4 w-4" />} onClick={() => { duplicateApplication(app.id); close(); }}>{t('menu.duplicate')}</MenuItem>
                  <div className="my-1 h-px bg-border" />
                  <MenuItem danger icon={<Trash2 className="h-4 w-4" />} onClick={() => { deleteApplication(app.id); close(); }}>{t('menu.delete')}</MenuItem>
                </>
              )
            )}
          </Popover>
        </div>
      </div>

      <div className="my-2.5 h-px bg-border" />

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <Badge color={app.workMode === 'remote' ? '#22C55E' : app.workMode === 'hybrid' ? '#6366F1' : '#F59E0B'}>
          {t(`workMode.${app.workMode}`)}
        </Badge>
        <Badge color="#64748B">{t(`jobType.${app.jobType}`)}</Badge>
        <Badge color={source.color}>{app.source === 'other' && app.sourceCustom ? app.sourceCustom : source.label}</Badge>
      </div>

      {/* Applied + salary */}
      <div className="mt-2.5 space-y-1 text-xs text-text-secondary">
        <div className="flex items-center gap-1.5">
          <span aria-hidden>📅</span>
          <span>{t('card.applied')}: {formatShortDate(app.appliedDate)}</span>
          <span className="text-text-muted">·</span>
          <span>{daysSince(app.appliedDate) === 0 ? t('card.today') : t('card.daysAgo', { n: daysSince(app.appliedDate) })}</span>
        </div>
        {salary && (
          <div className="flex items-center gap-1.5"><span aria-hidden>💰</span><span className="font-mono">{salary}</span></div>
        )}
      </div>

      {/* Warnings */}
      {(followUpOverdue || offerSoon) && (
        <div className="mt-2 space-y-1">
          {followUpOverdue && (
            <div className="flex items-center gap-1.5 rounded-md bg-error/10 px-2 py-1 text-[11px] font-medium text-error">
              <AlertTriangle className="h-3.5 w-3.5" />{t('card.followUpOverdue', { n: followUpDays })}
            </div>
          )}
          {offerSoon && (
            <div className="flex items-center gap-1.5 rounded-md bg-warning/10 px-2 py-1 text-[11px] font-medium text-warning">
              <Clock className="h-3.5 w-3.5" />{t('card.offerDeadline', { n: offerDays! })}
            </div>
          )}
        </div>
      )}

      {/* Skills */}
      {app.skills.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {app.skills.slice(0, 3).map((s) => (
            <span key={s} className="rounded-md bg-bg-hover px-1.5 py-0.5 text-[10px] text-text-secondary">{s}</span>
          ))}
          {app.skills.length > 3 && (
            <span className="rounded-md bg-bg-hover px-1.5 py-0.5 text-[10px] text-text-muted">{t('card.more', { n: app.skills.length - 3 })}</span>
          )}
        </div>
      )}

      {/* Resume + docs + rounds */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {app.resumeVersion && (
          <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
            <FileText className="h-3 w-3" />{app.resumeVersion}
          </span>
        )}
        <DocBadge label={t('card.jd')} active={!!app.jdText} />
        <DocBadge label={t('card.cv')} active={!!app.resumeText} />
        {totalRounds > 0 && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-text-muted">
            {Array.from({ length: totalRounds }).map((_, i) => (
              <span key={i} className={cn('h-1.5 w-1.5 rounded-full', i < doneRounds ? 'bg-accent' : 'bg-border')} />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

function DocBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium',
        active ? 'bg-teal-500/15 text-teal-400' : 'border border-border text-text-muted',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-teal-400' : 'border border-text-muted')} />
      {label}
    </span>
  );
}

// Sortable wrapper for dnd-kit
export function SortableJobCard({
  app, onOpen, onEdit,
}: { app: JobApplication; onOpen: () => void; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: app.id,
    data: { type: 'card', status: app.status },
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
      className={cn('touch-none', app.status === 'ghosted' && 'animate-float')}
    >
      <JobCardView app={app} onOpen={onOpen} onEdit={onEdit} />
    </motion.div>
  );
}

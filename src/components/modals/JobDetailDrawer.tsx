'use client';

import { useMemo, useState } from 'react';
import {
  Star, Pencil, ExternalLink, Copy, Trash2, Mail, Linkedin, Eye, FileText,
} from 'lucide-react';
import type { StatusValue } from '@/types';
import {
  STATUS_CONFIG, STATUS_LABELS, STATUS_ORDER, SOURCE_CONFIG, PRIORITY_CONFIG,
} from '@/lib/constants';
import { formatLongDate, formatShortDate, relativeTime, formatSalaryRange, daysBetween, cn, wordCount } from '@/lib/utils';
import { keywordMatch } from '@/lib/keyword-match';
import { useApp } from '@/context/AppProvider';
import { useT } from '@/i18n/I18nProvider';
import { Drawer } from '@/components/ui/Drawer';
import { Badge, Select, Button } from '@/components/ui/primitives';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { InterviewRoundsManager } from '@/components/interviews/InterviewRoundsManager';

export function JobDetailDrawer({
  appId, open, onClose, onEdit, onView, onRequestDelete,
}: {
  appId: string | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onView: (text: string, title: string) => void;
  onRequestDelete: () => void;
}) {
  const { state, changeStatus, toggleFavorite, updateApplication } = useApp();
  const { t, lang } = useT();
  const app = state.applications.find((a) => a.id === appId) ?? null;
  const [notesDraft, setNotesDraft] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);

  const match = useMemo(() => app ? keywordMatch(app.jdText, app.resumeText) : null, [app]);

  if (!app) return <Drawer open={open} onClose={onClose}><div /></Drawer>;

  const cfg = STATUS_CONFIG[app.status];
  const source = SOURCE_CONFIG[app.source];
  const salary = formatSalaryRange(app);
  const statusLabel = (s: StatusValue) => (lang === 'hi' ? STATUS_LABELS[s].hi : STATUS_LABELS[s].en);

  const header = (
    <div className="flex items-start gap-3">
      <CompanyLogo company={app.company} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span aria-hidden>{source.icon}</span>
          <h2 className="truncate font-display text-base font-semibold text-text-primary">{app.company}</h2>
        </div>
        <p className="truncate text-sm text-text-secondary">{app.role}</p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <Badge color={source.color}>{app.source === 'other' && app.sourceCustom ? app.sourceCustom : source.label}</Badge>
          <Badge color={PRIORITY_CONFIG[app.priority].color}>{t(`priority.${app.priority}`)}</Badge>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => toggleFavorite(app.id)} aria-label={t('menu.favorite')} className="rounded-lg p-2 text-text-muted hover:bg-bg-hover">
          <Star className={cn('h-4 w-4', app.isFavorite && 'fill-yellow-400 text-yellow-400')} />
        </button>
        <button onClick={onEdit} aria-label={t('actions.edit')} className="rounded-lg p-2 text-text-muted hover:bg-bg-hover">
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <Drawer open={open} onClose={onClose} header={header}>
      {/* Status bar */}
      <Section>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium" style={{ color: cfg.color, background: `${cfg.color}1a` }}>
            <span>{cfg.icon}</span>{statusLabel(app.status)}
          </span>
          <Select
            value={app.status}
            onChange={(e) => changeStatus(app.id, e.target.value as StatusValue)}
            className="ml-auto h-9 w-auto text-xs"
            aria-label={t('drawer.changeStatus')}
          >
            {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].icon} {statusLabel(s)}</option>)}
          </Select>
        </div>
      </Section>

      {/* Status timeline */}
      <Section title={t('drawer.statusTimeline')}>
        <ol className="relative ml-1 space-y-3 border-l border-border pl-4">
          {[...app.statusHistory].reverse().map((h, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-bg-secondary" style={{ background: STATUS_CONFIG[h.status].color }} />
              <div className="flex items-center gap-2 text-sm text-text-primary">
                {STATUS_CONFIG[h.status].icon} {statusLabel(h.status)}
                {h.changedBy === 'auto_ghost' && <span className="rounded bg-bg-hover px-1 text-[10px] text-text-muted">auto</span>}
              </div>
              <div className="text-[11px] text-text-muted">{formatLongDate(h.timestamp)} · {relativeTime(h.timestamp)}</div>
            </li>
          ))}
        </ol>
      </Section>

      {/* Key info */}
      <Section title={t('drawer.keyInfo')}>
        <div className="grid grid-cols-2 gap-3">
          <Info label={t('fields.appliedDate')} value={formatLongDate(app.appliedDate)} />
          <Info label={t('fields.workMode')} value={t(`workMode.${app.workMode}`)} />
          <Info label={t('fields.jobType')} value={t(`jobType.${app.jobType}`)} />
          <Info label={t('fields.location')} value={app.location || '—'} />
          <Info label={t('table.salary')} value={salary ?? '—'} />
          {app.atsPlatform && <Info label={t('fields.ats')} value={app.atsPlatform} />}
          {app.experienceRequired && <Info label={t('fields.experience')} value={app.experienceRequired} />}
        </div>
      </Section>

      {/* Documents */}
      <Section title={t('docs.documents')}>
        <DocRow
          label={t('fields.jobDescription')}
          fileName={app.jdFileName}
          text={app.jdText}
          addedAt={app.jdAddedAt}
          onView={() => onView(app.jdText!, app.jdFileName ?? t('fields.jobDescription'))}
          onRemove={() => updateApplication({ ...app, jdText: undefined, jdFileName: undefined, jdSource: undefined, jdAddedAt: undefined })}
          empty={t('docs.noJd')}
        />
        <DocRow
          label={t('fields.resumeUsed')}
          fileName={app.resumeFileName}
          version={app.resumeVersion}
          text={app.resumeText}
          addedAt={app.resumeAddedAt}
          onView={() => onView(app.resumeText!, app.resumeFileName ?? t('fields.resumeUsed'))}
          onRemove={() => updateApplication({ ...app, resumeText: undefined, resumeFileName: undefined, resumeVersion: undefined, resumeSource: undefined, resumeAddedAt: undefined })}
          empty={t('docs.noResume')}
        />

        {/* Extra feature: keyword match */}
        {match && (
          <div className="mt-3 rounded-xl border border-border surface-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">{t('docs.matchTitle')}</span>
              <span className="font-mono text-lg font-bold" style={{ color: matchColor(match.score) }}>{match.score}%</span>
            </div>
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-bg-hover">
              <div className="h-full rounded-full transition-all" style={{ width: `${match.score}%`, background: matchColor(match.score) }} />
            </div>
            <p className="mb-2 text-[11px] text-text-muted">{t('docs.matchHint')}</p>
            {match.missing.length > 0 && (
              <div>
                <span className="text-[11px] font-medium text-text-secondary">{t('docs.missing')}:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {match.missing.slice(0, 14).map((k) => (
                    <span key={k} className="rounded bg-error/10 px-1.5 py-0.5 text-[10px] text-error">{k}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Interview rounds */}
      <Section title={t('drawer.interviewRounds')}>
        <InterviewRoundsManager app={app} />
      </Section>

      {/* Contacts */}
      <Section title={t('drawer.contacts')}>
        {!app.recruiterName && !app.recruiterEmail && !app.referralName ? (
          <p className="text-xs text-text-muted">{t('drawer.noContacts')}</p>
        ) : (
          <div className="space-y-2 text-sm">
            {app.recruiterName && <div className="text-text-primary">{app.recruiterName}</div>}
            {app.recruiterEmail && (
              <button onClick={() => navigator.clipboard.writeText(app.recruiterEmail!)} className="flex items-center gap-2 text-text-secondary hover:text-accent">
                <Mail className="h-3.5 w-3.5" />{app.recruiterEmail}<Copy className="h-3 w-3" />
              </button>
            )}
            {app.recruiterLinkedIn && (
              <a href={app.recruiterLinkedIn} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-text-secondary hover:text-accent">
                <Linkedin className="h-3.5 w-3.5" />LinkedIn<ExternalLink className="h-3 w-3" />
              </a>
            )}
            {app.referralName && <div className="text-text-secondary">{t('fields.referralName')}: {app.referralName}</div>}
          </div>
        )}
      </Section>

      {/* Dates */}
      <Section title={t('drawer.dates')}>
        <div className="grid grid-cols-2 gap-3">
          <Info label={t('fields.followUpDate')} value={app.followUpDate ? formatShortDate(app.followUpDate) : '—'}
            danger={!!app.followUpDate && daysBetween(app.followUpDate, new Date()) < 0} />
          <Info label={t('drawer.interviewDate')} value={app.interviewDate ? formatShortDate(app.interviewDate) : '—'} />
          <Info label={t('fields.responseDeadline')} value={app.responseDeadline ? formatShortDate(app.responseDeadline) : '—'}
            danger={!!app.responseDeadline && daysBetween(app.responseDeadline, new Date()) <= 3} />
        </div>
      </Section>

      {/* Skills */}
      {app.skills.length > 0 && (
        <Section title={t('fields.skills')}>
          <div className="flex flex-wrap gap-1.5">
            {app.skills.map((s) => <span key={s} className="rounded-md bg-bg-hover px-2 py-0.5 text-xs text-text-secondary">{s}</span>)}
          </div>
        </Section>
      )}

      {/* Notes */}
      <Section title={t('drawer.notes')}>
        {editingNotes ? (
          <div>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              className="min-h-[80px] w-full rounded-lg surface-input px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
              autoFocus
            />
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="primary" onClick={() => { updateApplication({ ...app, notes: notesDraft }); setEditingNotes(false); }}>{t('actions.save')}</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingNotes(false)}>{t('actions.cancel')}</Button>
            </div>
          </div>
        ) : (
          <button onClick={() => { setNotesDraft(app.notes); setEditingNotes(true); }} className="w-full rounded-lg border border-dashed border-border px-3 py-2 text-left text-sm text-text-secondary hover:border-accent/50">
            {app.notes || <span className="text-text-muted">+ {t('drawer.notes')}…</span>}
          </button>
        )}
      </Section>

      {/* Activity log */}
      <Section title={t('drawer.activityLog')}>
        <ul className="space-y-1.5 text-xs text-text-secondary">
          {[...app.statusHistory].reverse().map((h, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_CONFIG[h.status].color }} />
              {t('drawer.statusChangedTo', { status: statusLabel(h.status) })} · {relativeTime(h.timestamp)}
            </li>
          ))}
        </ul>
      </Section>

      {/* Danger zone */}
      <div className="mt-4 rounded-xl border border-error/30 bg-error/5 p-3">
        <div className="mb-2 text-xs font-semibold text-error">{t('drawer.dangerZone')}</div>
        <Button size="sm" variant="danger" onClick={onRequestDelete}><Trash2 className="h-3.5 w-3.5" />{t('actions.delete')}</Button>
      </div>
    </Drawer>
  );
}

function matchColor(score: number): string {
  if (score >= 70) return '#22C55E';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border py-4 first:pt-0 last:border-0">
      {title && <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</h3>}
      {children}
    </section>
  );
}

function Info({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-text-muted">{label}</div>
      <div className={cn('text-sm font-medium', danger ? 'text-error' : 'text-text-primary')}>{value}</div>
    </div>
  );
}

function DocRow({
  label, fileName, version, text, addedAt, onView, onRemove, empty,
}: {
  label: string; fileName?: string; version?: string; text?: string; addedAt?: string;
  onView: () => void; onRemove: () => void; empty: string;
}) {
  const { t } = useT();
  if (!text) {
    return (
      <div className="mb-2 flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-text-muted">
        <FileText className="h-3.5 w-3.5" />{label}: {empty}
      </div>
    );
  }
  return (
    <div className="mb-2 rounded-xl border border-border surface-card p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-text-primary"><FileText className="h-4 w-4 text-teal-400" />{label}</div>
      <div className="mt-0.5 text-[11px] text-text-muted">
        {fileName ?? '—'}{version ? ` · ${version}` : ''}{addedAt ? ` · ${formatShortDate(addedAt)}` : ''} · {wordCount(text)} words
      </div>
      <div className="mt-2 flex gap-3 text-[11px]">
        <button onClick={onView} className="inline-flex items-center gap-1 text-accent hover:underline"><Eye className="h-3.5 w-3.5" />{t('docs.view')}</button>
        <button onClick={() => navigator.clipboard.writeText(text)} className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary"><Copy className="h-3.5 w-3.5" />{t('docs.copy')}</button>
        <button onClick={onRemove} className="inline-flex items-center gap-1 text-text-muted hover:text-error"><Trash2 className="h-3.5 w-3.5" />{t('docs.remove')}</button>
      </div>
    </div>
  );
}

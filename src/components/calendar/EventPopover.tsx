'use client';

import { ExternalLink, Copy, Pencil, ArrowRight, MapPin, AlertTriangle } from 'lucide-react';
import type { CalendarEvent } from '@/types';
import { useT } from '@/i18n/I18nProvider';
import { useToast } from '@/context/ToastProvider';
import { formatTimeRange } from '@/lib/calendar-utils';
import { Button } from '@/components/ui/primitives';

function fullDate(dateISO: string): string {
  const d = new Date(`${dateISO.slice(0, 10)}T00:00`);
  if (Number.isNaN(d.getTime())) return dateISO;
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}

// Self-contained detail card; rendered inside the Popover panel for a pill/block.
export function EventPopover({
  event, onOpenJob, close,
}: { event: CalendarEvent; onOpenJob: (id: string) => void; close: () => void }) {
  const { t } = useT();
  const { toast } = useToast();
  const isRound = event.type === 'interview_round';

  const when = event.isAllDay
    ? `${fullDate(event.date)} · ${t('calendar.allDay')}`
    : `${fullDate(event.date)} · ${formatTimeRange(event.time, event.endTime)}`;

  const open = () => { onOpenJob(event.applicationId); close(); };

  return (
    <div className="w-72 p-3">
      <div className="flex items-start gap-2">
        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: event.color }} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-text-primary">{event.title}</p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            {isRound && event.roundId ? `${when}` : when}
            {event.isOverdue && (
              <span className="ml-1 inline-flex items-center gap-0.5 text-error">
                <AlertTriangle className="h-3 w-3" />{t('calendar.overdue')}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="my-2.5 h-px bg-border" />

      <div className="space-y-1.5 text-xs text-text-secondary">
        {!isRound && <p>{event.role}</p>}
        {event.interviewer && <p>{event.interviewer}</p>}
        {event.meetPlatform === 'in_person' || event.location ? (
          event.location && <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-text-muted" />{event.location}</p>
        ) : null}
      </div>

      {(event.meetLink || event.location) && <div className="my-2.5 h-px bg-border" />}

      {event.meetLink && (
        <div className="flex flex-wrap gap-2">
          <a href={event.meetLink} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent/15">
            <ExternalLink className="h-3.5 w-3.5" />{t('calendar.meetLink')}
          </a>
          <button
            onClick={() => { void navigator.clipboard?.writeText(event.meetLink!); toast({ message: t('calendar.linkCopied'), variant: 'success' }); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-text-secondary hover:bg-bg-hover">
            <Copy className="h-3.5 w-3.5" />{t('calendar.copyLink')}
          </button>
        </div>
      )}

      {event.preparationNotes && (
        <>
          <div className="my-2.5 h-px bg-border" />
          <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">{t('round.preparationNotes')}</p>
          <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-xs text-text-secondary">{event.preparationNotes}</p>
        </>
      )}

      <div className="my-2.5 h-px bg-border" />

      <div className="flex justify-end gap-2">
        {isRound && (
          <Button size="sm" variant="secondary" onClick={open}><Pencil className="h-3.5 w-3.5" />{t('calendar.editRound')}</Button>
        )}
        <Button size="sm" variant="primary" onClick={open}>{t('calendar.openJob')}<ArrowRight className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

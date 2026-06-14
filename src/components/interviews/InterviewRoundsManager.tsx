'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { JobApplication, InterviewRound, MeetPlatform } from '@/types';
import { useApp } from '@/context/AppProvider';
import { useT } from '@/i18n/I18nProvider';
import { daysBetween, cn } from '@/lib/utils';
import { Button, Select, Input, Textarea } from '@/components/ui/primitives';

const TYPES: InterviewRound['type'][] = ['phone', 'video', 'onsite', 'technical', 'hr', 'assignment', 'final'];
const OUTCOMES: NonNullable<InterviewRound['outcome']>[] = ['pending', 'passed', 'failed', 'cancelled'];
const DURATIONS = [30, 45, 60, 90, 120];
const PLATFORMS: MeetPlatform[] = ['google_meet', 'zoom', 'teams', 'phone', 'in_person', 'other'];
const REMINDERS = ['none', '15', '30', '60', '1440'] as const;

export function InterviewRoundsManager({ app }: { app: JobApplication }) {
  const { addRound, updateRound, deleteRound } = useApp();
  const { t } = useT();

  return (
    <div className="space-y-2">
      {app.interviewRounds.length === 0 && (
        <p className="text-xs text-text-muted">{t('interview.noRounds')}</p>
      )}
      {app.interviewRounds.map((r) => {
        const overdue = r.scheduledDate && !r.outcome?.match(/passed|failed|cancelled/) &&
          !r.completedDate && daysBetween(r.scheduledDate, new Date()) < 0;
        return (
          <div key={r.id} className="rounded-xl border border-border surface-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">{t('interview.roundN', { n: r.roundNumber })}</span>
              <div className="flex items-center gap-2">
                {overdue && <span className="rounded-md bg-error/10 px-1.5 py-0.5 text-[10px] font-medium text-error">{t('interview.overdue')}</span>}
                <button onClick={() => deleteRound(app.id, r.id)} aria-label={t('actions.delete')} className="text-text-muted hover:text-error">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {(() => {
              const set = (patch: Partial<InterviewRound>) => updateRound(app.id, { ...r, ...patch });
              const platform = r.meetPlatform;
              const showMeetLink = platform == null || (platform !== 'phone' && platform !== 'in_person');
              const showLocation = r.type === 'onsite' || platform === 'in_person';
              return (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={r.type} onChange={(e) => set({ type: e.target.value as InterviewRound['type'] })} className="h-9 text-xs">
                      {TYPES.map((ty) => <option key={ty} value={ty}>{t(`interview.${ty}`)}</option>)}
                    </Select>
                    <Select
                      value={r.outcome ?? 'pending'}
                      onChange={(e) => set({ outcome: e.target.value as InterviewRound['outcome'] })}
                      className={cn('h-9 text-xs', r.outcome === 'passed' && 'text-success', r.outcome === 'failed' && 'text-error')}
                    >
                      {OUTCOMES.map((o) => <option key={o} value={o}>{t(`interview.${o}`)}</option>)}
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Input type="date" value={r.scheduledDate ?? ''} onChange={(e) => set({ scheduledDate: e.target.value || undefined })} className="h-9 text-xs" />
                    <Input type="time" value={r.scheduledTime ?? ''} onChange={(e) => set({ scheduledTime: e.target.value || undefined })} className="h-9 text-xs" aria-label={t('round.scheduledTime')} />
                    <Select value={String(r.durationMinutes ?? 60)} onChange={(e) => set({ durationMinutes: Number(e.target.value) })} className="h-9 text-xs" aria-label={t('round.duration')}>
                      {DURATIONS.map((d) => <option key={d} value={d}>{t(`round.durationOptions.${d}`)}</option>)}
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder={t('interview.interviewer')} value={r.interviewer ?? ''} onChange={(e) => set({ interviewer: e.target.value || undefined })} className="h-9 text-xs" />
                    <Input type="email" placeholder={t('round.interviewerEmail')} value={r.interviewerEmail ?? ''} onChange={(e) => set({ interviewerEmail: e.target.value || undefined })} className="h-9 text-xs" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Select value={platform ?? 'google_meet'} onChange={(e) => set({ meetPlatform: e.target.value as MeetPlatform })} className="h-9 text-xs" aria-label={t('round.platform')}>
                      {PLATFORMS.map((p) => <option key={p} value={p}>{t(`round.platformOptions.${p}`)}</option>)}
                    </Select>
                    <Select value={r.reminderMinutes == null ? 'none' : String(r.reminderMinutes)} onChange={(e) => set({ reminderMinutes: e.target.value === 'none' ? undefined : Number(e.target.value) })} className="h-9 text-xs" aria-label={t('round.reminder')}>
                      {REMINDERS.map((rm) => <option key={rm} value={rm}>{t(`round.reminderOptions.${rm}`)}</option>)}
                    </Select>
                  </div>

                  {showMeetLink && (
                    <Input type="url" placeholder={t('round.meetLink')} value={r.meetLink ?? ''} onChange={(e) => set({ meetLink: e.target.value || undefined })} className="h-9 text-xs" />
                  )}
                  {showLocation && (
                    <Input placeholder={t('round.location')} value={r.location ?? ''} onChange={(e) => set({ location: e.target.value || undefined })} className="h-9 text-xs" />
                  )}

                  <Textarea
                    placeholder={t('round.preparationNotesPlaceholder')}
                    value={r.preparationNotes ?? ''}
                    maxLength={500}
                    onChange={(e) => set({ preparationNotes: e.target.value || undefined })}
                    className="min-h-[60px] text-xs"
                  />
                </div>
              );
            })()}
          </div>
        );
      })}
      <Button size="sm" variant="secondary" onClick={() => addRound(app.id)} className="w-full">
        <Plus className="h-3.5 w-3.5" />{t('interview.addRound')}
      </Button>
    </div>
  );
}

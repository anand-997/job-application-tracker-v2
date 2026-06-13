'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { JobApplication, InterviewRound } from '@/types';
import { useApp } from '@/context/AppProvider';
import { useT } from '@/i18n/I18nProvider';
import { daysBetween, cn } from '@/lib/utils';
import { Button, Select, Input } from '@/components/ui/primitives';

const TYPES: InterviewRound['type'][] = ['phone', 'video', 'onsite', 'technical', 'hr', 'assignment', 'final'];
const OUTCOMES: NonNullable<InterviewRound['outcome']>[] = ['pending', 'passed', 'failed', 'cancelled'];

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
            <div className="grid grid-cols-2 gap-2">
              <Select value={r.type} onChange={(e) => updateRound(app.id, { ...r, type: e.target.value as InterviewRound['type'] })} className="h-9 text-xs">
                {TYPES.map((ty) => <option key={ty} value={ty}>{t(`interview.${ty}`)}</option>)}
              </Select>
              <Select
                value={r.outcome ?? 'pending'}
                onChange={(e) => updateRound(app.id, { ...r, outcome: e.target.value as InterviewRound['outcome'] })}
                className={cn('h-9 text-xs', r.outcome === 'passed' && 'text-success', r.outcome === 'failed' && 'text-error')}
              >
                {OUTCOMES.map((o) => <option key={o} value={o}>{t(`interview.${o}`)}</option>)}
              </Select>
              <Input type="date" value={r.scheduledDate ?? ''} onChange={(e) => updateRound(app.id, { ...r, scheduledDate: e.target.value || undefined })} className="h-9 text-xs" />
              <Input placeholder={t('interview.interviewer')} value={r.interviewer ?? ''} onChange={(e) => updateRound(app.id, { ...r, interviewer: e.target.value || undefined })} className="h-9 text-xs" />
            </div>
          </div>
        );
      })}
      <Button size="sm" variant="secondary" onClick={() => addRound(app.id)} className="w-full">
        <Plus className="h-3.5 w-3.5" />{t('interview.addRound')}
      </Button>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { JobApplication, StatusValue, SourceValue } from '@/types';
import {
  SOURCE_ORDER, SOURCE_CONFIG, STATUS_ORDER, STATUS_CONFIG, STATUS_LABELS,
  JOB_TYPE_ORDER, PRIORITY_ORDER, PRIORITY_CONFIG, CARD_COLORS,
} from '@/lib/constants';
import { blankApplication } from '@/lib/factory';
import { nowISO, cn } from '@/lib/utils';
import { useApp } from '@/context/AppProvider';
import { useT } from '@/i18n/I18nProvider';
import { useToast } from '@/context/ToastProvider';
import { Modal } from '@/components/ui/Modal';
import { Button, Field, Input, Select, Segmented } from '@/components/ui/primitives';
import { DocumentInput, type DocValue } from '@/components/documents/DocumentInput';

export function AddJobModal({
  open, onClose, editing, defaultStatus, onView,
}: {
  open: boolean;
  onClose: () => void;
  editing: JobApplication | null;
  defaultStatus?: StatusValue;
  onView: (text: string, title: string) => void;
}) {
  const { state, addApplication, updateApplication } = useApp();
  const { t, lang } = useT();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<JobApplication>(() => blankApplication(state.userPrefs));
  const [errors, setErrors] = useState<{ company?: boolean; role?: boolean }>({});

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setErrors({});
    if (editing) {
      setDraft({ ...editing });
    } else {
      const base = blankApplication(state.userPrefs);
      setDraft({ ...base, status: defaultStatus ?? 'applied' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, defaultStatus]);

  const set = <K extends keyof JobApplication>(key: K, val: JobApplication[K]) =>
    setDraft((d) => ({ ...d, [key]: val }));

  const statusLabel = (s: StatusValue) => (lang === 'hi' ? STATUS_LABELS[s].hi : STATUS_LABELS[s].en);

  const jdValue: DocValue = { text: draft.jdText, fileName: draft.jdFileName, source: draft.jdSource };
  const resumeValue: DocValue = { text: draft.resumeText, fileName: draft.resumeFileName, source: draft.resumeSource };

  function setJD(v: DocValue) {
    setDraft((d) => ({
      ...d,
      jdText: v.text, jdFileName: v.fileName, jdSource: v.source,
      jdAddedAt: v.text ? d.jdAddedAt ?? nowISO() : undefined,
    }));
  }
  function setResume(v: DocValue) {
    setDraft((d) => ({
      ...d,
      resumeText: v.text, resumeFileName: v.fileName, resumeSource: v.source,
      resumeAddedAt: v.text ? d.resumeAddedAt ?? nowISO() : undefined,
    }));
  }

  function validateStep1(): boolean {
    const e = { company: !draft.company.trim(), role: !draft.role.trim() };
    setErrors(e);
    return !e.company && !e.role;
  }

  function commit(addAnother: boolean) {
    if (!validateStep1()) { setStep(0); return; }
    // Keep statusHistory consistent if status changed during edit.
    let toSave = draft;
    if (editing) {
      if (editing.status !== draft.status) {
        toSave = {
          ...draft,
          statusHistory: [...draft.statusHistory, { status: draft.status, timestamp: nowISO(), changedBy: 'user' }],
        };
      }
      updateApplication(toSave);
    } else {
      toSave = {
        ...draft,
        statusHistory: [{ status: draft.status, timestamp: nowISO(), changedBy: 'user' }],
        createdAt: nowISO(), updatedAt: nowISO(), lastActivityDate: nowISO(),
      };
      addApplication(toSave);
    }
    toast({ message: editing ? t('drawer.addedToTracker') : `${draft.company} — ${draft.role}`, variant: 'success' });
    if (addAnother && !editing) {
      const base = blankApplication(state.userPrefs);
      setDraft({ ...base, status: draft.status });
      setStep(0);
    } else {
      onClose();
    }
  }

  const steps = [t('modal.step1'), t('modal.step2'), t('modal.step3')];

  return (
    <Modal open={open} onClose={onClose} size="xl" hideClose>
      {/* Custom header with stepper */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-text-primary">
            {editing ? t('modal.editJob') : t('modal.addJob')}
          </h2>
          <div className="mt-2 flex items-center gap-2">
            {steps.map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(i)}
                className="flex items-center gap-1.5"
              >
                <span className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors',
                  i === step ? 'bg-accent text-white' : i < step ? 'bg-success text-white' : 'bg-bg-hover text-text-muted',
                )}>{i + 1}</span>
                <span className={cn('hidden text-xs sm:inline', i === step ? 'text-text-primary' : 'text-text-muted')}>{s}</span>
                {i < steps.length - 1 && <span className="mx-1 h-px w-4 bg-border" />}
              </button>
            ))}
          </div>
        </div>
        <button aria-label={t('actions.close')} onClick={onClose} className="rounded-lg p-2 text-text-muted hover:bg-bg-hover">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="scroll-thin max-h-[60vh] overflow-y-auto px-5 py-4">
        {step === 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t('fields.company')} required error={errors.company ? t('fields.required') : undefined}>
              <Input value={draft.company} onChange={(e) => set('company', e.target.value)} placeholder="Infosys" autoFocus />
            </Field>
            <Field label={t('fields.role')} required error={errors.role ? t('fields.required') : undefined}>
              <Input value={draft.role} onChange={(e) => set('role', e.target.value)} placeholder="SDET Manager" />
            </Field>
            <Field label={t('fields.jobUrl')} className="sm:col-span-2">
              <Input value={draft.jobUrl} onChange={(e) => set('jobUrl', e.target.value)} placeholder="https://…" />
            </Field>
            <Field label={t('fields.source')}>
              <Select value={draft.source} onChange={(e) => set('source', e.target.value as SourceValue)}>
                {SOURCE_ORDER.map((s) => (
                  <option key={s} value={s}>{SOURCE_CONFIG[s].icon} {SOURCE_CONFIG[s].label}</option>
                ))}
              </Select>
            </Field>
            {draft.source === 'other' ? (
              <Field label={t('fields.sourceCustom')}>
                <Input value={draft.sourceCustom ?? ''} onChange={(e) => set('sourceCustom', e.target.value)} />
              </Field>
            ) : (
              <Field label={t('fields.status')}>
                <Select value={draft.status} onChange={(e) => set('status', e.target.value as StatusValue)}>
                  {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].icon} {statusLabel(s)}</option>)}
                </Select>
              </Field>
            )}
            {draft.source === 'other' && (
              <Field label={t('fields.status')}>
                <Select value={draft.status} onChange={(e) => set('status', e.target.value as StatusValue)}>
                  {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].icon} {statusLabel(s)}</option>)}
                </Select>
              </Field>
            )}
            <Field label={t('fields.appliedDate')}>
              <Input type="date" value={draft.appliedDate.slice(0, 10)} onChange={(e) => set('appliedDate', e.target.value)} />
            </Field>
            <Field label={t('fields.location')}>
              <Input value={draft.location} onChange={(e) => set('location', e.target.value)} placeholder="Bengaluru / Remote" />
            </Field>
            <Field label={t('fields.workMode')}>
              <Segmented
                value={draft.workMode}
                onChange={(v) => set('workMode', v)}
                options={[
                  { value: 'remote', label: t('workMode.remote') },
                  { value: 'hybrid', label: t('workMode.hybrid') },
                  { value: 'onsite', label: t('workMode.onsite') },
                ]}
              />
            </Field>
            <Field label={t('fields.jobType')}>
              <Select value={draft.jobType} onChange={(e) => set('jobType', e.target.value as JobApplication['jobType'])}>
                {JOB_TYPE_ORDER.map((j) => <option key={j} value={j}>{t(`jobType.${j}`)}</option>)}
              </Select>
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label={t('fields.salaryMin')}>
                <Input type="number" value={draft.salaryMin ?? ''} onChange={(e) => set('salaryMin', e.target.value ? Number(e.target.value) : undefined)} />
              </Field>
              <Field label={t('fields.salaryMax')}>
                <Input type="number" value={draft.salaryMax ?? ''} onChange={(e) => set('salaryMax', e.target.value ? Number(e.target.value) : undefined)} />
              </Field>
              <Field label={t('fields.currency')}>
                <Select value={draft.salaryCurrency} onChange={(e) => set('salaryCurrency', e.target.value as JobApplication['salaryCurrency'])}>
                  {['INR', 'USD', 'EUR', 'GBP'].map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label={t('fields.salaryType')}>
                <Select value={draft.salaryType} onChange={(e) => set('salaryType', e.target.value as JobApplication['salaryType'])}>
                  <option value="annual">{t('fields.annual')}</option>
                  <option value="monthly">{t('fields.monthly')}</option>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t('fields.experience')}>
                <Input value={draft.experienceRequired ?? ''} onChange={(e) => set('experienceRequired', e.target.value)} placeholder="3–5 years" />
              </Field>
              <Field label={t('fields.ats')}>
                <Input value={draft.atsPlatform ?? ''} onChange={(e) => set('atsPlatform', e.target.value)} placeholder="Greenhouse / Lever" />
              </Field>
            </div>
            <Field label={t('fields.skills')} hint={t('fields.skillsHint')}>
              <TagInput value={draft.skills} onChange={(v) => set('skills', v)} />
            </Field>

            <DocumentInput kind="jd" value={jdValue} onChange={setJD} onView={onView} />
            <div className="rounded-xl border border-border surface-card p-3">
              <Field label={t('fields.versionLabel')} className="mb-2">
                <Input value={draft.resumeVersion ?? ''} onChange={(e) => set('resumeVersion', e.target.value)} placeholder="QA_Lead_v3" />
              </Field>
              <DocumentInput kind="resume" value={resumeValue} onChange={setResume} onView={onView} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t('fields.recruiterName')}>
              <Input value={draft.recruiterName ?? ''} onChange={(e) => set('recruiterName', e.target.value)} />
            </Field>
            <Field label={t('fields.recruiterEmail')}>
              <Input type="email" value={draft.recruiterEmail ?? ''} onChange={(e) => set('recruiterEmail', e.target.value)} />
            </Field>
            <Field label={t('fields.recruiterLinkedIn')}>
              <Input value={draft.recruiterLinkedIn ?? ''} onChange={(e) => set('recruiterLinkedIn', e.target.value)} />
            </Field>
            <Field label={t('fields.referralName')}>
              <Input value={draft.referralName ?? ''} onChange={(e) => set('referralName', e.target.value)} />
            </Field>
            <Field label={t('fields.followUpDate')}>
              <Input type="date" value={draft.followUpDate ?? ''} onChange={(e) => set('followUpDate', e.target.value || undefined)} />
            </Field>
            {(draft.status === 'offer' || draft.status === 'negotiating') && (
              <Field label={t('fields.responseDeadline')}>
                <Input type="date" value={draft.responseDeadline ?? ''} onChange={(e) => set('responseDeadline', e.target.value || undefined)} />
              </Field>
            )}
            <Field label={t('fields.priority')} className="sm:col-span-2">
              <Segmented
                value={draft.priority}
                onChange={(v) => set('priority', v)}
                options={PRIORITY_ORDER.map((p) => ({ value: p, label: t(`priority.${p}`) }))}
              />
            </Field>
            <Field label={t('fields.tags')} className="sm:col-span-2">
              <TagInput value={draft.tags} onChange={(v) => set('tags', v)} />
            </Field>
            <Field label={t('fields.notes')} className="sm:col-span-2">
              <textarea
                value={draft.notes}
                onChange={(e) => set('notes', e.target.value)}
                className="min-h-[90px] w-full rounded-lg surface-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </Field>
            <Field label={t('fields.cardColor')} className="sm:col-span-2">
              <div className="flex gap-2">
                {CARD_COLORS.map((c) => (
                  <button
                    key={c || 'none'}
                    type="button"
                    onClick={() => set('cardColor', c || undefined)}
                    className={cn(
                      'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
                      draft.cardColor === c || (!draft.cardColor && !c) ? 'border-text-primary' : 'border-border',
                    )}
                    style={{ background: c || 'var(--bg-hover)' }}
                    aria-label={c || t('common.none')}
                  />
                ))}
              </div>
            </Field>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3">
        <Button variant="ghost" onClick={onClose}>{t('actions.cancel')}</Button>
        <div className="flex items-center gap-2">
          {step > 0 && <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>{t('modal.back')}</Button>}
          {step < 2 ? (
            <Button variant="primary" onClick={() => { if (step === 0 && !validateStep1()) return; setStep((s) => s + 1); }}>
              {t('modal.next')}
            </Button>
          ) : (
            <>
              {!editing && <Button variant="secondary" onClick={() => commit(true)}>{t('modal.saveAddAnother')}</Button>}
              <Button variant="primary" onClick={() => commit(false)}>{t('actions.save')}</Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Tag input ──
function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');
  function add() {
    const v = input.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setInput('');
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg surface-input px-2 py-1.5">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-1.5 py-0.5 text-xs text-accent">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== tag))} aria-label={`Remove ${tag}`}>
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); add(); }
          else if (e.key === 'Backspace' && !input && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
        className="min-w-[80px] flex-1 bg-transparent py-0.5 text-sm text-text-primary outline-none"
        placeholder="…"
      />
    </div>
  );
}

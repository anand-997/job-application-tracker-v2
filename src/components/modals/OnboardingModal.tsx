'use client';

import { useState } from 'react';
import { GraduationCap, Briefcase, Sparkles, FolderOpen, ArrowLeft, HardDriveDownload } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button, Input } from '@/components/ui/primitives';
import { useApp } from '@/context/AppProvider';
import { useT } from '@/i18n/I18nProvider';
import { useToast } from '@/context/ToastProvider';
import { cn } from '@/lib/utils';

export function OnboardingModal({ open }: { open: boolean }) {
  const { setPrefs, loadSample, backupSupported, linkDataFolder } = useApp();
  const { t } = useT();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [persona, setPersona] = useState<'student' | 'professional'>('student');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  // localStorage-only path (Skip / sample / unsupported browsers).
  function finish(withSample: boolean) {
    setPrefs({ persona, name: name.trim() || undefined, onboarded: true });
    if (withSample) loadSample();
  }

  // Link a data folder, then complete onboarding. Existing file → loads its data.
  async function chooseFolder() {
    setBusy(true);
    try {
      const res = await linkDataFolder();
      if (!res) return; // picker cancelled — stay on step 2
      if (res.mode === 'loaded') {
        setPrefs({ onboarded: true }); // file's own prefs already applied on load
        toast({ message: t('settings.backup.loaded', { n: res.count }), variant: 'success' });
      } else {
        setPrefs({ persona, name: name.trim() || undefined, onboarded: true });
        toast({ message: t('onboarding.folderCreated'), variant: 'success' });
      }
    } catch {
      toast({ message: t('settings.backup.syncFailed'), variant: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={() => finish(false)} size="md" hideClose>
      <div className="p-6">
        <div className="mb-4 flex items-center gap-2 text-accent">
          <Sparkles className="h-5 w-5" />
          <span className="font-mono text-xs uppercase tracking-widest">{t('app.motto')}</span>
        </div>

        {step === 1 ? (
          <>
            <h2 className="font-display text-2xl font-bold text-text-primary">{t('onboarding.welcome')}</h2>
            <p className="mt-1.5 text-sm text-text-secondary">{t('onboarding.subtitle')}</p>

            <div className="mt-5 text-xs font-medium text-text-secondary">{t('onboarding.iAmA')}</div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <PersonaCard
                active={persona === 'student'} onClick={() => setPersona('student')}
                icon={<GraduationCap className="h-5 w-5" />} title={t('onboarding.student')} desc={t('onboarding.studentDesc')}
              />
              <PersonaCard
                active={persona === 'professional'} onClick={() => setPersona('professional')}
                icon={<Briefcase className="h-5 w-5" />} title={t('onboarding.professional')} desc={t('onboarding.professionalDesc')}
              />
            </div>

            <div className="mt-4">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('onboarding.yourName')} />
            </div>

            <div className="mt-5">
              <Button variant="primary" className="w-full" onClick={() => setStep(2)}>{t('onboarding.next')}</Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display text-2xl font-bold text-text-primary">{t('onboarding.chooseFolderTitle')}</h2>

            {backupSupported ? (
              <>
                <p className="mt-1.5 text-sm text-text-secondary">{t('onboarding.chooseFolderDesc')}</p>
                <button
                  onClick={chooseFolder}
                  disabled={busy}
                  className="mt-4 flex w-full items-center gap-3 rounded-xl border border-accent bg-accent/10 p-4 text-left ring-1 ring-accent transition-all hover:bg-accent/15 disabled:opacity-60"
                >
                  <FolderOpen className="h-6 w-6 shrink-0 text-accent" />
                  <span>
                    <span className="block text-sm font-semibold text-text-primary">{t('onboarding.chooseFolder')}</span>
                    <span className="block text-[11px] text-text-muted">{t('onboarding.chooseFolderHint')}</span>
                  </span>
                </button>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button variant="secondary" className="flex-1" disabled={busy} onClick={() => finish(false)}>{t('onboarding.skipBrowserOnly')}</Button>
                  <Button variant="ghost" className="flex-1" disabled={busy} onClick={() => finish(true)}>{t('onboarding.exploreSample')}</Button>
                </div>
              </>
            ) : (
              <>
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-border surface-card p-3">
                  <HardDriveDownload className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                  <p className="text-xs text-text-secondary">{t('onboarding.folderUnsupported')}</p>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button variant="primary" className="flex-1" onClick={() => finish(false)}>{t('onboarding.getStarted')}</Button>
                  <Button variant="secondary" className="flex-1" onClick={() => finish(true)}>{t('onboarding.exploreSample')}</Button>
                </div>
              </>
            )}

            <button
              onClick={() => setStep(1)}
              disabled={busy}
              className="mt-4 inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary disabled:opacity-60"
            >
              <ArrowLeft className="h-3 w-3" />{t('onboarding.back')}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

function PersonaCard({
  active, onClick, icon, title, desc,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-xl border p-3 text-left transition-all',
        active ? 'border-accent bg-accent/10 ring-1 ring-accent' : 'border-border surface-card hover:border-accent/50',
      )}
    >
      <span className={cn('inline-flex h-9 w-9 items-center justify-center rounded-lg', active ? 'bg-accent text-white' : 'bg-bg-hover text-text-secondary')}>{icon}</span>
      <div className="mt-2 text-sm font-semibold text-text-primary">{title}</div>
      <div className="text-[11px] text-text-muted">{desc}</div>
    </button>
  );
}

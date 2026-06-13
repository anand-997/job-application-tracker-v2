'use client';

import { useState } from 'react';
import { GraduationCap, Briefcase, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button, Input } from '@/components/ui/primitives';
import { useApp } from '@/context/AppProvider';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

export function OnboardingModal({ open }: { open: boolean }) {
  const { setPrefs, loadSample } = useApp();
  const { t } = useT();
  const [persona, setPersona] = useState<'student' | 'professional'>('student');
  const [name, setName] = useState('');

  function finish(withSample: boolean) {
    setPrefs({ persona, name: name.trim() || undefined, onboarded: true });
    if (withSample) loadSample();
  }

  return (
    <Modal open={open} onClose={() => finish(false)} size="md" hideClose>
      <div className="p-6">
        <div className="mb-4 flex items-center gap-2 text-accent">
          <Sparkles className="h-5 w-5" />
          <span className="font-mono text-xs uppercase tracking-widest">{t('app.motto')}</span>
        </div>
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

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button variant="primary" className="flex-1" onClick={() => finish(false)}>{t('onboarding.getStarted')}</Button>
          <Button variant="secondary" className="flex-1" onClick={() => finish(true)}>{t('onboarding.exploreSample')}</Button>
        </div>
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

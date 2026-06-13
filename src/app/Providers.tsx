'use client';

import { ToastProvider } from '@/context/ToastProvider';
import { AppProvider, useApp } from '@/context/AppProvider';
import { I18nProvider } from '@/i18n/I18nProvider';
import { Toaster } from '@/components/ui/Toaster';

function LangBridge({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  return <I18nProvider lang={state.userPrefs.language}>{children}</I18nProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppProvider>
        <LangBridge>
          {children}
          <Toaster />
        </LangBridge>
      </AppProvider>
    </ToastProvider>
  );
}

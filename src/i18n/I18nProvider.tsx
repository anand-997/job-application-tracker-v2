'use client';

import { createContext, useContext, useMemo } from 'react';
import en from '@/messages/en.json';
import hi from '@/messages/hi.json';

type Lang = 'en' | 'hi';
type Messages = typeof en;
type Vars = Record<string, string | number>;

const DICTS: Record<Lang, Messages> = { en, hi: hi as Messages };

interface I18nValue {
  lang: Lang;
  t: (key: string, vars?: Vars) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function lookup(obj: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === 'string' ? cur : undefined;
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

export function I18nProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const value = useMemo<I18nValue>(() => {
    const dict = DICTS[lang] ?? en;
    const t = (key: string, vars?: Vars) => {
      const raw = lookup(dict, key) ?? lookup(en, key) ?? key;
      return interpolate(raw, vars);
    };
    return { lang, t };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback so components never crash outside the provider.
    return { lang: 'en', t: (k: string, v?: Vars) => interpolate(lookup(en, k) ?? k, v) };
  }
  return ctx;
}

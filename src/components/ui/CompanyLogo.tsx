'use client';

import { useState } from 'react';
import { clearbitLogo, initials, colorFromString, cn } from '@/lib/utils';

export function CompanyLogo({ company, size = 36, className }: { company: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const showFallback = failed || !company.trim();

  return (
    <div
      className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-lg font-semibold text-white', className)}
      style={{
        width: size,
        height: size,
        background: showFallback ? colorFromString(company || '?') : 'var(--bg-hover)',
        fontSize: size * 0.38,
      }}
    >
      {showFallback ? (
        <span>{initials(company || '?')}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={clearbitLogo(company)}
          alt={`${company} logo`}
          width={size}
          height={size}
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
          loading="lazy"
        />
      )}
    </div>
  );
}

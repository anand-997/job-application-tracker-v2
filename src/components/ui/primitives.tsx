'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// ── Button ──────────────────────────────────────────────────
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

const VARIANT: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover shadow-sm',
  secondary: 'surface-card text-text-primary border border-border hover:bg-bg-hover',
  ghost: 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
  danger: 'bg-error text-white hover:opacity-90',
  subtle: 'bg-bg-hover text-text-primary hover:opacity-90',
};
const SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
};

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(function Button({ className, variant = 'secondary', size = 'md', ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all',
        'focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none select-none',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...props}
    />
  );
});

// ── IconButton (44px touch target via padding) ──────────────
export const IconButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }
>(function IconButton({ className, label, active, ...props }, ref) {
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
        'text-text-secondary hover:bg-bg-hover hover:text-text-primary focus-visible:outline-none',
        active && 'bg-bg-hover text-text-primary',
        className,
      )}
      {...props}
    />
  );
});

// ── Badge ───────────────────────────────────────────────────
export function Badge({
  children, color, className, dot,
}: { children: React.ReactNode; color?: string; className?: string; dot?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        'border',
        className,
      )}
      style={color ? { color, borderColor: `${color}55`, backgroundColor: `${color}1a` } : undefined}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </span>
  );
}

// ── Field wrapper ───────────────────────────────────────────
export function Field({
  label, children, required, hint, error, className,
}: {
  label?: string; children: React.ReactNode; required?: boolean;
  hint?: string; error?: string; className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-text-secondary">
          {label}
          {required && <span className="text-error">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-[11px] text-text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-[11px] text-error">{error}</span>}
    </label>
  );
}

const inputBase =
  'w-full rounded-lg surface-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted ' +
  'transition-colors focus:outline-none focus:border-accent';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(inputBase, 'h-10', className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(inputBase, 'min-h-[90px] resize-y', className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(inputBase, 'h-10 cursor-pointer pr-8', className)} {...props}>
        {children}
      </select>
    );
  },
);

// ── Switch ──────────────────────────────────────────────────
export function Switch({
  checked, onChange, label,
}: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-accent' : 'bg-bg-hover',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  );
}

// ── Segmented control ───────────────────────────────────────
export function Segmented<T extends string>({
  options, value, onChange, size = 'md',
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={cn('inline-flex rounded-lg border border-border surface-card p-0.5', size === 'sm' && 'text-xs')}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            size === 'sm' && 'px-2.5 py-1 text-xs',
            value === o.value
              ? 'bg-accent text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Checkbox row ────────────────────────────────────────────
export function CheckRow({
  checked, onChange, children,
}: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-bg-hover">
      <span
        className={cn(
          'flex h-4 w-4 items-center justify-center rounded border transition-colors',
          checked ? 'border-accent bg-accent text-white' : 'border-border',
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-text-primary">{children}</span>
    </label>
  );
}

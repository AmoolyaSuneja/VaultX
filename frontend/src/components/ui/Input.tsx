import * as React from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAdornment?: ReactNode;
  rightAdornment?: ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftAdornment, rightAdornment, ...props }, ref) => (
    <label className="grid gap-1.5 text-sm text-textMuted">
      {label ? (
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-textMuted">{label}</span>
      ) : null}
      <span
        className={cn(
          'surface-field flex items-center gap-2 rounded-md px-3 py-2.5 transition-colors duration-200 ease-out',
          error ? 'border-danger/50' : 'focus-within:border-textPrimary/60',
          className
        )}
      >
        {leftAdornment}
        <input
          ref={ref}
          className="min-w-0 flex-1 bg-transparent text-sm text-textPrimary outline-none placeholder:text-textMuted/70"
          {...props}
        />
        {rightAdornment}
      </span>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-textMuted">{hint}</span> : null}
    </label>
  )
);

Input.displayName = 'Input';

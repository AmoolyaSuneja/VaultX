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
  ({ className, label, error, hint, leftAdornment, rightAdornment, ...props }, ref) => {
    const hasValue = props.value !== undefined && String(props.value).length > 0;

    return (
      <label className="grid gap-2 text-sm text-textMuted">
        {label ? (
          <span
            className={cn(
              'text-xs font-medium uppercase tracking-[0.22em] transition-colors',
              hasValue ? 'text-brand' : 'text-textMuted'
            )}
          >
            {label}
          </span>
        ) : null}
        <span
          className={cn(
            'surface-field flex items-center gap-2 rounded-md px-3 py-2.5 transition-[border-color,box-shadow] duration-300 ease-out',
            error ? 'border-danger/50' : 'border-line focus-within:border-brand focus-within:shadow-focus',
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
    );
  }
);

Input.displayName = 'Input';

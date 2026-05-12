import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => (
    <label className="grid gap-1.5 text-sm text-textMuted">
      {label ? (
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-textMuted">{label}</span>
      ) : null}
      <textarea
        ref={ref}
        className={cn(
          'focus-ring surface-field min-h-[104px] w-full rounded-md px-3 py-2.5 text-sm text-textPrimary transition-colors duration-200 ease-out placeholder:text-textMuted/70 focus:border-textPrimary/60',
          error && 'border-danger/50',
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  )
);

Textarea.displayName = 'Textarea';

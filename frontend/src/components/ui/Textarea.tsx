import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => (
    <label className="grid gap-2 text-sm text-textMuted">
      {label ? <span className="text-xs font-medium uppercase tracking-[0.22em]">{label}</span> : null}
      <textarea
        ref={ref}
        className={cn(
          'focus-ring surface-field min-h-[100px] w-full rounded-md px-3 py-2.5 text-sm transition-[border-color,box-shadow] duration-300 ease-out placeholder:text-textMuted/70 focus:border-brand focus:shadow-focus',
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

import * as React from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<ButtonVariant, string> = {
  primary:
    'border border-brand bg-brand text-background hover:bg-brand-deep hover:border-brand-deep shadow-lg shadow-black/10',
  secondary:
    'border border-line bg-surface text-textPrimary hover:bg-surface-muted',
  ghost:
    'border border-transparent bg-transparent text-textMuted hover:bg-surface-muted hover:text-textPrimary',
  danger:
    'border border-danger/30 bg-transparent text-danger hover:bg-danger/8'
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant = 'primary', loading = false, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'focus-ring press inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-[1rem] font-medium tabular',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      <span className="inline-flex items-center justify-center gap-2">{children}</span>
    </button>
  )
);

Button.displayName = 'Button';

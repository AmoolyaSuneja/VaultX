import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="focus-ring press flex w-full items-center justify-between gap-4 rounded-md border border-line bg-surface px-3 py-2.5 text-left hover:bg-surface-muted"
    >
      <span className="text-sm text-textPrimary">{label}</span>
      <span
        className={cn(
          'flex h-[20px] w-9 items-center rounded-full border p-[2px] transition-colors duration-200 ease-smooth',
          checked ? 'border-brand bg-brand' : 'border-steel/50 bg-surface-muted'
        )}
      >
        <span
          className={cn(
            // Knob keeps a surface tone + border + shadow so it stays visible on
            // any track colour in both light and dark themes.
            'h-[14px] w-[14px] rounded-full border border-line bg-surface-raised shadow-sm transition-transform duration-200 ease-smooth',
            checked ? 'translate-x-[16px]' : 'translate-x-0'
          )}
        />
      </span>
    </button>
  );
}

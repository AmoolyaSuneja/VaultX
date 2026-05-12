import { cn } from '@/lib/utils';

const labels = ['Weak', 'Fair', 'Strong', 'Excellent'];

function calculateScore(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.max(0, Math.min(4, score));
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  const score = calculateScore(password);
  const label = labels[Math.max(0, score - 1)] ?? 'Weak';

  return (
    <div className="grid gap-1.5">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((item) => (
          <span
            key={item}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              item < score ? 'bg-textPrimary' : 'bg-line'
            )}
          />
        ))}
      </div>
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-textMuted">{label}</span>
    </div>
  );
}

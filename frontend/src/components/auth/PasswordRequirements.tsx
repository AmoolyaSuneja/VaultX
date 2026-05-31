import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordRequirementsProps {
  password: string;
}

const RULES: Array<{ label: string; test: (value: string) => boolean }> = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'One number', test: (v) => /\d/.test(v) },
  { label: 'One special character', test: (v) => /[^A-Za-z0-9]/.test(v) }
];

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  return (
    <AnimatePresence initial={false}>
      {password.length > 0 ? (
        <motion.ul
          key="password-requirements"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-1.5 overflow-hidden"
        >
          {RULES.map((rule) => {
            const met = rule.test(password);
            return (
              <li
                key={rule.label}
                className={cn(
                  'flex items-center gap-2 text-[12px] transition-colors duration-200',
                  met ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger'
                )}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-200',
                    met
                      ? 'border-emerald-600/40 bg-emerald-600/10 dark:border-emerald-400/40 dark:bg-emerald-400/10'
                      : 'border-danger/40 bg-danger/10'
                  )}
                >
                  {met ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : <X className="h-2.5 w-2.5" strokeWidth={3} />}
                </span>
                {rule.label}
              </li>
            );
          })}
        </motion.ul>
      ) : null}
    </AnimatePresence>
  );
}

import * as Popover from '@radix-ui/react-popover';
import { KeyRound, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, Toggle } from '@/components/ui';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';

function generatePassword({
  length,
  uppercase,
  lowercase,
  numbers,
  symbols
}: {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}) {
  const pools = [
    uppercase ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : '',
    lowercase ? 'abcdefghijkmnopqrstuvwxyz' : '',
    numbers ? '23456789' : '',
    symbols ? '!@#$%^&*()_+-=[]{}' : ''
  ].join('');

  if (!pools) return '';

  const buffer = new Uint32Array(length);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(buffer);
    return Array.from(buffer, (value) => pools[value % pools.length]).join('');
  }

  return Array.from({ length }, () => pools[Math.floor(Math.random() * pools.length)]).join('');
}

interface PasswordGeneratorProps {
  onUse: (password: string) => void;
}

export function PasswordGenerator({ onUse }: PasswordGeneratorProps) {
  const [length, setLength] = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    setPassword(generatePassword({ length, uppercase, lowercase, numbers, symbols }));
  }, [length, uppercase, lowercase, numbers, symbols]);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button type="button" variant="secondary" className="h-8 min-h-8 px-3 py-1 text-xs">
          <KeyRound className="h-3.5 w-3.5" />
          Generate
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="end"
          className="z-[80] w-[320px] rounded-md border border-line bg-panel p-4 shadow-card"
        >
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-heading text-lg text-textPrimary">Generator</h4>
            <button
              type="button"
              className="focus-ring rounded-full p-1.5 text-textMuted transition-colors hover:bg-surface-muted hover:text-textPrimary"
              onClick={() => setPassword(generatePassword({ length, uppercase, lowercase, numbers, symbols }))}
              aria-label="Regenerate"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3">
            <label className="grid gap-1.5 text-sm text-textMuted">
              <span className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.16em]">
                <span>Length</span>
                <span className="font-mono text-textPrimary">{length}</span>
              </span>
              <input
                type="range"
                min={8}
                max={64}
                value={length}
                onChange={(event) => setLength(Number(event.target.value))}
                className="accent-textPrimary"
              />
            </label>
            <Toggle checked={uppercase} onChange={setUppercase} label="Uppercase" />
            <Toggle checked={lowercase} onChange={setLowercase} label="Lowercase" />
            <Toggle checked={numbers} onChange={setNumbers} label="Numbers" />
            <Toggle checked={symbols} onChange={setSymbols} label="Symbols" />

            <div className="rounded-md border border-line bg-surface p-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-textMuted">Preview</p>
              <p className="mt-1 break-all font-mono text-sm text-textPrimary">
                {password || 'Choose at least one option'}
              </p>
            </div>

            <PasswordStrengthMeter password={password} />

            <Button type="button" onClick={() => onUse(password)} disabled={!password} className="w-full">
              Use this password
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

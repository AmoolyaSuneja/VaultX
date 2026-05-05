import { Card, Toggle } from '@/components/ui';
import { useSettingsStore } from '@/features/settings/settings.store';

export function SettingsPage() {
  const compactCards = useSettingsStore((state) => state.compactCards);
  const blurSensitive = useSettingsStore((state) => state.blurSensitive);
  const theme = useSettingsStore((state) => state.theme);
  const setCompactCards = useSettingsStore((state) => state.setCompactCards);
  const setBlurSensitive = useSettingsStore((state) => state.setBlurSensitive);
  const toggleTheme = useSettingsStore((state) => state.toggleTheme);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-textMuted">Settings</p>
        <h1 className="mt-3 font-heading text-3xl text-textPrimary sm:text-4xl">Tune how the vault behaves.</h1>
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        <Card className="rounded-xl">
          <p className="text-xs uppercase tracking-[0.22em] text-textMuted">Security</p>
          <div className="mt-5 grid gap-4">
            <Toggle checked={blurSensitive} onChange={setBlurSensitive} label="Blur sensitive values by default" />
          </div>
        </Card>

        <Card className="rounded-xl">
          <p className="text-xs uppercase tracking-[0.22em] text-textMuted">Interface</p>
          <div className="mt-5 grid gap-4">
            <Toggle checked={theme === 'dark'} onChange={toggleTheme} label="Use dark mode" />
            <Toggle checked={compactCards} onChange={setCompactCards} label="Use compact vault cards" />
            <div className="rounded-lg bg-surface p-4 text-sm leading-7 text-textMuted">
              Motion honors the operating system reduced-motion preference through Framer Motion's user setting at the app root.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

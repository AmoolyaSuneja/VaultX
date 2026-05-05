import { Navigate } from 'react-router-dom';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { VaultXLogo } from '@/components/auth/VaultXLogo';
import { useAuthStore } from '@/features/auth/auth.store';

export function AuthPage() {
  const token = useAuthStore((state) => state.token);

  if (token) {
    return <Navigate to="/vault" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden px-3 py-4 sm:px-6 sm:py-6 lg:px-10">
      <div className="auth-page-background pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[46vh] bg-gradient-to-b from-white/55 via-accent/8 to-transparent" />
      <div className="pointer-events-none absolute -left-[12%] top-[10%] h-[420px] w-[420px] rounded-full bg-brand/12 blur-3xl motion-safe:animate-float" />
      <div className="pointer-events-none absolute right-[-10%] top-[18%] h-[380px] w-[380px] rounded-full bg-accent/16 blur-3xl motion-safe:animate-float" />
      <div className="pointer-events-none absolute bottom-[-12%] left-1/2 h-[320px] w-[640px] -translate-x-1/2 rounded-full bg-steel/12 blur-3xl motion-safe:animate-pulseSoft" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-1 py-12 sm:px-6 lg:px-10">
        <section className="relative mx-auto w-full max-w-xl">
          <div className="auth-ambient pointer-events-none absolute -inset-10 -z-10 rounded-[40px]" />
          <div className="pointer-events-none absolute inset-x-12 -top-8 -z-10 h-24 rounded-full bg-gradient-to-r from-accent/0 via-accent/25 to-brand/0 blur-2xl motion-safe:animate-pulseSoft" />
          <div className="pointer-events-none absolute inset-y-10 -left-8 -z-10 w-24 rounded-full bg-gradient-to-b from-brand/10 via-accent/20 to-transparent blur-3xl motion-safe:animate-float" />
          <div className="pointer-events-none absolute inset-y-12 -right-10 -z-10 w-28 rounded-full bg-gradient-to-b from-steel/10 via-accent/16 to-transparent blur-3xl motion-safe:animate-float" />
          <div className="relative z-10 flex flex-col items-center gap-5">
            <VaultXLogo />
            <AuthPanel />
          </div>
        </section>
      </div>

      <p className="pointer-events-none relative z-10 pb-4 text-center text-xs uppercase tracking-[0.24em] text-textMuted sm:tracking-[0.28em]">
        Private by Default
      </p>
    </div>
  );
}

import { Navigate } from 'react-router-dom';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { VaultXLogo } from '@/components/auth/VaultXLogo';
import { useAuthStore } from '@/features/auth/auth.store';
import { APP_NAME } from '@/lib/constants';

export function AuthPage() {
  const token = useAuthStore((state) => state.token);

  if (token) {
    return <Navigate to="/vault" replace />;
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background px-4 py-8 sm:px-6">
      <main className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-[420px] animate-fadeIn">
          <div className="mb-8">
            <VaultXLogo />
          </div>
          <AuthPanel />
        </div>
      </main>
      <footer className="pt-8 text-center text-[11px] uppercase tracking-[0.22em] text-textMuted">
        &copy; {new Date().getFullYear()} {APP_NAME}
      </footer>
    </div>
  );
}

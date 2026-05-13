import { Navigate } from 'react-router-dom';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { useAuthStore } from '@/features/auth/auth.store';
import { APP_NAME } from '@/lib/constants';

export function AuthPage() {
  const token = useAuthStore((state) => state.token);

  if (token) {
    return <Navigate to="/vault" replace />;
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background px-5 py-8 sm:px-8">
      <header className="mx-auto w-full max-w-[1320px]">
        <span className="font-heading text-[22px] font-semibold tracking-tight text-textPrimary">
          {APP_NAME}
        </span>
      </header>

      <main className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-[420px] animate-fadeIn">
          <div className="mb-8">
            <p className="text-[11px] font-medium uppercase tracking-label text-textMuted">Private vault</p>
            <h1 className="mt-3 font-heading text-[40px] font-semibold leading-[1.05] tracking-tight text-textPrimary sm:text-[44px]">
              A quieter place for what matters.
            </h1>
            <p className="mt-3 text-sm leading-6 text-textMuted">
              End-to-end encrypted credentials, notes, and documents. Time locks, dual approval, and nominee succession — on your terms.
            </p>
          </div>
          <AuthPanel />
        </div>
      </main>

      <footer className="mx-auto w-full max-w-[1320px] pt-8 text-[11px] font-medium uppercase tracking-label text-textMuted">
        &copy; {new Date().getFullYear()} {APP_NAME}
      </footer>
    </div>
  );
}

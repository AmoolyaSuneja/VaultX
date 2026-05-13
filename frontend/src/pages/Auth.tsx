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
    <div className="relative flex min-h-screen flex-col bg-background px-5 py-8 sm:px-8">
      <main className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-[420px] animate-fadeIn">
          <div className="mb-8">
            <VaultXLogo />
          </div>
          <AuthPanel />
        </div>
      </main>
    </div>
  );
}

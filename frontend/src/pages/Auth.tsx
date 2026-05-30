import { Navigate } from 'react-router-dom';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { AuthShowcase } from '@/components/auth/AuthShowcase';
import { useAuthStore } from '@/features/auth/auth.store';

export function AuthPage() {
  const token = useAuthStore((state) => state.token);

  if (token) {
    return <Navigate to="/vault" replace />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col overflow-hidden bg-background md:flex-row">
      <AuthShowcase />
      <section className="flex w-full items-center justify-center bg-surface-soft p-5 md:w-1/2 md:p-10">
        <div className="w-full max-w-[28rem] animate-fadeIn">
          <AuthPanel />
        </div>
      </section>
    </div>
  );
}

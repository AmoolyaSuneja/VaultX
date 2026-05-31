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
    <div className="flex min-h-screen w-full overflow-hidden bg-background md:flex-row">
      <AuthShowcase />
      <section
        data-lenis-prevent
        className="flex max-h-screen w-full items-start justify-center overflow-y-auto bg-surface-soft p-5 md:w-1/2 md:items-center md:p-8 lg:p-10"
      >
        <div className="my-auto w-full max-w-[26rem] animate-fadeIn py-6">
          <AuthPanel />
        </div>
      </section>
    </div>
  );
}

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
        className="h-screen w-full overflow-y-auto bg-surface-soft md:w-1/2"
      >
        {/* min-h-full + flex centers the card when it fits, and lets it scroll
            from the top (no clipping) when the form is taller than the viewport. */}
        <div className="flex min-h-full items-center justify-center p-5 md:p-8 lg:p-10">
          <div className="w-full max-w-[26rem] animate-fadeIn">
            <AuthPanel />
          </div>
        </div>
      </section>
    </div>
  );
}

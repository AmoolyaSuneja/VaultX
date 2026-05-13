import { lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/features/auth/auth.store';
import { AuthPage } from '@/pages/Auth';
import { pageTransition } from '@/lib/motion';

const DashboardPage = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.DashboardPage })));
const EntryDetailPage = lazy(() => import('@/pages/EntryDetail').then((m) => ({ default: m.EntryDetailPage })));
const ProfilePage = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.SettingsPage })));
const ApproveAccessPage = lazy(() =>
  import('@/pages/ApproveAccess').then((m) => ({ default: m.ApproveAccessPage }))
);
const SharedLinkPage = lazy(() => import('@/pages/SharedLink').then((m) => ({ default: m.SharedLinkPage })));

function RouteFallback() {
  return (
    <div className="flex min-h-[30vh] items-center justify-center">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-label text-textMuted">
        <span className="h-1 w-1 animate-pulse rounded-full bg-textMuted" />
        Loading
      </div>
    </div>
  );
}

function AnimatedRouteOutlet() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -2 }}
        transition={pageTransition}
      >
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function ProtectedLayout() {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <AppShell />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthPage />
  },
  {
    path: '/shared/:shareId',
    element: (
      <Suspense fallback={<RouteFallback />}>
        <SharedLinkPage />
      </Suspense>
    )
  },
  {
    path: '/approve-access/:token',
    element: (
      <Suspense fallback={<RouteFallback />}>
        <ApproveAccessPage />
      </Suspense>
    )
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        element: <AnimatedRouteOutlet />,
        children: [
          {
            path: '/vault',
            element: <DashboardPage />
          },
          {
            path: '/vault/new',
            element: <DashboardPage createOpen />
          },
          {
            path: '/vault/:id',
            element: <EntryDetailPage />
          },
          {
            path: '/vault/profile',
            element: <ProfilePage />
          },
          {
            path: '/vault/settings',
            element: <SettingsPage />
          }
        ]
      }
    ]
  }
]);

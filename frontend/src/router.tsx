import { AnimatePresence, motion } from 'framer-motion';
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/features/auth/auth.store';
import { AuthPage } from '@/pages/Auth';
import { DashboardPage } from '@/pages/Dashboard';
import { EntryDetailPage } from '@/pages/EntryDetail';
import { ProfilePage } from '@/pages/Profile';
import { SharedLinkPage } from '@/pages/SharedLink';

function AnimatedRouteOutlet() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2 }}
      >
        <Outlet />
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
    element: <SharedLinkPage />
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
          }
        ]
      }
    ]
  }
]);

import React from 'react';
import ReactDOM from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './router';
import { pageTransition } from './lib/motion';
import './features/settings/settings.store';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 }
  }
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user" transition={pageTransition}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 2600,
            className:
              'rounded-md border border-line bg-panel px-4 py-2.5 text-sm text-textPrimary shadow-card',
            style: {
              fontFamily: 'var(--font-sans, "Instrument Sans", system-ui, sans-serif)'
            }
          }}
        />
      </QueryClientProvider>
    </MotionConfig>
  </React.StrictMode>
);

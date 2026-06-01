import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';

export function AppShell() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <TopBar />

      <div className="mx-auto flex w-full max-w-[1320px] pt-16">
        <main className="min-h-[calc(100vh-4rem)] min-w-0 flex-1 px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 md:px-8 lg:pb-12 lg:pt-10">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

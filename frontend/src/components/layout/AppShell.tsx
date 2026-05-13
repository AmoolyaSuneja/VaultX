import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';

export function AppShell() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <TopBar />

      <div className="mx-auto flex max-w-[1320px] pt-16">
        <main className="min-h-[calc(100vh-4rem)] flex-1 px-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-8 sm:px-8 lg:pb-12 lg:pt-10">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

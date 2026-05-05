import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';

export function AppShell() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <TopBar />

      <div className="mx-auto flex max-w-[1600px] pt-16">
        <main className="min-h-[calc(100vh-4rem)] flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

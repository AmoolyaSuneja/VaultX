import { Home, Plus, Settings, UserCircle2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/vault', label: 'Vault', icon: Home },
  { to: '/vault/new', label: 'New', icon: Plus },
  { to: '/vault/profile', label: 'Profile', icon: UserCircle2 },
  { to: '/vault/settings', label: 'Settings', icon: Settings }
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 rounded-full border border-line bg-panel/95 p-1.5 shadow-card backdrop-blur-panel sm:inset-x-6 sm:p-2 lg:hidden">
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/vault'}
            className={({ isActive }) =>
              `focus-ring flex min-h-12 flex-col items-center justify-center gap-1 rounded-full px-2 py-2 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                isActive ? 'bg-brand text-background' : 'text-textMuted'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

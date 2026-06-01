import { Home, Plus, UserCircle2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/vault', label: 'Vault', icon: Home },
  { to: '/vault/new', label: 'New', icon: Plus },
  { to: '/vault/profile', label: 'Profile', icon: UserCircle2 }
];

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 rounded-full border border-line bg-panel/85 p-1 shadow-card backdrop-blur-panel sm:inset-x-auto sm:left-1/2 sm:w-auto sm:-translate-x-1/2 lg:hidden"
      aria-label="Primary"
    >
      <div className="grid grid-cols-3 gap-0.5 sm:flex sm:gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/vault'}
            className={({ isActive }) =>
              `focus-ring press flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2 text-[11px] font-medium transition-colors duration-200 ease-smooth sm:min-w-[88px] sm:flex-none sm:gap-2 sm:px-3 sm:text-xs ${
                isActive ? 'bg-brand text-background' : 'text-textMuted hover:bg-surface-muted hover:text-textPrimary'
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

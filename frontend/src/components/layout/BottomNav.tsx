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
      className="fixed inset-x-4 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 rounded-full border border-line bg-panel/85 p-1 shadow-card backdrop-blur-panel sm:inset-x-auto sm:left-1/2 sm:w-auto sm:-translate-x-1/2 lg:hidden"
      aria-label="Primary"
    >
      <div className="grid grid-cols-3 gap-1 sm:flex sm:gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/vault'}
            className={({ isActive }) =>
              `focus-ring press flex min-h-10 min-w-[88px] items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors duration-200 ease-smooth ${
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

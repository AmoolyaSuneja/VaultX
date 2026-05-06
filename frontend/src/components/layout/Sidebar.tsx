import { LockKeyhole, PlusCircle, Settings, UserCircle2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { VaultStats } from '@/features/vault/vault.types';

interface SidebarProps {
  stats: VaultStats;
}

const navItems = [
  { to: '/vault', label: 'Vault', icon: LockKeyhole },
  { to: '/vault/new', label: 'New entry', icon: PlusCircle },
  { to: '/vault/profile', label: 'Profile', icon: UserCircle2 },
  { to: '/vault/settings', label: 'Settings', icon: Settings }
];

export function Sidebar({ stats }: SidebarProps) {
  void stats;

  return (
    <aside className="hidden w-[280px] shrink-0 flex-col gap-6 border-r border-line px-4 py-6 lg:flex">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.28em] text-textMuted">Workspace</p>
        <div className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/vault'}
              className={({ isActive }) =>
                `focus-ring flex items-center gap-3 rounded-md px-4 py-3.5 text-lg font-medium transition ${
                  isActive ? 'bg-brand text-background shadow-soft' : 'text-textMuted hover:bg-surface-soft hover:text-brand'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </aside>
  );
}

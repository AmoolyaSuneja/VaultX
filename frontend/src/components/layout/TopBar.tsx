import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { LogOut, Moon, Search, Sun, UserCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store';
import { useSettingsStore } from '@/features/settings/settings.store';
import { useVaultStore } from '@/features/vault/vault.store';
import { getInitials } from '@/lib/utils';

export function TopBar() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const theme = useSettingsStore((state) => state.theme);
  const toggleTheme = useSettingsStore((state) => state.toggleTheme);
  const search = useVaultStore((state) => state.search);
  const setSearch = useVaultStore((state) => state.setSearch);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-panel/90 backdrop-blur-panel">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-3 sm:gap-4 sm:px-6 lg:px-8">
        <Link to="/vault" className="min-w-fit font-heading text-xl text-textPrimary sm:text-2xl">
          Secure Vault
        </Link>

        <div className="hidden flex-1 items-center md:flex">
          <label className="focus-within:shadow-focus flex w-full max-w-xl items-center gap-3 rounded-full border border-line bg-surface px-4 py-2 transition focus-within:border-brand">
            <Search className="h-4 w-4 text-textMuted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your vault"
              className="w-full bg-transparent text-sm text-textPrimary outline-none placeholder:text-textMuted/70"
            />
          </label>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface-soft text-textMuted transition hover:border-brand/40 hover:bg-surface-raised hover:text-brand"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Menu as="div" className="relative">
            <MenuButton className="focus-ring flex items-center gap-3 rounded-full border border-line bg-surface-soft p-1.5 transition hover:border-brand/40 hover:bg-surface-raised sm:py-1.5 sm:pl-1.5 sm:pr-3">
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand text-xs font-semibold text-background">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user?.name ?? 'Profile'} className="h-full w-full object-cover" />
                ) : (
                  getInitials(user?.name)
                )}
              </span>
              <span className="hidden text-sm font-medium text-textPrimary sm:inline">{user?.name ?? 'Guest'}</span>
            </MenuButton>

            <MenuItems
              anchor="bottom end"
              className="z-[70] mt-2 min-w-[150px] rounded-full border border-line bg-panel/95 p-1.5 shadow-soft backdrop-blur-panel"
            >
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={() => navigate('/vault/profile')}
                    className={`focus-ring flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                      focus ? 'bg-brand text-background' : 'text-textPrimary hover:bg-surface-raised'
                    }`}
                  >
                    <UserCircle2 className="h-4 w-4" />
                    Profile
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={logout}
                    className={`focus-ring flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                      focus ? 'bg-brand text-background' : 'text-textPrimary hover:bg-surface-raised'
                    }`}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                )}
              </MenuItem>
            </MenuItems>
          </Menu>
        </div>
      </div>
    </header>
  );
}

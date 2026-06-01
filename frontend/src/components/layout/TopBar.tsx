import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { LogOut, Moon, Settings, Sun, UserCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store';
import { useSettingsStore } from '@/features/settings/settings.store';
import { APP_NAME } from '@/lib/constants';
import { getInitials } from '@/lib/utils';

export function TopBar() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const theme = useSettingsStore((state) => state.theme);
  const toggleTheme = useSettingsStore((state) => state.toggleTheme);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-panel/80 backdrop-blur-panel transition-colors duration-280 ease-smooth">
      <div className="mx-auto flex h-16 w-full max-w-[1320px] items-center gap-3 px-4 sm:px-6 md:px-8">
        <Link
          to="/vault"
          className="focus-ring press font-heading text-[20px] font-semibold tracking-tight text-textPrimary"
        >
          {APP_NAME}
        </Link>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="focus-ring press flex h-9 w-9 items-center justify-center rounded-full text-textMuted transition-colors duration-180 hover:bg-surface-muted hover:text-textPrimary"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Menu as="div" className="relative">
            <MenuButton className="focus-ring press flex items-center gap-2 rounded-full p-1 pr-3 transition-colors duration-180 hover:bg-surface-muted">
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
              className="z-[70] mt-2 min-w-[180px] overflow-hidden rounded-md border border-line bg-panel p-1 shadow-card animate-fadeIn"
            >
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={() => navigate('/vault/profile')}
                    className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm transition-colors duration-150 ${
                      focus ? 'bg-surface-muted text-textPrimary' : 'text-textPrimary'
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
                    onClick={() => navigate('/vault/settings')}
                    className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm transition-colors duration-150 ${
                      focus ? 'bg-surface-muted text-textPrimary' : 'text-textPrimary'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    Nominee
                  </button>
                )}
              </MenuItem>
              <div className="my-1 h-px bg-line" />
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={logout}
                    className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm transition-colors duration-150 ${
                      focus ? 'bg-surface-muted text-danger' : 'text-textPrimary'
                    }`}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
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

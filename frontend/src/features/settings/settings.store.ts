import { create } from 'zustand';

const THEME_KEY = 'vaultx-theme';
const THEME_VERSION_KEY = 'vaultx-theme-version';
const THEME_VERSION = '4';
type ThemeMode = 'light' | 'dark';
const DEFAULT_THEME: ThemeMode = 'light';

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

function readInitialTheme(): ThemeMode {
  const storage = getStorage();
  const storageVersion = storage?.getItem(THEME_VERSION_KEY);

  if (storageVersion !== THEME_VERSION) {
    storage?.removeItem(THEME_KEY);
    storage?.setItem(THEME_VERSION_KEY, THEME_VERSION);
    return DEFAULT_THEME;
  }

  const storageTheme = getStorage()?.getItem(THEME_KEY);

  if (storageTheme === 'light' || storageTheme === 'dark') {
    return storageTheme;
  }

  return DEFAULT_THEME;
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.toggle('dark', theme === 'dark');
}

const initialTheme = readInitialTheme();
applyTheme(initialTheme);

interface SettingsState {
  theme: ThemeMode;
  compactCards: boolean;
  blurSensitive: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setCompactCards: (value: boolean) => void;
  setBlurSensitive: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: initialTheme,
  compactCards: false,
  blurSensitive: true,
  setTheme: (theme) => {
    const storage = getStorage();
    storage?.setItem(THEME_VERSION_KEY, THEME_VERSION);
    storage?.setItem(THEME_KEY, theme);
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const theme = state.theme === 'dark' ? 'light' : 'dark';
      const storage = getStorage();
      storage?.setItem(THEME_VERSION_KEY, THEME_VERSION);
      storage?.setItem(THEME_KEY, theme);
      applyTheme(theme);
      return { theme };
    }),
  setCompactCards: (compactCards) => set({ compactCards }),
  setBlurSensitive: (blurSensitive) => set({ blurSensitive })
}));

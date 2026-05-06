import { create } from 'zustand';

const TOKEN_KEY = 'vaultx-token';
const USER_KEY = 'vaultx-user';

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: 'admin' | 'user';
}

interface AuthState {
  token: string;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  logout: () => void;
}

function readPersistedSession() {
  if (typeof window === 'undefined') {
    return {
      token: '',
      user: null as AuthUser | null
    };
  }

  try {
    const storage = getStorage();

    if (!storage) {
      return {
        token: '',
        user: null as AuthUser | null
      };
    }

    const token = storage.getItem(TOKEN_KEY) || '';
    const serializedUser = storage.getItem(USER_KEY);
    const user = serializedUser ? (JSON.parse(serializedUser) as AuthUser) : null;

    return { token, user };
  } catch {
    const storage = getStorage();
    storage?.removeItem(TOKEN_KEY);
    storage?.removeItem(USER_KEY);
    return {
      token: '',
      user: null as AuthUser | null
    };
  }
}

function clearPersistedSession() {
  const storage = getStorage();
  storage?.removeItem(TOKEN_KEY);
  storage?.removeItem(USER_KEY);
}

const persistedSession = readPersistedSession();

export const useAuthStore = create<AuthState>((set) => ({
  token: persistedSession.token,
  user: persistedSession.user,
  setSession: (token, user) => {
    const storage = getStorage();
    storage?.setItem(TOKEN_KEY, token);
    storage?.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },
  updateUser: (updates) => {
    set((state) => {
      if (!state.user) {
        return state;
      }

      const user = { ...state.user, ...updates };
      const storage = getStorage();
      storage?.setItem(USER_KEY, JSON.stringify(user));
      return { user };
    });
  },
  logout: () => {
    clearPersistedSession();
    set({ token: '', user: null });
  }
}));

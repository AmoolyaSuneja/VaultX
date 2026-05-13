import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { loginUser, registerUser, requestPasswordReset, resetPassword } from './auth.service';
import { useAuthStore } from './auth.store';

/**
 * Post-login entrance animation flag.
 *
 * Decision is latched once per JS runtime so that React Strict Mode's
 * double-invocation of setState initializers and effects does not
 * "consume" the flag before the component mounts for real. A separate
 * `consumed` boolean is flipped once the animation finishes so we never
 * replay it in the same tab after the user navigates away and back.
 */
const ENTRANCE_KEY = 'vaultx-show-entrance';

type LatchState = {
  latched: boolean | null;
  consumed: boolean;
};

const entranceState: LatchState = {
  latched: null,
  consumed: false
};

export function markVaultEntrancePending() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(ENTRANCE_KEY, '1');
  } catch {
    // storage disabled
  }

  // Reset latches so a fresh login in the same tab replays the animation.
  entranceState.latched = null;
  entranceState.consumed = false;
}

export function shouldShowVaultEntrance() {
  if (entranceState.consumed) return false;

  if (entranceState.latched === null) {
    if (typeof window === 'undefined') {
      entranceState.latched = false;
    } else {
      try {
        const value = window.sessionStorage.getItem(ENTRANCE_KEY);
        if (value === '1') {
          window.sessionStorage.removeItem(ENTRANCE_KEY);
          entranceState.latched = true;
        } else {
          entranceState.latched = false;
        }
      } catch {
        entranceState.latched = false;
      }
    }
  }

  return entranceState.latched === true;
}

export function markVaultEntranceConsumed() {
  entranceState.consumed = true;
  entranceState.latched = false;
}

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      markVaultEntrancePending();
      setSession(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}`);
    }
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      toast.success(data.message || `Account created for ${data.user.name}`);
    }
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (data) => {
      toast.success(data.message || 'Recovery code sent');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unable to send recovery code';
      toast.error(message);
    }
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: resetPassword,
    onSuccess: (data) => {
      toast.success(data.message || 'Password reset successfully');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unable to reset password';
      toast.error(message);
    }
  });
}

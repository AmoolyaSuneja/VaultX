import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { loginUser, registerUser, requestPasswordReset, resetPassword } from './auth.service';
import { useAuthStore } from './auth.store';

const VAULT_ENTRANCE_FLAG = 'vaultx-show-entrance';

export function markVaultEntrancePending() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(VAULT_ENTRANCE_FLAG, '1');
  } catch {
    // storage disabled — skip
  }
}

export function consumeVaultEntrance() {
  if (typeof window === 'undefined') return false;
  try {
    const value = window.sessionStorage.getItem(VAULT_ENTRANCE_FLAG);
    if (value === '1') {
      window.sessionStorage.removeItem(VAULT_ENTRANCE_FLAG);
      return true;
    }
  } catch {
    // storage disabled
  }
  return false;
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

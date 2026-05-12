import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { loginUser, registerUser, requestPasswordReset, resetPassword } from './auth.service';
import { useAuthStore } from './auth.store';

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
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

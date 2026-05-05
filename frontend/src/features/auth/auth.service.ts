import type { ForgotPasswordValues, LoginValues, RegisterValues, ResetPasswordValues } from '@/lib/validators';
import type { AuthUser } from './auth.store';
import { requestJson } from '@/lib/request';

interface AuthResponse {
  token: string;
  user: AuthUser;
  message?: string;
}

export function registerUser(values: RegisterValues) {
  const { confirmPassword, ...body } = values;
  void confirmPassword;
  return requestJson<{ user: AuthUser; message: string }>('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export function loginUser(values: LoginValues) {
  return requestJson<AuthResponse>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values)
  });
}

export function requestPasswordReset(values: ForgotPasswordValues) {
  return requestJson<{ message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values)
  });
}

export function resetPassword(values: ResetPasswordValues) {
  const { confirmPassword, ...body } = values;
  void confirmPassword;
  return requestJson<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export function verifyOtp(code: string) {
  if (!/^\d{6}$/.test(code)) {
    throw new Error('Enter a valid 6-digit code');
  }

  return Promise.resolve({ success: true });
}

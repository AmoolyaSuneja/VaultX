import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@/components/ui';
import { pageTransition, shakeX } from '@/lib/motion';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordValues,
  type LoginValues,
  type RegisterValues,
  type ResetPasswordValues
} from '@/lib/validators';
import { useLogin, useRegister, useRequestPasswordReset, useResetPassword } from '@/features/auth/useAuth';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const requestResetMutation = useRequestPasswordReset();
  const resetPasswordMutation = useResetPassword();

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' }
  });

  const forgotForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' }
  });

  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '', code: '', password: '', confirmPassword: '' }
  });

  async function submitLogin(values: LoginValues) {
    await loginMutation.mutateAsync(values);
  }

  async function submitRegister(values: RegisterValues) {
    await registerMutation.mutateAsync(values);
    registerForm.reset();
    setMode('login');
    loginForm.setValue('email', values.email);
  }

  async function submitForgotPassword(values: ForgotPasswordValues) {
    await requestResetMutation.mutateAsync(values);
    resetForm.setValue('email', values.email);
    setMode('reset');
  }

  async function submitResetPassword(values: ResetPasswordValues) {
    await resetPasswordMutation.mutateAsync(values);
    resetForm.reset();
    forgotForm.reset();
    loginForm.setValue('email', values.email);
    setMode('login');
  }

  const registerPassword = registerForm.watch('password') ?? '';
  const resetPasswordValue = resetForm.watch('password') ?? '';
  const heading =
    mode === 'register'
      ? 'Create account'
      : mode === 'forgot'
        ? 'Recover account'
        : mode === 'reset'
          ? 'Set new password'
          : 'Sign in';

  const passwordToggle = (
    <button
      type="button"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      className="focus-ring press rounded-full p-1 text-textMuted hover:text-textPrimary"
      onClick={() => setShowPassword((value) => !value)}
    >
      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="flex w-full flex-col rounded-[2rem] border border-line bg-panel p-8 shadow-2xl sm:p-10">
      <div className="mb-8 flex flex-col gap-2">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.15em] text-brand-muted">
          {mode === 'login' ? 'Authentication Required' : mode === 'register' ? 'New Account' : 'Account Recovery'}
        </p>
        <h2 className="font-heading text-[1.75rem] leading-tight tracking-tight text-textPrimary">{heading}</h2>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'login' ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={pageTransition}
          >
            <form className="flex flex-col gap-5" onSubmit={loginForm.handleSubmit(submitLogin)}>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                error={loginForm.formState.errors.email?.message}
                {...loginForm.register('email')}
              />
              <motion.div animate={loginForm.formState.errors.password ? shakeX : undefined}>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  autoComplete="current-password"
                  error={loginForm.formState.errors.password?.message}
                  rightAdornment={passwordToggle}
                  {...loginForm.register('password')}
                />
              </motion.div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    forgotForm.setValue('email', loginForm.getValues('email'));
                    setMode('forgot');
                  }}
                  className="focus-ring press text-xs font-medium text-textMuted underline-offset-4 hover:text-textPrimary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <Button type="submit" className="w-full" loading={loginMutation.isPending}>
                Sign in
              </Button>
            </form>
          </motion.div>
        ) : null}

        {mode === 'register' ? (
          <motion.div
            key="register"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={pageTransition}
          >
            <form className="flex flex-col gap-5" onSubmit={registerForm.handleSubmit(submitRegister)}>
              <Input
                label="Name"
                placeholder="Alex Morgan"
                autoComplete="name"
                error={registerForm.formState.errors.name?.message}
                {...registerForm.register('name')}
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                error={registerForm.formState.errors.email?.message}
                {...registerForm.register('email')}
              />
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                error={registerForm.formState.errors.password?.message}
                rightAdornment={passwordToggle}
                {...registerForm.register('password')}
              />
              <PasswordStrengthMeter password={registerPassword} />
              <Input
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat password"
                autoComplete="new-password"
                error={registerForm.formState.errors.confirmPassword?.message}
                {...registerForm.register('confirmPassword')}
              />
              <Button type="submit" className="w-full" loading={registerMutation.isPending}>
                Create account
              </Button>
            </form>
          </motion.div>
        ) : null}

        {mode === 'forgot' ? (
          <motion.div
            key="forgot"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={pageTransition}
          >
            <form className="flex flex-col gap-5" onSubmit={forgotForm.handleSubmit(submitForgotPassword)}>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                error={forgotForm.formState.errors.email?.message}
                {...forgotForm.register('email')}
              />
              <Button type="submit" className="w-full" loading={requestResetMutation.isPending}>
                Send code
              </Button>
            </form>
          </motion.div>
        ) : null}

        {mode === 'reset' ? (
          <motion.div
            key="reset"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={pageTransition}
          >
            <form className="flex flex-col gap-5" onSubmit={resetForm.handleSubmit(submitResetPassword)}>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                error={resetForm.formState.errors.email?.message}
                {...resetForm.register('email')}
              />
              <Input
                label="Code"
                inputMode="numeric"
                placeholder="6-digit code"
                error={resetForm.formState.errors.code?.message}
                {...resetForm.register('code')}
              />
              <Input
                label="New password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                error={resetForm.formState.errors.password?.message}
                rightAdornment={passwordToggle}
                {...resetForm.register('password')}
              />
              <PasswordStrengthMeter password={resetPasswordValue} />
              <Input
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat password"
                autoComplete="new-password"
                error={resetForm.formState.errors.confirmPassword?.message}
                {...resetForm.register('confirmPassword')}
              />
              <Button type="submit" className="w-full" loading={resetPasswordMutation.isPending}>
                Reset password
              </Button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mt-8 border-t border-line/60 pt-6 text-center text-sm text-textMuted">
        {mode === 'register' ? (
          <button
            type="button"
            onClick={() => setMode('login')}
            className="focus-ring press font-medium text-textPrimary underline-offset-4 hover:underline"
          >
            Back to sign in
          </button>
        ) : mode === 'forgot' || mode === 'reset' ? (
          <div className="flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={() => setMode('login')}
              className="focus-ring press font-medium text-textPrimary underline-offset-4 hover:underline"
            >
              Back to sign in
            </button>
            {mode === 'reset' ? (
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="focus-ring press font-medium text-textPrimary underline-offset-4 hover:underline"
              >
                Resend code
              </button>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setMode('register')}
            className="focus-ring press font-medium text-textPrimary underline-offset-4 hover:underline"
          >
            Create an account
          </button>
        )}
      </div>
    </div>
  );
}

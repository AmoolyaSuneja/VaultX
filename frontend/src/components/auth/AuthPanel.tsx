import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@/components/ui';
import { appleSpring, shakeX } from '@/lib/motion';
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
      ? 'Create your vault workspace'
      : mode === 'forgot'
        ? 'Recover your account'
        : mode === 'reset'
          ? 'Set a new password'
          : 'Welcome back!';
  const passwordToggle = (
    <button
      type="button"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      className="focus-ring rounded-full p-1 text-textMuted transition hover:text-brand"
      onClick={() => setShowPassword((value) => !value)}
    >
      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="glass-panel relative mx-auto w-full max-w-[430px] transform-gpu overflow-hidden rounded-xl p-5 shadow-card sm:p-7">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/45 to-transparent" />
      <div className="mb-6 text-center sm:mb-8">
        <h2 className="mt-3 font-heading text-3xl leading-tight text-textPrimary sm:text-4xl">
          {heading}
        </h2>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'login' ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={appleSpring}
            className="transform-gpu will-change-transform"
          >
            <form className="grid gap-5" onSubmit={loginForm.handleSubmit(submitLogin)}>
              <Input
                label="Email"
                type="email"
                placeholder="alex@example.com"
                error={loginForm.formState.errors.email?.message}
                {...loginForm.register('email')}
              />
              <motion.div animate={loginForm.formState.errors.password ? shakeX : undefined}>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  error={loginForm.formState.errors.password?.message}
                  rightAdornment={passwordToggle}
                  {...loginForm.register('password')}
                />
              </motion.div>
              <Button type="submit" className="w-full" loading={loginMutation.isPending}>
                Unlock vault
              </Button>
              <button
                type="button"
                onClick={() => {
                  forgotForm.setValue('email', loginForm.getValues('email'));
                  setMode('forgot');
                }}
                className="text-left text-sm font-medium text-brand transition hover:text-brand-deep"
              >
                Forgot password?
              </button>
            </form>
          </motion.div>
        ) : null}

        {mode === 'register' ? (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={appleSpring}
            className="transform-gpu will-change-transform"
          >
            <form className="grid gap-5" onSubmit={registerForm.handleSubmit(submitRegister)}>
              <Input
                label="Name"
                placeholder="Alex Morgan"
                error={registerForm.formState.errors.name?.message}
                {...registerForm.register('name')}
              />
              <Input
                label="Email"
                type="email"
                placeholder="alex@example.com"
                error={registerForm.formState.errors.email?.message}
                {...registerForm.register('email')}
              />
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                error={registerForm.formState.errors.password?.message}
                rightAdornment={passwordToggle}
                {...registerForm.register('password')}
              />
              <PasswordStrengthMeter password={registerPassword} />
              <Input
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat password"
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
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={appleSpring}
            className="transform-gpu will-change-transform"
          >
            <form className="grid gap-5" onSubmit={forgotForm.handleSubmit(submitForgotPassword)}>
              <Input
                label="Account email"
                type="email"
                placeholder="alex@example.com"
                error={forgotForm.formState.errors.email?.message}
                {...forgotForm.register('email')}
              />
              <Button type="submit" className="w-full" loading={requestResetMutation.isPending}>
                Send recovery code
              </Button>
            </form>
          </motion.div>
        ) : null}

        {mode === 'reset' ? (
          <motion.div
            key="reset"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={appleSpring}
            className="transform-gpu will-change-transform"
          >
            <form className="grid gap-5" onSubmit={resetForm.handleSubmit(submitResetPassword)}>
              <Input
                label="Account email"
                type="email"
                placeholder="alex@example.com"
                error={resetForm.formState.errors.email?.message}
                {...resetForm.register('email')}
              />
              <Input
                label="Recovery code"
                inputMode="numeric"
                placeholder="6-digit code"
                error={resetForm.formState.errors.code?.message}
                {...resetForm.register('code')}
              />
              <Input
                label="New password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                error={resetForm.formState.errors.password?.message}
                rightAdornment={passwordToggle}
                {...resetForm.register('password')}
              />
              <PasswordStrengthMeter password={resetPasswordValue} />
              <Input
                label="Confirm new password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat password"
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

      <div className="mt-8 text-sm text-textMuted">
        {mode === 'register' ? (
          <button
            type="button"
            onClick={() => setMode('login')}
            className="font-medium text-brand transition hover:text-brand-deep"
          >
            Already have an account? Sign in
          </button>
        ) : mode === 'forgot' || mode === 'reset' ? (
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => setMode('login')}
              className="font-medium text-brand transition hover:text-brand-deep"
            >
              Back to sign in
            </button>
            {mode === 'reset' ? (
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="font-medium text-brand transition hover:text-brand-deep"
              >
                Send another code
              </button>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setMode('register')}
            className="font-medium text-brand transition hover:text-brand-deep"
          >
            New here? Create an account
          </button>
        )}
      </div>
    </div>
  );
}

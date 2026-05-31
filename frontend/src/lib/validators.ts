import { z } from 'zod';

// Strong password policy for account creation and reset:
// min 8 chars, at least one uppercase, one lowercase, one number, one special char.
export const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Add at least one uppercase letter')
  .regex(/[a-z]/, 'Add at least one lowercase letter')
  .regex(/\d/, 'Add at least one number')
  .regex(/[^A-Za-z0-9]/, 'Add at least one special character');

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password')
});

export const registerSchema = z
  .object({
    email: z.string().email('Enter a valid email address'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password')
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match'
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address')
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit recovery code'),
  password: strongPasswordSchema,
  confirmPassword: z.string().min(1, 'Confirm your password')
}).refine((value) => value.password === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match'
});

export const entrySchema = z.object({
  title: z.string().min(2, 'Title is required'),
  category: z.string().min(2, 'Category is required'),
  notes: z.string().optional().or(z.literal('')),
  tagsText: z.string().optional().or(z.literal('')),
  requiresDualApproval: z.boolean().default(false),
  secondApproverEmail: z.string().email('Enter a valid approver email').optional().or(z.literal('')),
  unlockAt: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), 'Choose a valid unlock date and time')
}).superRefine((value, ctx) => {
  if (value.requiresDualApproval && !value.secondApproverEmail) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['secondApproverEmail'],
      message: 'Add the second approver email'
    });
  }
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type EntryValues = z.infer<typeof entrySchema>;

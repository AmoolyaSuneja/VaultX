const { z } = require('zod');
const { emailSchema, passwordSchema, sixDigitCodeSchema } = require('./common');

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(80, 'Name must be at most 80 characters');

const registerBody = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema
});

const loginBody = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128)
});

const forgotPasswordBody = z.object({
  email: emailSchema
});

const resetPasswordBody = z.object({
  email: emailSchema,
  code: sixDigitCodeSchema,
  password: passwordSchema
});

module.exports = {
  registerBody,
  loginBody,
  forgotPasswordBody,
  resetPasswordBody
};

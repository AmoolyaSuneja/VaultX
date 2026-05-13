const { z } = require('zod');

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Must be a valid id');

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Must be a valid email');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

const sixDigitCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Must be a 6-digit code');

const optionalTrimmed = (max = 512) =>
  z.preprocess((value) => {
    if (value === undefined || value === null) return '';
    return typeof value === 'string' ? value.trim() : value;
  }, z.string().max(max).optional().or(z.literal('')));

const booleanLike = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

const dateTimeLike = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}, z
  .string()
  .refine((value) => value === '' || !Number.isNaN(new Date(value).getTime()), {
    message: 'Must be a valid date and time'
  })
);

module.exports = {
  objectIdSchema,
  emailSchema,
  passwordSchema,
  sixDigitCodeSchema,
  optionalTrimmed,
  booleanLike,
  dateTimeLike
};

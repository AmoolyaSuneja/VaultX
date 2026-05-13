const { z } = require('zod');

const shareIdParams = z.object({
  shareId: z
    .string()
    .regex(/^[a-f\d]{48}$/i, 'Invalid share id')
});

const verifyBody = z.object({
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128)
});

const tokenQuery = z.object({
  token: z.string().min(10, 'Download token is required').max(4096)
});

module.exports = {
  shareIdParams,
  verifyBody,
  tokenQuery
};

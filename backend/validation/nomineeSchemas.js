const { z } = require('zod');
const { emailSchema, objectIdSchema, optionalTrimmed } = require('./common');

const conditionEnum = z.enum(['death', 'incapacity', 'inactivity', 'courtOrder']);

const registerBody = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: emailSchema,
  relationship: z.string().trim().min(1, 'Relationship is required').max(80),
  condition: conditionEnum
});

const claimBody = z.object({
  ownerEmail: emailSchema,
  proofType: z.string().trim().min(1, 'Proof type is required').max(120),
  proofNotes: z.string().trim().min(1, 'Proof notes are required').max(4_000)
});

const ownerSelectorBody = z
  .object({
    ownerEmail: optionalTrimmed(254),
    ownerId: z.union([objectIdSchema, z.literal(''), z.undefined()]).optional()
  })
  .superRefine((value, ctx) => {
    if (!value.ownerEmail && !value.ownerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ownerEmail'],
        message: 'Provide either ownerEmail or ownerId'
      });
    }
  });

const approveBody = ownerSelectorBody;

const activateBody = ownerSelectorBody.and(
  z.object({
    verificationNotes: z.string().trim().min(1, 'Verification notes are required').max(4_000)
  })
);

module.exports = {
  registerBody,
  claimBody,
  approveBody,
  activateBody
};

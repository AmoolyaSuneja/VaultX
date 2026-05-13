const { z } = require('zod');
const { booleanLike, dateTimeLike, emailSchema, objectIdSchema } = require('./common');

const titleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(200, 'Title must be at most 200 characters');

const categorySchema = z
  .string()
  .trim()
  .max(60, 'Category must be at most 60 characters')
  .optional()
  .or(z.literal(''));

const freeTextSchema = (max) =>
  z.preprocess((value) => {
    if (value === undefined || value === null) return '';
    return typeof value === 'string' ? value : String(value);
  }, z.string().max(max));

const tagsSchema = z.preprocess((value) => {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value;
  return [value];
}, z.array(z.string().trim().max(40)).max(20));

const secondApproverEmailSchema = z.preprocess((value) => {
  if (value === undefined || value === null) return '';
  return typeof value === 'string' ? value.trim() : value;
}, z.union([z.literal(''), emailSchema]));

const mutateBody = z.object({
  title: titleSchema,
  category: categorySchema,
  data: freeTextSchema(20_000).optional(),
  url: freeTextSchema(2048).optional(),
  username: freeTextSchema(200).optional(),
  password: freeTextSchema(512).optional(),
  notes: freeTextSchema(20_000).optional(),
  tags: tagsSchema.optional(),
  unlockAt: dateTimeLike.optional(),
  requiresDualApproval: booleanLike.optional(),
  secondApproverEmail: secondApproverEmailSchema.optional()
}).superRefine((value, ctx) => {
  if (value.requiresDualApproval && !value.secondApproverEmail) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['secondApproverEmail'],
      message: 'Second approver email is required when dual approval is enabled'
    });
  }
});

const entryIdParams = z.object({
  id: objectIdSchema
});

const attachmentParams = z.object({
  id: objectIdSchema,
  attachmentIndex: z
    .preprocess((value) => Number(value), z.number().int().nonnegative())
});

const shareLinkBody = z.object({
  filePath: z.string().trim().min(1).max(2048),
  password: z
    .string()
    .min(4, 'Password must be at least 4 characters')
    .max(128, 'Password must be at most 128 characters')
});

const approveEmailBody = z.object({
  token: z.string().min(10, 'Approval token is required').max(4096)
});

const listQuery = z.object({
  page: z.preprocess((value) => (value === undefined ? 1 : Number(value)), z.number().int().min(1).max(1000)).optional(),
  limit: z.preprocess((value) => (value === undefined ? 50 : Number(value)), z.number().int().min(1).max(100)).optional()
});

module.exports = {
  mutateBody,
  entryIdParams,
  attachmentParams,
  shareLinkBody,
  approveEmailBody,
  listQuery
};

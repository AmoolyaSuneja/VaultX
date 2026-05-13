const { z } = require('zod');

const updateMeBody = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80).optional(),
  avatarUrl: z.string().trim().url('Must be a valid URL').max(2048).optional().or(z.literal(''))
});

module.exports = {
  updateMeBody
};

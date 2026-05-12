const { HttpError } = require('./errorHandler');

function validateVaultInput(req, res, next) {
  const { title, unlockAt, requiresDualApproval, secondApproverEmail } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return next(new HttpError('Valid title is required', 400));
  }

  if (unlockAt !== undefined && unlockAt !== null && unlockAt !== '') {
    const parsedUnlockAt = new Date(unlockAt);

    if (Number.isNaN(parsedUnlockAt.getTime())) {
      return next(new HttpError('unlockAt must be a valid date/time', 400));
    }
  }

  const dualApprovalEnabled = requiresDualApproval === true || requiresDualApproval === 'true';

  if (dualApprovalEnabled && (!secondApproverEmail || typeof secondApproverEmail !== 'string' || !secondApproverEmail.trim())) {
    return next(new HttpError('Second approver email is required when dual approval is enabled', 400));
  }

  return next();
}

module.exports = validateVaultInput;

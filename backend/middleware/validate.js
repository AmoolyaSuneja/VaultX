const { HttpError } = require('./errorHandler');

function formatZodIssues(issues) {
  if (!Array.isArray(issues) || issues.length === 0) {
    return 'Invalid request payload';
  }

  return issues
    .map((issue) => {
      const path = Array.isArray(issue.path) && issue.path.length > 0 ? issue.path.join('.') : '';
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join('; ');
}

function validate(schemas = {}) {
  return (req, res, next) => {
    for (const key of ['body', 'params', 'query']) {
      const schema = schemas[key];
      if (!schema) continue;

      const result = schema.safeParse(req[key]);
      if (!result.success) {
        return next(new HttpError(formatZodIssues(result.error?.issues || []), 400));
      }

      if (key !== 'query') {
        req[key] = result.data;
      } else {
        req.validatedQuery = result.data;
      }
    }

    return next();
  };
}

module.exports = validate;

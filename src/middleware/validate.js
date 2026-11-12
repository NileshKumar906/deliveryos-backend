
const AppError = require("../utils/AppError");

const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return next(
        new AppError(
          errors.map((error) => error.message).join(", "),
          400
        )
      );
    }

    // Store validated and transformed data
    req.validatedBody = result.data;

    next();
  };
};

module.exports = validate;

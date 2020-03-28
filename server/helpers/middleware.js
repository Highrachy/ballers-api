// eslint-disable-next-line import/prefer-default-export
export const schemaValidation = (schema) => {
  return (req, res, next) => {
    const { value, error } = schema.validate(req.body);

    if (value && !error) {
      req.locals = value;
      next();
    } else {
      res.status(412).json({ success: false, message: 'Validation Error', error: error.message });
    }
  };
};

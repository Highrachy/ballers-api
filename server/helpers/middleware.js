import httpStatus from './httpStatus';
import { decodeToken, getUserById } from '../services/user.service';

export const schemaValidation = (schema) => {
  return (req, res, next) => {
    const { value, error } = schema.validate(req.body);

    if (value && !error) {
      req.locals = value;
      next();
    } else {
      res
        .status(httpStatus.PRECONDITION_FAILED)
        .json({ success: false, message: 'Validation Error', error: error.message });
    }
  };
};

export const authenticate = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      message: 'Token needed to access resources',
    });
  }

  try {
    const { id } = decodeToken(req.headers.authorization);
    const user = await getUserById(id);
    if (user) {
      req.user = user.toJSON();
      next();
    } else {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
    }
  } catch (error) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication Failed',
      error,
    });
  }

  return null;
};

export const isAdmin = async (req, res, next) => {
  const { id } = decodeToken(req.headers.authorization);
  const user = await getUserById(id);
  if (user.role === 0) {
    next();
  } else {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      message: 'Action can only be performed by an Admin',
    });
  }
  return null;
};

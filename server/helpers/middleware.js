import mongoose from 'mongoose';
import httpStatus from './httpStatus';
import userRole from './userRole';
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
        message: 'Invalid token',
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
  const { user } = req;
  if (user && user.role === userRole.ADMIN) {
    next();
  } else {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      message: 'You are not permitted to perform this action',
    });
  }
  return null;
};

export const hasValidObjectId = async (req, res, next) => {
  const { id } = req.params;
  const { ObjectId } = mongoose.Types;

  if (ObjectId.isValid(id)) {
    next();
  } else {
    return res.status(httpStatus.PRECONDITION_FAILED).json({
      success: false,
      message: 'Invalid Id supplied',
    });
  }
  return null;
};

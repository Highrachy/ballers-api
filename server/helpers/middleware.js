import mongoose from 'mongoose';
import httpStatus from './httpStatus';
import { USER_ROLE } from './constants';
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
      if (user.banned.status) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          message:
            'Your account has been locked. Kindly contact Ballers Support for more information',
        });
      }
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

const isVerifiedVendor = (user) =>
  user && user.role === USER_ROLE.VENDOR && user.vendor.verified === true;

const isValidAdmin = (user) => user && user.role === USER_ROLE.ADMIN;

const isValidEditor = (user) => user && user.role === USER_ROLE.EDITOR;

const isValidUser = (user) => user && user.role === USER_ROLE.USER;

export const isAdmin = async (req, res, next) => {
  const { user } = req;
  if (isValidAdmin(user)) {
    next();
  } else {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      message: 'You are not permitted to perform this action',
    });
  }
  return null;
};

export const isVendor = async (req, res, next) => {
  const { user } = req;
  if (isVerifiedVendor(user)) {
    next();
  } else {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      message: 'You are not permitted to perform this action',
    });
  }
  return null;
};

export const isUnverifiedVendor = async (req, res, next) => {
  const { user } = req;
  if (user && user.role === USER_ROLE.VENDOR) {
    next();
  } else {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      message: 'You are not permitted to perform this action',
    });
  }
  return null;
};

export const isEditor = async (req, res, next) => {
  const { user } = req;
  if (isValidEditor(user)) {
    next();
  } else {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      message: 'You are not permitted to perform this action',
    });
  }
  return null;
};

export const isVendorOrAdmin = async (req, res, next) => {
  const { user } = req;
  if (isVerifiedVendor(user) || isValidAdmin(user)) {
    next();
  } else {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      message: 'You are not permitted to perform this action',
    });
  }
  return null;
};

export const isEditorOrAdmin = async (req, res, next) => {
  const { user } = req;
  if (isValidEditor(user) || isValidAdmin(user)) {
    next();
  } else {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      message: 'You are not permitted to perform this action',
    });
  }
  return null;
};

export const isAdminOrUserOrVendor = async (req, res, next) => {
  const { user } = req;
  if (isValidAdmin(user) || isValidUser(user) || isVerifiedVendor(user)) {
    next();
  } else {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      message: 'You are not permitted to perform this action',
    });
  }
  return null;
};

export const isUserOrVendor = async (req, res, next) => {
  const { user } = req;
  if (isValidUser(user) || isVerifiedVendor(user)) {
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

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.model';
import { USER_SECRET } from '../config';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { getPropertyById, updateProperty } from './property.service';

export const getUserByEmail = async (email, fields = null) =>
  User.findOne({ email }).select(fields);

export const getUserById = async (id) => User.findById(id).select();

export const generateToken = (id, expiresIn = '30d') =>
  jwt.sign({ id }, USER_SECRET, { expiresIn });

export const decodeToken = (token) => jwt.verify(token, USER_SECRET);

export const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error(error);
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error(error);
  }
};

export const addUser = async (user) => {
  const existingUser = await getUserByEmail(user.email).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (existingUser) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Email is linked to another account');
  }

  try {
    const password = await hashPassword(user.password);
    const savedUser = await new User({ ...user, password }).save();
    return generateToken(savedUser._id);
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding user', error);
  }
};

export const loginUser = async (user) => {
  const existingUser = await getUserByEmail(user.email, '+password').catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (existingUser) {
    const isMatch = await comparePassword(user.password, existingUser.password).catch((error) => {
      throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
    });

    if (isMatch) {
      const savedUser = existingUser.toJSON();
      const token = generateToken(savedUser._id);
      delete savedUser.password;

      if (savedUser.activated) {
        return {
          ...savedUser,
          token,
        };
      }
      throw new ErrorHandler(httpStatus.UNAUTHORIZED, 'Your account needs to be activated.');
    }
    throw new ErrorHandler(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  } else {
    throw new ErrorHandler(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }
};

export const activateUser = async (token) => {
  try {
    const decoded = await decodeToken(token);
    return User.findOneAndUpdate(
      { _id: decoded.id },
      { $set: { activated: true, activationDate: Date.now() } },
      { new: true, fields: '-password' },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'User not found', error);
  }
};

export const forgotPasswordToken = async (email) => {
  const existingUser = await getUserByEmail(email).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (existingUser) {
    const savedUser = existingUser.toJSON();
    return { user: savedUser, token: generateToken(savedUser._id, '1h') };
  }
  throw new ErrorHandler(httpStatus.NOT_FOUND, 'Your email address is not found.');
};

export const resetPasswordViaToken = async (password, token) => {
  try {
    const decoded = await decodeToken(token);
    const hashedPassword = await hashPassword(password);
    return User.findOneAndUpdate(
      { _id: decoded.id },
      { $set: { password: hashedPassword } },
      { new: true, fields: '-password' },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'User not found', error);
  }
};

export const assignPropertyToUser = async (toBeAssigned) => {
  const assignedProperty = {
    propertyId: toBeAssigned.propertyId,
    assignedBy: toBeAssigned.assignedBy,
    assignedDate: Date.now(),
  };
  const property = await getPropertyById(toBeAssigned.propertyId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (property.units < 1) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'No available units');
  }

  const owner = await getUserById(toBeAssigned.userId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  try {
    const newUnitCount = {
      id: property.id,
      units: property.units - 1,
    };
    const updatePropertyUnit = await updateProperty(newUnitCount).catch((error) => {
      throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
    });

    if (updatePropertyUnit) {
      return User.findByIdAndUpdate(owner.id, { $push: { assignedProperties: assignedProperty } });
    }

    return new ErrorHandler(httpStatus.BAD_REQUEST, 'Error assigning property');
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error assigning property', error);
  }
};

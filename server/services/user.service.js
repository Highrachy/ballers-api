import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.model';
import { USER_SECRET } from '../config';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';

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

export const getUserByReferralCode = async (referralCode, fields = null) =>
  User.findOne({ referralCode }).select(fields);

export const generateCode = (name) => {
  const firstName = name.replace(/\s/g, '');
  const possible = '0123456789';
  const charsToAdd = firstName.length < 2 ? 6 - firstName.length : 4;
  let referralCode = firstName.substring(0, 2).toLowerCase();

  for (let i = 0; i < charsToAdd; i += 1) {
    referralCode += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return referralCode;
};

export const generateReferralCode = async (firstName) => {
  let referralCode;
  let referralCodeIsUsed = true;

  while (referralCodeIsUsed) {
    referralCode = generateCode(firstName);
    // eslint-disable-next-line no-await-in-loop
    const invalidReferralCode = await getUserByReferralCode(referralCode).catch((error) => {
      throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
    });
    if (invalidReferralCode === null) {
      referralCodeIsUsed = false;
    }
  }
  return referralCode;
};

export const addUser = async (user) => {
  const referralCode = await generateReferralCode(user.firstName).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  const existingUser = await getUserByEmail(user.email).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (existingUser) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Email is linked to another account');
  }

  try {
    const password = await hashPassword(user.password);
    const savedUser = await new User({ ...user, password, referralCode }).save();
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

export const updateUser = async (updatedUser) => {
  const user = await getUserById(updatedUser.id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  try {
    return User.findByIdAndUpdate(user.id, updatedUser);
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating user', error);
  }
};

export const getAllRegisteredUsers = async () => User.find();

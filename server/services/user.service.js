import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.model';
import { USER_SECRET } from '../config';
import { ErrorHandler } from '../helpers/errorHandler';

export const getUserByEmail = async (email) => User.findOne({ email });
export const getUserById = async (id) => User.findById(id);

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
    throw new ErrorHandler(500, 'Internal Server Error', error);
  });

  if (existingUser) {
    throw new ErrorHandler(412, 'Email is linked to another account');
  }

  try {
    const password = await hashPassword(user.password);
    const savedUser = await new User({ ...user, password }).save();
    return generateToken(savedUser._id);
  } catch (error) {
    throw new ErrorHandler(400, 'Error adding user', error);
  }
};

export const loginUser = async (user) => {
  const existingUser = await getUserByEmail(user.email).catch((error) => {
    throw new ErrorHandler(500, 'Internal Server Error', error);
  });

  if (existingUser) {
    const isMatch = await comparePassword(user.password, existingUser.password).catch((error) => {
      throw new ErrorHandler(500, 'Internal Server Error', error);
    });

    if (isMatch) {
      const savedUser = existingUser.toJSON();
      const token = generateToken(savedUser.id);
      delete savedUser.password;

      if (savedUser.activated) {
        return {
          ...savedUser,
          token,
        };
      }
      throw new ErrorHandler(401, 'Your account needs to be activated.');
    }
    throw new ErrorHandler(401, 'Invalid email or password');
  } else {
    throw new ErrorHandler(401, 'Invalid email or password');
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
    throw new ErrorHandler(404, 'User not found', error);
  }
};

export const forgotPasswordToken = async (email) => {
  const existingUser = await getUserByEmail(email).catch((error) => {
    throw new ErrorHandler(500, 'Internal Server Error', error);
  });

  if (existingUser) {
    const savedUser = existingUser.toJSON();
    return { user: savedUser, token: generateToken(savedUser._id, '1h') };
  }
  throw new ErrorHandler(404, 'Your email address is not found.');
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
    throw new ErrorHandler(404, 'User not found', error);
  }
};

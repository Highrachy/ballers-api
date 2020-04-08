import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.model';
import { USER_SECRET } from '../config';
import { ErrorHandler } from '../helpers/errorHandler';

export const getUserByEmail = async (email) => User.findOne({ email });
export const getUserById = async (id) => User.findById(id);

export const generateToken = (id) => jwt.sign({ id }, USER_SECRET, { expiresIn: '30d' });

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
    const id = existingUser._id;
    try {
      const isMatch = await comparePassword(user.password, existingUser.password);
      if (isMatch) {
        const token = generateToken(id);
        const payload = {
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          email: existingUser.email,
          phone: existingUser.phone,
          token,
        };
        return payload;
      }
      throw new ErrorHandler(500, 'Internal Server Error');
    } catch (error) {
      throw new ErrorHandler(401, 'Invalid email or password', error);
    }
  } else {
    throw new ErrorHandler(401, 'Invalid email or password');
  }
};

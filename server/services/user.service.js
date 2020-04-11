/* eslint-disable no-underscore-dangle */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import dotenv from 'dotenv';
import fbstrategy from 'passport-facebook';
import GoogleStrategy from 'passport-google-oauth20';
import User from '../models/user.model';
import { USER_SECRET } from '../config';
import { ErrorHandler } from '../helpers/errorHandler';

dotenv.config();
const FacebookStrategy = fbstrategy.Strategy;

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

export const loginSocialMedia = async (email) => {
  const existingUser = await getUserByEmail(email).catch((error) => {
    throw new ErrorHandler(500, 'Internal Server Error', error);
  });

  if (existingUser) {
    const id = existingUser._id;
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
  throw new ErrorHandler(401, 'Email address is not registered with Ballers');
};

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['email', 'name'],
    },
    (accessToken, refreshToken, profile, done) => {
      // eslint-disable-next-line camelcase
      const { email, first_name, last_name } = profile._json;
      const faceBookData = {
        email,
        firstName: first_name,
        lastName: last_name,
      };

      done(null, loginSocialMedia(faceBookData.email));
    },
  ),
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      const { email } = profile._json;
      const googleData = { email };

      done(null, loginSocialMedia(googleData.email));
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

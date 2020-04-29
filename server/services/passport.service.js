/* eslint-disable no-underscore-dangle */
import passport from 'passport';
import dotenv from 'dotenv';
import fbstrategy from 'passport-facebook';
import GoogleStrategy from 'passport-google-oauth20';
import { loginViaSocialMedia } from './user.service';

dotenv.config();
const FacebookStrategy = fbstrategy.Strategy;
const randomPassword = Math.random().toString(36).substring(2, 15);

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
        password: randomPassword,
      };

      done(null, loginViaSocialMedia(faceBookData));
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
      // eslint-disable-next-line camelcase
      const { email, given_name, family_name } = profile._json;
      const googleData = {
        email,
        firstName: given_name,
        lastName: family_name,
        password: randomPassword,
      };

      done(null, loginViaSocialMedia(googleData));
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

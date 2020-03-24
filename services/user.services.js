import bcrypt from 'bcryptjs';
import logger from '../config/winston';
import User from '../models/user.model';

export const getEmail = (email) => {
  const query = { email };
  return new Promise((resolve, reject) => {
    User.find(query)
      .then((user) => {
        if (user.length > 1) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const getUserById = (id) => {
  const query = { _id: id };
  return User.findById(query, (error, user) => {
    if (error) throw error;
    logger.info(user._id);
    return user;
  });
};

export const addUser = (newUser) => {
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.password, salt, (error, hash) => {
      if (error) throw error;
      newUser.password = hash;
      newUser.save()
        .then((user) => {
          const userId = { id: user._id };
          logger.info(`User with ID ${userId.id} saved`);
          return userId;
        })
        .catch((e) => {
          logger.error(`Error while saving ${e}`);
        });
    });
  });
};

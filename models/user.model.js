import mongoose from 'mongoose';
import Joi from '@hapi/joi';
import joigoose from 'joigoose';

const Joigoose = (joigoose)(mongoose, { convert: false });

const joiUserSchema = Joi.object({
  firstName: Joi.string().trim(),
  lastName: Joi.string().trim(),
  email: Joi.string().email(),
  password: Joi.string(),
  phone: Joi.string(),
  createdAt: Joi.date().default(Date.now),
  updatedAt: Joi.date().default(Date.now),
});

const UserSchema = new mongoose.Schema(Joigoose.convert(joiUserSchema));

const User = mongoose.model('User', UserSchema);

export default User;

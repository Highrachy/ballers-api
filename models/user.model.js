import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Joi from '@hapi/joi';
import joigoose from 'joigoose';

const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error(error);
  }
};

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

// Note: arrow function cannot be used in a pre hook
// eslint-disable-next-line func-names
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await hashPassword(this.password);
  }
  next();
});

const User = mongoose.model('User', UserSchema);

export default User;

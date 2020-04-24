import Joi from '@hapi/joi';

const email = Joi.string().label('Email Address').email().required();
const password = Joi.string().label('Password').min(6).required().strict();
const confirmPassword = Joi.string().valid(Joi.ref('password')).required().strict().messages({
  'any.only': 'Password does not match',
});
const phone = Joi.string().allow(null, '').optional().default('');
const requiredString = (label) => Joi.string().label(label).required();

export const registerSchema = Joi.object({
  firstName: requiredString('First Name'),
  lastName: requiredString('Last Name'),
  email,
  phone,
  password,
  confirmPassword,
});

export const loginSchema = Joi.object({
  email,
  password,
});

export const resetPasswordSchema = Joi.object({
  email,
});

export const changePasswordSchema = Joi.object({
  password,
  confirmPassword,
});

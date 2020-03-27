import Joi from '@hapi/joi';

// eslint-disable-next-line import/prefer-default-export
export const registerSchema = Joi.object({
  firstName: Joi.string().label('First Name').required(),
  lastName: Joi.string().required(),
  email: Joi.string().label('Email Address').email().required(),
  password: Joi.string().label('Password').min(6).required().strict(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().strict().messages({
    'any.only': 'Password does not match',
  }),
  phone: Joi.string().allow(null, '').optional().default(''),
});

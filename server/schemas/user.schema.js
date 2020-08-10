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

const address = Joi.object().keys({
  street1: Joi.string().label('Street 1').optional(),
  street2: Joi.string().label('Street 2').optional(),
  city: Joi.string().label('City').optional(),
  state: Joi.string().label('State').optional(),
  country: Joi.string().label('Country').optional(),
});

export const updateUserSchema = Joi.object({
  firstName: requiredString('First Name'),
  lastName: requiredString('Last Name'),
  phone,
  phone2: Joi.string().label('Phone 2').optional(),
  address,
});

const preferences = Joi.object().keys({
  type: Joi.string().label('Property type').required(),
  location: Joi.string().label('Property location').required(),
  maxPrice: Joi.number().label('Property maxiimum price').required(),
  minPrice: Joi.number().label('Property minimum price').required(),
});

export const userPreferenceSchema = Joi.object({
  preferences,
});

import Joi from '@hapi/joi';

Joi.objectId = require('joi-objectid')(Joi);

const email = Joi.string().label('Email Address').email().required();
const password = Joi.string().label('Password').min(6).required().strict();
const confirmPassword = Joi.string().valid(Joi.ref('password')).required().strict().messages({
  'any.only': 'Password does not match',
});
const phone = Joi.string().allow(null, '').optional().default('');
const requiredString = (label) => Joi.string().label(label).required();
const optionalString = (label) => Joi.string().label(label).optional();
const optionalBoolean = (label) => Joi.boolean().label(label).optional();

const directors = [
  {
    name: optionalString('Name'),
    isSignatory: optionalBoolean('Signatory'),
    signature: optionalString('Signature'),
    phone: optionalString('Phone'),
  },
];

const socialMedia = [
  {
    name: optionalString('First Name'),
    url: optionalString('Last Name'),
  },
];

const vendor = Joi.object().keys({
  companyName: optionalString('Company Name'),
});

export const registerSchema = Joi.object({
  firstName: requiredString('First Name'),
  lastName: requiredString('Last Name'),
  vendor,
  email,
  phone,
  password,
  confirmPassword,
  referralCode: optionalString('Referral Code'),
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

export const assignPropertySchema = Joi.object({
  propertyId: Joi.objectId().label('Property id').required(),
  userId: Joi.objectId().label('User id').required(),
});

const address = Joi.object().keys({
  street1: Joi.string().label('Street 1').optional(),
  street2: Joi.string().label('Street 2').optional(),
  city: Joi.string().label('City').optional(),
  state: Joi.string().label('State').optional(),
  country: Joi.string().label('Country').optional(),
});

const preferences = Joi.object().keys({
  houseType: Joi.string().label('Property House Type').optional(),
  location: Joi.string().label('Property Location').optional(),
  maxPrice: Joi.number().label('Property Maximum Price').optional(),
  minPrice: Joi.number().label('Property Minimum Price').optional(),
  paymentPlan: Joi.string().label('Payment Plan').optional(),
});

export const updateUserSchema = Joi.object({
  firstName: requiredString('First Name'),
  lastName: requiredString('Last Name'),
  phone,
  phone2: Joi.string().label('Phone 2').optional(),
  address,
  preferences,
});

export const favoritePropertySchema = Joi.object({
  propertyId: Joi.objectId().label('Property id').required(),
});

export const userEditorSchema = Joi.object({
  userId: Joi.objectId().label('User id').required(),
});

export const verifyVendorSchema = Joi.object({
  vendorId: Joi.objectId().label('Vendor id').required(),
});

export const verifyVendorInfoSchema = Joi.object({
  vendorId: Joi.objectId().label('Vendor id').required(),
  step: requiredString('Step'),
});

export const addCommentVendorSchema = Joi.object({
  vendorId: Joi.objectId().label('Vendor id').required(),
  step: requiredString('Step'),
  comment: requiredString('Comment'),
});

export const updateVendorSchema = Joi.object({
  accountNumber: optionalString('Account Number'),
  companyAddress: optionalString('Company Address'),
  companyLogo: optionalString('Company Logo'),
  companyName: optionalString('Company Name'),
  directors,
  identification: optionalString('Identification'),
  redanNumber: optionalString('Redan Number'),
  socialMedia,
  website: optionalString('Website'),
});

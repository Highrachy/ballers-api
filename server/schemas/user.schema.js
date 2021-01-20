import Joi from '@hapi/joi';

Joi.objectId = require('joi-objectid')(Joi);

const email = Joi.string().label('Email Address').email().required();
const password = Joi.string().label('Password').min(6).required().strict();
const confirmPassword = Joi.string().valid(Joi.ref('password')).required().strict().messages({
  'any.only': 'Password does not match',
});
const phone = Joi.string().allow(null, '').optional().default('');
const requiredString = (label) => Joi.string().label(label).required();
const optionalString = (label) => Joi.string().label(label).allow(null, '').optional();
const optionalBoolean = (label) => Joi.boolean().label(label).optional();

const directorSchema = {
  name: optionalString('Name'),
  phone: optionalString('Phone'),
  isSignatory: optionalBoolean('Signatory'),
  signature: optionalString('Signature'),
};

const directors = Joi.array().items(Joi.object().keys(directorSchema));

const socialMedia = Joi.array().items(
  Joi.object().keys({
    name: optionalString('First Name'),
    url: optionalString('Last Name'),
  }),
);

const bankInfo = Joi.object().keys({
  accountName: optionalString('Account Name'),
  accountNumber: optionalString('Account Number'),
  bankName: optionalString('Bank Name'),
});

const identification = Joi.object().keys({
  url: optionalString('URL'),
  type: optionalString('type'),
});

const vendorCompanyName = Joi.object().keys({
  companyName: optionalString('Company Name'),
});

const vendor = Joi.object().keys({
  bankInfo,
  companyLogo: optionalString('Company Logo'),
  companyName: optionalString('Company Name'),
  directors,
  entity: optionalString('Entity'),
  identification,
  redanNumber: optionalString('Redan Number'),
  socialMedia,
  taxCertificate: optionalString('Company Name'),
  website: optionalString('Website'),
});

export const registerSchema = Joi.object({
  firstName: requiredString('First Name'),
  lastName: requiredString('Last Name'),
  vendor: vendorCompanyName,
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
  street1: optionalString('Street 1'),
  street2: optionalString('Street 2'),
  city: optionalString('City'),
  state: optionalString('State'),
  country: optionalString('Country'),
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
  phone2: optionalString('Phone 2'),
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
  phone,
  phone2: optionalString('Phone 2'),
  address,
  vendor,
});

export const updateDirectorSchema = Joi.object({
  ...directorSchema,
  _id: Joi.objectId().label('Director id').required(),
});

export const resolveCommentVendorSchema = Joi.object({
  vendorId: Joi.objectId().label('Vendor id').required(),
  step: requiredString('Step'),
  commentId: Joi.objectId().label('Comment id').required(),
});

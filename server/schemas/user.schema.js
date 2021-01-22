import Joi from '@hapi/joi';
import { VENDOR_STEPS } from '../helpers/constants';
import {
  requiredEmail,
  requiredObjectId,
  requiredPhoneNumber,
  requiredString,
  optionalPhoneNumber,
  optionalString,
  optionalBoolean,
  optionalNumber,
  optionalAddress,
  notRequiredPhoneNumber,
} from './helper.schema';

const email = requiredEmail('Email Address');
const password = Joi.string().label('Password').min(6).required().strict();
const confirmPassword = Joi.string().valid(Joi.ref('password')).required().strict().messages({
  'any.only': 'Password does not match',
});

const directorSchema = {
  name: optionalString('Name'),
  phone: optionalPhoneNumber('Phone'),
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

const step = Joi.string()
  .label('Step')
  .valid(...VENDOR_STEPS)
  .required();

export const registerSchema = Joi.object({
  firstName: requiredString('First Name'),
  lastName: requiredString('Last Name'),
  vendor: vendorCompanyName,
  email,
  phone: notRequiredPhoneNumber('Phone'),
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
  propertyId: requiredObjectId('Property id'),
  userId: requiredObjectId('User id'),
});

const preferences = Joi.object().keys({
  houseType: optionalString('Property House Type'),
  location: optionalString('Property Location'),
  maxPrice: optionalNumber('Property Maximum Price'),
  minPrice: optionalNumber('Property Minimum Price'),
  paymentPlan: optionalString('Payment Plan'),
});

export const updateUserSchema = Joi.object({
  firstName: requiredString('First Name'),
  lastName: requiredString('Last Name'),
  phone: requiredPhoneNumber('Phone'),
  phone2: notRequiredPhoneNumber('Phone 2'),
  address: optionalAddress,
  preferences,
});

export const favoritePropertySchema = Joi.object({
  propertyId: requiredObjectId('Property id'),
});

export const userEditorSchema = Joi.object({
  userId: requiredObjectId('User id'),
});

export const verifyVendorSchema = Joi.object({
  vendorId: requiredObjectId('Vendor id'),
});

export const verifyVendorInfoSchema = Joi.object({
  vendorId: requiredObjectId('Vendor id'),
  step,
});

export const addCommentVendorSchema = Joi.object({
  vendorId: requiredObjectId('Vendor id'),
  step,
  comment: requiredString('Comment'),
});

export const updateVendorSchema = Joi.object({
  phone: optionalPhoneNumber('Phone'),
  phone2: notRequiredPhoneNumber('Phone 2'),
  address: optionalAddress,
  vendor,
});

export const updateDirectorSchema = Joi.object({
  ...directorSchema,
  _id: requiredObjectId('Director id'),
});

export const resolveCommentVendorSchema = Joi.object({
  vendorId: requiredObjectId('Vendor id'),
  step,
  commentId: requiredObjectId('Comment id'),
});

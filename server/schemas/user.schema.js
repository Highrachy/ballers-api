import Joi from '@hapi/joi';
import { VENDOR_STEPS } from '../helpers/constants';
import {
  requiredEmail,
  requiredObjectId,
  requiredString,
  requiredPassword,
  requiredConfirmPassword,
  requiredPercentage,
  optionalPhoneNumber,
  optionalString,
  optionalBoolean,
  optionalNumber,
  optionalAddress,
  nonRequiredPhoneNumber,
  optionalObjectId,
} from './helper.schema';

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
  email: requiredEmail('Email Address'),
  phone: nonRequiredPhoneNumber('Phone'),
  password: requiredPassword('Password'),
  confirmPassword: requiredConfirmPassword('password'),
  referralCode: optionalString('Referral Code'),
});

export const loginSchema = Joi.object({
  email: requiredEmail('Email Address'),
  password: requiredPassword('Password'),
});

export const resetPasswordSchema = Joi.object({
  email: requiredEmail('Email Address'),
});

export const changePasswordSchema = Joi.object({
  password: requiredPassword('Password'),
  confirmPassword: requiredConfirmPassword('password'),
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

const additionalInfo = Joi.object().keys({
  bankInfo,
});

export const updateUserSchema = Joi.object({
  firstName: optionalString('First Name'),
  lastName: optionalString('Last Name'),
  phone: optionalPhoneNumber('Phone'),
  phone2: optionalPhoneNumber('Phone 2'),
  address: optionalAddress,
  profileImage: optionalString('Profile Image'),
  preferences,
  additionalInfo,
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
  phone2: nonRequiredPhoneNumber('Phone 2'),
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

export const banUserSchema = Joi.object({
  userId: requiredObjectId('User id'),
  reason: requiredString('Reason'),
});

export const unbanUserSchema = Joi.object({
  caseId: requiredObjectId('Case id'),
  userId: requiredObjectId('User id'),
  reason: requiredString('Reason'),
});

export const updateRemittancePercentageSchema = Joi.object({
  vendorId: requiredObjectId('Vendor id'),
  percentage: requiredPercentage('Remittance'),
});

export const emailActivationSchema = Joi.object({
  userId: optionalObjectId('User id'),
});

export const updateReferralPercentageSchema = Joi.object({
  userId: requiredObjectId('User id'),
  percentage: requiredPercentage('Percentage'),
});

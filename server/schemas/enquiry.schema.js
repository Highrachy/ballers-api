import Joi from '@hapi/joi';
import {
  requiredAddress,
  requiredObjectId,
  requiredFutureDate,
  requiredString,
  requiredNumber,
  requiredPhoneNumber,
  nonRequiredString,
  nonRequiredPhoneNumber,
  requiredEmail,
} from './helper.schema';

export const addEnquirySchema = Joi.object({
  title: requiredString('Title'),
  propertyId: requiredObjectId('Property ID'),
  firstName: requiredString('First Name'),
  otherName: nonRequiredString('Other Name'),
  lastName: requiredString('Last Name'),
  address: requiredAddress,
  phone: requiredPhoneNumber('Phone'),
  phone2: nonRequiredPhoneNumber('Phone 2'),
  occupation: requiredString('Occupation'),
  email: requiredEmail('Email Address'),
  nameOnTitleDocument: requiredString('Name on Title Document'),
  investmentFrequency: requiredNumber('Investment Frequency'),
  initialInvestmentAmount: requiredNumber('Initial Investment Amount'),
  periodicInvestmentAmount: requiredNumber('Periodic Investment Amount'),
  investmentStartDate: requiredFutureDate('Investment Start Date'),
});

export const approveEnquirySchema = Joi.object({
  enquiryId: requiredObjectId('Enquiry Id'),
});

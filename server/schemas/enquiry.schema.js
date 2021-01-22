import Joi from '@hapi/joi';
import {
  requiredObjectId,
  requiredFutureDate,
  requiredString,
  requiredNumber,
  requiredPhoneNumber,
  optionalString,
  optionalPhoneNumber,
  requiredEmail,
} from './helper.schema';

const address = Joi.object().keys({
  street1: requiredString('Street 1'),
  street2: optionalString('Street 2'),
  city: requiredString('City'),
  state: requiredString('State'),
  country: requiredString('Country'),
});

export const addEnquirySchema = Joi.object({
  title: requiredString('Title'),
  propertyId: requiredObjectId('Property ID'),
  firstName: requiredString('First Name'),
  otherName: optionalString('Other Name'),
  lastName: requiredString('Last Name'),
  address,
  phone: requiredPhoneNumber('Phone'),
  phone2: optionalPhoneNumber('Phone 2'),
  occupation: requiredString('Occupation'),
  email: requiredEmail('Email Address'),
  nameOnTitleDocument: requiredString('Name on Title Document'),
  investmentFrequency: requiredString('Investment Frequency'),
  initialInvestmentAmount: requiredNumber('Initial Investment Amount'),
  periodicInvestmentAmount: requiredNumber('Periodic Investment Amount'),
  investmentStartDate: requiredFutureDate('Investment Start Date'),
});

export const approveEnquirySchema = Joi.object({
  enquiryId: requiredObjectId('Enquiry Id'),
});

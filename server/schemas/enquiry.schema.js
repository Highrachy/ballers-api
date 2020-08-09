import Joi from '@hapi/joi';

export const addEnquirySchema = Joi.object({
  title: Joi.string().label('Title').required(),
  propertyId: Joi.string().label('Property ID').required(),
  firstName: Joi.string().label('Firstname').required(),
  otherName: Joi.string().label('Othername').optional(),
  lastName: Joi.string().label('Lastname').required(),
  address: Joi.string().label('Address').required(),
  occupation: Joi.string().label('Occupation').required(),
  phone: Joi.string().label('Phone').required(),
  email: Joi.string().label('Email Address').email().required(),
  nameOnTitleDocument: Joi.string().label('Name on title document').required(),
  investmentFrequency: Joi.string().label('Investment frequency').required(),
  initialInvestmentAmount: Joi.number().label('Initial investment amount').required(),
  periodicInvestmentAmount: Joi.number().label('Periodic investment amount').required(),
  investmentStartDate: Joi.date().label('Investment start date').required(),
});

export const approveEnquirySchema = Joi.object({
  enquiryId: Joi.string().label('Enquiry Id').required(),
});

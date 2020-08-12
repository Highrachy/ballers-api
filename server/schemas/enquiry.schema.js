import Joi from '@hapi/joi';

const address = Joi.object().keys({
  street1: Joi.string().label('Street 1').required(),
  street2: Joi.string().label('Street 2').optional(),
  city: Joi.string().label('City').required(),
  state: Joi.string().label('State').required(),
  country: Joi.string().label('Country').required(),
});

export const addEnquirySchema = Joi.object({
  title: Joi.string().label('Title').required(),
  propertyId: Joi.string().label('Property ID').required(),
  firstName: Joi.string().label('First name').required(),
  otherName: Joi.string().label('Other name').optional(),
  lastName: Joi.string().label('Last name').required(),
  address,
  phone2: Joi.string().label('Phone 2').optional(),
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

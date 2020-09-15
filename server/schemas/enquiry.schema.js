import Joi from '@hapi/joi';

Joi.objectId = require('joi-objectid')(Joi);

const today = new Date().toISOString().slice(0, 10);

const address = Joi.object().keys({
  street1: Joi.string().label('Street 1').required(),
  street2: Joi.string().label('Street 2').optional(),
  city: Joi.string().label('City').required(),
  state: Joi.string().label('State').required(),
  country: Joi.string().label('Country').required(),
});

export const addEnquirySchema = Joi.object({
  title: Joi.string().label('Title').required(),
  propertyId: Joi.objectId().label('Property ID').required(),
  firstName: Joi.string().label('First Name').required(),
  otherName: Joi.string().label('Other Name').optional(),
  lastName: Joi.string().label('Last Name').required(),
  address,
  phone2: Joi.string().label('Phone 2').optional(),
  occupation: Joi.string().label('Occupation').required(),
  phone: Joi.string().label('Phone').required(),
  email: Joi.string().label('Email Address').email().required(),
  nameOnTitleDocument: Joi.string().label('Name on Title Document').required(),
  investmentFrequency: Joi.string().label('Investment Frequency').required(),
  initialInvestmentAmount: Joi.number().label('Initial Investment Amount').required(),
  periodicInvestmentAmount: Joi.number().label('Periodic Investment Amount').required(),
  investmentStartDate: Joi.date()
    .greater(today)
    .label('Investment Start Date')
    .required()
    .messages({
      'date.greater': `"Investment Start Date" should a date later than ${new Date(
        Date.parse(today),
      ).toUTCString()}`,
    }),
});

export const approveEnquirySchema = Joi.object({
  enquiryId: Joi.objectId().label('Enquiry Id').required(),
});

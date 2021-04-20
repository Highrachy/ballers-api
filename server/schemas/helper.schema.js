import Joi from '@hapi/joi';
import { getTodaysDateInWords, getTodaysDateStandard } from '../helpers/dates';
import { PAYMENT_FREQUENCIES } from '../helpers/constants';

Joi.objectId = require('joi-objectid')(Joi);

export const requiredDate = (label) => Joi.date().label(label).required();
export const requiredEmail = (label) => Joi.string().label(label).email().required();
export const requiredNumber = (label) => Joi.number().label(label).required();
export const requiredObjectId = (label) => Joi.objectId().label(label).required();
export const requiredPhoneNumber = (label) => Joi.string().label(label).min(6).max(14).required();
export const requiredPassword = (label) => Joi.string().label(label).min(6).required().strict();
export const requiredConfirmPassword = (label) =>
  Joi.string().valid(Joi.ref(label)).required().strict().messages({
    'any.only': 'Password does not match',
  });
export const requiredString = (label) => Joi.string().label(label).required();
export const requiredPercentage = (label) =>
  Joi.number().min(1).max(100).label(`${label} In Percentage`).required();
export const requiredRange = (label, min = 0, max = 100) =>
  Joi.number().min(min).max(max).label(label).required();
export const requiredFutureDate = (label) =>
  Joi.date()
    .greater(getTodaysDateStandard())
    .label(label)
    .required()
    .messages({
      'date.greater': `"${label}" should a date later than ${getTodaysDateInWords()}`,
    });
export const requiredPaymentFrequency = (label) =>
  Joi.number()
    .valid(...PAYMENT_FREQUENCIES)
    .label(label)
    .required();

export const optionalArray = (label) => Joi.array().label(label).optional();
export const optionalBoolean = (label) => Joi.boolean().label(label).optional();
export const optionalEmail = (label) => Joi.string().label(label).email().optional();
export const optionalNumber = (label) => Joi.number().label(label).optional();
export const optionalObjectId = (label) => Joi.objectId().label(label).optional();
export const optionalPercentage = (label) =>
  Joi.number().min(0).max(100).label(`${label} In Percentage`).optional();
export const optionalPhoneNumber = (label) => Joi.string().label(label).min(6).max(14).optional();
export const optionalString = (label) => Joi.string().label(label).optional();

export const nonRequiredEmail = (label) => Joi.string().label(label).email().allow(null, '');
export const nonRequiredString = (label) => Joi.string().label(label).allow(null, '');
export const nonRequiredNumber = (label) => Joi.number().label(label).allow(null, '');
export const nonRequiredPhoneNumber = (label) =>
  Joi.string().allow(null, '').label(label).min(6).max(14).optional().default('');

export const optionalAddress = Joi.object().keys({
  street1: optionalString('Street 1'),
  street2: nonRequiredString('Street 2'),
  city: optionalString('City'),
  state: optionalString('State'),
  country: optionalString('Country'),
});

export const requiredAddress = Joi.object().keys({
  street1: requiredString('Street 1'),
  street2: nonRequiredString('Street 2'),
  city: requiredString('City'),
  state: requiredString('State'),
  country: Joi.string().label('Country').default('Nigeria'),
});

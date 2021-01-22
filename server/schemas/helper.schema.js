import Joi from '@hapi/joi';
import { getTodaysDateInWords, getTodaysDateStandard } from '../helpers/dates';

Joi.objectId = require('joi-objectid')(Joi);

export const requiredDate = (label) => Joi.date().label(label).required();
export const requiredEmail = (label) => Joi.string().label(label).email().required();
export const requiredNumber = (label) => Joi.number().label(label).required();
export const requiredObjectId = (label) => Joi.objectId().label(label).required();
export const requiredPhoneNumber = (label) => Joi.string().label(label).min(7).max(15).required();
export const requiredString = (label) => Joi.string().label(label).required();
export const requiredFutureDate = (label) =>
  Joi.date()
    .greater(getTodaysDateStandard())
    .label(label)
    .required()
    .messages({
      'date.greater': `"${label}" should a date later than ${getTodaysDateInWords()}`,
    });

export const optionalArray = (label) => Joi.array().label(label).optional();
export const optionalBoolean = (label) => Joi.boolean().label(label).optional();
export const optionalEmail = (label) => Joi.string().label(label).email().optional();
export const optionalNumber = (label) => Joi.number().label(label).optional();
export const optionalObjectId = (label) => Joi.objectId().label(label).optional();
export const optionalPhoneNumber = (label) => Joi.string().label(label).min(7).max(15).optional();
export const optionalString = (label) => Joi.string().label(label).optional();

export const notRequiredString = (label) => Joi.string().label(label).allow(null, '');
export const notRequiredPhoneNumber = (label) =>
  Joi.string().allow(null, '').label(label).min(7).max(15).optional().default('');

export const optionalAddress = Joi.object().keys({
  street1: optionalString('Street 1'),
  street2: notRequiredString('Street 2'),
  city: optionalString('City'),
  state: optionalString('State'),
  country: optionalString('Country'),
});

export const requiredAddress = Joi.object().keys({
  street1: requiredString('Street 1'),
  street2: notRequiredString('Street 2'),
  city: requiredString('City'),
  state: requiredString('State'),
  country: Joi.string().label('Country').default('Nigeria'),
});

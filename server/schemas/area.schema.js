import Joi from '@hapi/joi';
import {
  requiredObjectId,
  requiredString,
  optionalString,
  nonRequiredNumber,
} from './helper.schema';

export const addAreaSchema = Joi.object({
  area: requiredString('Area'),
  state: requiredString('State'),
  longitude: nonRequiredNumber('Longitude'),
  latitude: nonRequiredNumber('Latitude'),
});

export const updateAreaSchema = Joi.object({
  id: requiredObjectId('Area Id'),
  area: optionalString('Area'),
  state: optionalString('State'),
  longitude: nonRequiredNumber('Longitude'),
  latitude: nonRequiredNumber('Latitude'),
});

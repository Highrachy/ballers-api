import Joi from '@hapi/joi';
import { requiredObjectId, requiredString, optionalString, optionalNumber } from './helper.schema';

export const addAreaSchema = Joi.object({
  area: requiredString('Area'),
  state: requiredString('State'),
  longitude: optionalNumber('Longitude'),
  latitude: optionalNumber('Latitude'),
});

export const updateAreaSchema = Joi.object({
  id: requiredObjectId('Area Id'),
  area: optionalString('Area'),
  state: optionalString('State'),
  longitude: optionalNumber('Longitude'),
  latitude: optionalNumber('Latitude'),
});

import Joi from '@hapi/joi';

export const addAreaSchema = Joi.object({
  area: Joi.string().label('Area').required(),
  state: Joi.string().label('State').required(),
  longitude: Joi.number().label('Longitude').optional(),
  latitude: Joi.number().label('Latitude').optional(),
});

export const updateAreaSchema = Joi.object({
  id: Joi.objectId().label('Area Id').required(),
  area: Joi.string().label('Area').optional(),
  state: Joi.string().label('State').optional(),
  longitude: Joi.number().label('Longitude').optional(),
  latitude: Joi.number().label('Latitude').optional(),
});

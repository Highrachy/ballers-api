import Joi from '@hapi/joi';

const addAreaSchema = Joi.object({
  area: Joi.string().label('Area').required(),
  state: Joi.string().label('State').required(),
  longitude: Joi.number().label('Longitude').optional(),
  latitude: Joi.number().label('Latitude').optional(),
});

export default addAreaSchema;

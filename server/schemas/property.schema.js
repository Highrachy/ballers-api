import Joi from '@hapi/joi';

export const addPropertySchema = Joi.object({
  name: Joi.string().label('Property name').required(),
  location: Joi.string().label('Property location').required(),
  price: Joi.number().label('Property price').required(),
  units: Joi.number().label('Property units').required(),
  houseType: Joi.string().label('Property type').required(),
  bedrooms: Joi.number().label('Bedroom number').required(),
  toilets: Joi.number().label('Toilet number').required(),
  description: Joi.string().label('Property description').required(),
  floorPlans: Joi.boolean().label('Property floor plans').required(),
  mapLocation: Joi.string().label('Map location').required(),
  neighborhood: Joi.string().label('Map location').required(),
});

export const updatePropertySchema = Joi.object({
  id: Joi.string().label('Property id').required(),
  name: Joi.string().label('Property name').required(),
  location: Joi.string().label('Property location').required(),
  price: Joi.number().label('Property price').required(),
  units: Joi.number().label('Property units').required(),
  houseType: Joi.string().label('Property type').required(),
  bedrooms: Joi.number().label('Bedroom number').required(),
  toilets: Joi.number().label('Toilet number').required(),
  description: Joi.string().label('Property description').required(),
  floorPlans: Joi.boolean().label('Property floor plans').required(),
  mapLocation: Joi.string().label('Map location').required(),
  neighborhood: Joi.string().label('Map location').required(),
});

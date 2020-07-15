import Joi from '@hapi/joi';

const mapLocation = Joi.object().keys({
  longitude: Joi.string().label('Map location longitude').optional(),
  latitude: Joi.string().label('Map location latitude').optional(),
});

const product = {
  name: Joi.string().label('Property name').required(),
  location: Joi.string().label('Property location').required(),
  price: Joi.number().label('Property price').required(),
  units: Joi.number().label('Property units').required(),
  houseType: Joi.string().label('Property type').required(),
  bedrooms: Joi.number().label('Bedroom number').required(),
  toilets: Joi.number().label('Toilet number').required(),
  description: Joi.string().label('Property description').required(),
  floorPlans: Joi.string().label('Property floor plans').optional(),
  mapLocation,
  neighborhood: Joi.array().label('Property neighborhood').optional(),
  mainImage: Joi.string().label('Property neighborhood').optional(),
  gallery: Joi.array().label('Property neighborhood').optional(),
};

export const addPropertySchema = Joi.object({ ...product });

export const updatePropertySchema = Joi.object({
  id: Joi.string().label('Property id').required(),
  ...product,
});

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
  mainImage: Joi.string().label('Property mainImage').optional(),
  gallery: Joi.array().label('Property gallery').optional(),
};

export const addPropertySchema = Joi.object({ ...product });

export const updatePropertySchema = Joi.object({
  id: Joi.string().label('Property id').required(),
  units: Joi.number().label('Property units').optional(),
  name: Joi.string().label('Property name').optional(),
  location: Joi.string().label('Property location').optional(),
  price: Joi.number().label('Property price').optional(),
  houseType: Joi.string().label('Property type').optional(),
  bedrooms: Joi.number().label('Bedroom number').optional(),
  toilets: Joi.number().label('Toilet number').optional(),
  description: Joi.string().label('Property description').optional(),
  floorPlans: Joi.string().label('Property floor plans').optional(),
  mapLocation,
  neighborhood: Joi.array().label('Property neighborhood').optional(),
  mainImage: Joi.string().label('Property mainImage').optional(),
  gallery: Joi.array().label('Property gallery').optional(),
});

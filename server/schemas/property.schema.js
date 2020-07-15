import Joi from '@hapi/joi';

const mapLocation = Joi.object().keys({
  longitude: Joi.string().label('Map location longitude'),
  latitude: Joi.string().label('Map location latitude'),
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
  floorPlans: Joi.string().label('Property floor plans'),
  mapLocation,
  neighborhood: Joi.array().label('Property neighborhood'),
  mainImage: Joi.string().label('Property neighborhood').required(),
  gallery: Joi.array().label('Property neighborhood').required(),
};

export const addPropertySchema = Joi.object({ ...product });

export const updatePropertySchema = Joi.object({
  id: Joi.string().label('Property id').required(),
  ...product,
});

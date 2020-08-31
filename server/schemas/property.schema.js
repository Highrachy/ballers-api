import Joi from '@hapi/joi';

Joi.objectId = require('joi-objectid')(Joi);

const mapLocation = Joi.object().keys({
  longitude: Joi.string().label('Map location longitude').optional(),
  latitude: Joi.string().label('Map location latitude').optional(),
});

const addressAdd = Joi.object().keys({
  street1: Joi.string().label('Street 1').required(),
  street2: Joi.string().label('Street 2').allow(null, ''),
  city: Joi.string().label('City').required(),
  state: Joi.string().label('State').required(),
  country: Joi.string().label('Country').default('Nigeria'),
});

const addressUpdate = Joi.object().keys({
  street1: Joi.string().label('Street 1').optional(),
  street2: Joi.string().label('Street 2').optional(),
  city: Joi.string().label('City').optional(),
  state: Joi.string().label('State').optional(),
  country: Joi.string().label('Country').optional(),
});

const property = {
  name: Joi.string().label('Property name').required(),
  titleDocument: Joi.string().label('Property title document').optional(),
  address: addressAdd,
  price: Joi.number().label('Property price').required(),
  units: Joi.number().label('Property units').required(),
  houseType: Joi.string().label('Property type').required(),
  bedrooms: Joi.number().label('Bedroom number').required(),
  toilets: Joi.number().label('Toilet number').required(),
  description: Joi.string().label('Property description').required(),
  floorPlans: Joi.string().label('Property floor plans').optional(),
  mapLocation,
  neighborhood: Joi.array().label('Property neighborhood').optional(),
  mainImage: Joi.string().label('Property main image').optional(),
  gallery: Joi.array().label('Property gallery').optional(),
  paymentPlan: Joi.array().label('Payment plan').optional(),
};

export const addPropertySchema = Joi.object({ ...property });

export const updatePropertySchema = Joi.object({
  id: Joi.objectId().label('Property id').required(),
  units: Joi.number().label('Property units').optional(),
  name: Joi.string().label('Property name').optional(),
  titleDocument: Joi.string().label('Property title document').optional(),
  address: addressUpdate,
  price: Joi.number().label('Property price').optional(),
  houseType: Joi.string().label('Property type').optional(),
  bedrooms: Joi.number().label('Bedroom number').optional(),
  toilets: Joi.number().label('Toilet number').optional(),
  description: Joi.string().label('Property description').optional(),
  floorPlans: Joi.string().label('Property floor plans').optional(),
  mapLocation,
  neighborhood: Joi.array().label('Property neighborhood').optional(),
  mainImage: Joi.string().label('Property main image').optional(),
  gallery: Joi.array().label('Property gallery').optional(),
  paymentPlan: Joi.array().label('Payment plan').optional(),
});

export const searchPropertySchema = Joi.object({
  state: Joi.string().label('Property State').optional(),
  city: Joi.string().label('Property City').optional(),
  houseType: Joi.string().label('Property Type').optional(),
  minPrice: Joi.number().label('Property Minimum Price').optional(),
  maxPrice: Joi.number().label('Property Maximum Price').optional(),
});

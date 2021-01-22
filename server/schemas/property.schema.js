import Joi from '@hapi/joi';
import {
  requiredAddress,
  requiredObjectId,
  requiredString,
  requiredNumber,
  optionalArray,
  optionalString,
  optionalNumber,
  optionalAddress,
} from './helper.schema';

const mapLocation = Joi.object().keys({
  longitude: optionalString('Map location longitude'),
  latitude: optionalString('Map location latitude'),
});

const property = {
  name: requiredString('Property name'),
  titleDocument: optionalString('Property title document'),
  address: requiredAddress,
  price: requiredNumber('Property price'),
  units: requiredNumber('Property units'),
  houseType: requiredString('Property type'),
  bedrooms: requiredNumber('Bedroom number'),
  toilets: requiredNumber('Toilet number'),
  description: requiredString('Property description'),
  floorPlans: optionalString('Property floor plans'),
  mapLocation,
  neighborhood: optionalArray('Property neighborhood'),
  mainImage: optionalString('Property main image'),
  gallery: optionalArray('Property gallery'),
  paymentPlan: optionalArray('Payment plan'),
};

export const addPropertySchema = Joi.object({ ...property });

export const updatePropertySchema = Joi.object({
  id: requiredObjectId('Property id'),
  units: optionalNumber('Property units'),
  name: optionalString('Property name'),
  titleDocument: optionalString('Property title document'),
  address: optionalAddress,
  price: optionalNumber('Property price'),
  houseType: optionalString('Property type'),
  bedrooms: optionalNumber('Bedroom number'),
  toilets: optionalNumber('Toilet number'),
  description: optionalString('Property description'),
  floorPlans: optionalString('Property floor plans'),
  mapLocation,
  neighborhood: optionalArray('Property neighborhood'),
  mainImage: optionalString('Property main image'),
  gallery: optionalArray('Property gallery'),
  paymentPlan: optionalArray('Payment plan'),
});

export const searchPropertySchema = Joi.object({
  state: optionalString('Property State'),
  city: optionalString('Property City'),
  houseType: optionalString('Property Type'),
  minPrice: optionalNumber('Property Minimum Price'),
  maxPrice: optionalNumber('Property Maximum Price'),
});

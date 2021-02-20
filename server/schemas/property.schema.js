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
  nonRequiredNumber,
  nonRequiredString,
} from './helper.schema';

const mapLocation = Joi.object().keys({
  longitude: nonRequiredNumber('Map location longitude'),
  latitude: nonRequiredNumber('Map location latitude'),
});

const floorPlans = Joi.array()
  .label('Property floor plans')
  .items(
    Joi.object().keys({
      name: optionalString('Floor Plan Name'),
      plan: optionalString('Floor Plan URL'),
    }),
  );

export const addPropertySchema = Joi.object({
  name: requiredString('Property name'),
  titleDocument: nonRequiredString('Property title document'),
  address: requiredAddress,
  price: requiredNumber('Property price'),
  units: requiredNumber('Property units'),
  houseType: requiredString('Property type'),
  bedrooms: requiredNumber('Bedroom number'),
  toilets: requiredNumber('Toilet number'),
  bathrooms: requiredNumber('Bathroom number'),
  description: requiredString('Property description'),
  floorPlans,
  mapLocation,
  neighborhood: optionalArray('Property neighborhood'),
  mainImage: nonRequiredString('Property main image'),
  gallery: optionalArray('Property gallery'),
  paymentPlan: optionalArray('Payment plan'),
});

export const updatePropertySchema = Joi.object({
  id: requiredObjectId('Property id'),
  units: optionalNumber('Property units'),
  name: optionalString('Property name'),
  titleDocument: nonRequiredString('Property title document'),
  address: optionalAddress,
  price: optionalNumber('Property price'),
  houseType: optionalString('Property type'),
  bedrooms: optionalNumber('Bedroom number'),
  toilets: optionalNumber('Toilet number'),
  bathrooms: optionalNumber('Bathroom number'),
  description: optionalString('Property description'),
  floorPlans,
  mapLocation,
  neighborhood: optionalArray('Property neighborhood'),
  mainImage: nonRequiredString('Property main image'),
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

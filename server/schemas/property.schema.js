import Joi from '@hapi/joi';
import {
  requiredObjectId,
  requiredString,
  requiredNumber,
  optionalArray,
  optionalString,
  optionalNumber,
} from './helper.schema';

const mapLocation = Joi.object().keys({
  longitude: optionalString('Map location longitude'),
  latitude: optionalString('Map location latitude'),
});

const addressAdd = Joi.object().keys({
  street1: requiredString('Street 1'),
  street2: Joi.string().label('Street 2').allow(null, ''),
  city: requiredString('City'),
  state: requiredString('State'),
  country: Joi.string().label('Country').default('Nigeria'),
});

const addressUpdate = Joi.object().keys({
  street1: optionalString('Street 1'),
  street2: optionalString('Street 2'),
  city: optionalString('City'),
  state: optionalString('State'),
  country: optionalString('Country'),
});

const property = {
  name: requiredString('Property name'),
  titleDocument: optionalString('Property title document'),
  address: addressAdd,
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
  address: addressUpdate,
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

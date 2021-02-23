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
import { NEIGHBORHOOD_STEPS } from '../helpers/constants';

const mapLocation = Joi.object().keys({
  longitude: nonRequiredNumber('Map location longitude'),
  latitude: nonRequiredNumber('Map location latitude'),
});

const neighbourhoodInfoDetails = Joi.object().keys({
  timeAwayFromProperty: optionalNumber('Time Away From Property'),
  name: optionalString('Name'),
  mapLocation,
});

const neighbourhoodInfo = Joi.array().items(neighbourhoodInfoDetails);

const neighborhood = Joi.object().label('Property neighborhood').keys({
  entertainment: neighbourhoodInfo,
  hospitals: neighbourhoodInfo,
  restaurantsAndBars: neighbourhoodInfo,
  schools: neighbourhoodInfo,
  shoppingMall: neighbourhoodInfo,
  pointsOfInterest: neighbourhoodInfo,
});

const neighborhoodType = Joi.string()
  .label('Neighborhood Type')
  .valid(...NEIGHBORHOOD_STEPS)
  .required();

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
  floorPlans: nonRequiredString('Property floor plans'),
  mapLocation,
  neighborhood,
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
  floorPlans: nonRequiredString('Property floor plans'),
  mapLocation,
  neighborhood,
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

export const updateNeighborhoodSchema = Joi.object({
  propertyId: requiredObjectId('Property id'),
  type: neighborhoodType,
  typeId: requiredObjectId('Neighborhood Type id'),
  neighbourhood: neighbourhoodInfoDetails,
});

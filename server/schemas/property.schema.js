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
  optionalObjectId,
  nonRequiredNumber,
  nonRequiredString,
} from './helper.schema';
import { NEIGHBORHOOD_STEPS } from '../helpers/constants';

const mapLocation = Joi.object().keys({
  longitude: nonRequiredNumber('Map location longitude'),
  latitude: nonRequiredNumber('Map location latitude'),
});

const floorPlan = Joi.object().keys({
  name: requiredString('Floor Plan Name'),
  plan: requiredString('Floor Plan URL'),
});

const floorPlans = Joi.array().label('Property floor plans').items(floorPlan);

const image = Joi.object().keys({
  title: requiredString('Image Name'),
  url: requiredString('Image URL'),
});

const gallery = Joi.array().label('Property gallery').items(image);

const neighborhoodInfoDetails = Joi.object().keys({
  distance: optionalNumber('Distance'),
  name: optionalString('Name'),
  mapLocation,
});

const neighborhoodInfo = Joi.array().items(neighborhoodInfoDetails);

const neighborhood = Joi.object().label('Property neighborhood').keys({
  entertainments: neighborhoodInfo,
  hospitals: neighborhoodInfo,
  restaurantsAndBars: neighborhoodInfo,
  schools: neighborhoodInfo,
  shoppingMalls: neighborhoodInfo,
  pointsOfInterest: neighborhoodInfo,
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
  floorPlans,
  mapLocation,
  neighborhood,
  mainImage: nonRequiredString('Property main image'),
  features: optionalArray('Features'),
  gallery,
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
  neighborhood,
  mainImage: nonRequiredString('Property main image'),
  features: optionalArray('Features'),
  gallery,
  paymentPlan: optionalArray('Payment plan'),
});

export const addNeighborhoodSchema = Joi.object({
  type: neighborhoodType,
  neighborhood: neighborhoodInfoDetails,
});

export const updateNeighborhoodSchema = Joi.object({
  type: neighborhoodType,
  typeId: requiredObjectId('Neighborhood Type id'),
  neighborhood: neighborhoodInfoDetails,
});

export const deleteNeighborhoodSchema = Joi.object({
  type: neighborhoodType,
  typeId: requiredObjectId('Neighborhood Type id'),
});

export const addFloorplanSchema = floorPlan;

export const updateFloorplanSchema = Joi.object({
  floorPlanId: requiredObjectId('Floor Plan id'),
  name: requiredString('Floor Plan Name'),
  plan: requiredString('Floor Plan URL'),
});

export const deleteFloorplanSchema = Joi.object({
  floorPlanId: requiredObjectId('Floor Plan id'),
});

export const addImageSchema = image;

export const updateGallerySchema = Joi.object({
  imageId: requiredObjectId('Image id'),
  title: requiredString('Image Name'),
  url: requiredString('Image URL'),
});

export const deleteImageSchema = Joi.object({
  imageId: requiredObjectId('Image id'),
});

export const flagPropertySchema = Joi.object({
  propertyId: requiredObjectId('Property id'),
  reason: requiredString('Reason'),
  reportId: optionalObjectId('Report id'),
  notes: optionalString('Notes'),
});

export const unflagPropertySchema = Joi.object({
  caseId: requiredObjectId('Case id'),
  propertyId: requiredObjectId('Property id'),
  reason: requiredString('Reason'),
});

export const requestUnflagSchema = Joi.object({
  propertyId: requiredObjectId('Property id'),
  comment: requiredString('Comment'),
});

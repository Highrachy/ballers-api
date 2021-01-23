import Joi from '@hapi/joi';
import {
  requiredObjectId,
  requiredString,
  requiredNumber,
  optionalObjectId,
  optionalString,
  optionalNumber,
  nonRequiredString,
} from './helper.schema';

export const addContentPropertySchema = Joi.object({
  areaId: requiredObjectId('Area Id'),
  category: requiredString('Category'),
  houseType: requiredString('Property Type'),
  price: requiredNumber('Price'),
  website: nonRequiredString('Website'),
  link: nonRequiredString('URL'),
});

export const updateContentPropertySchema = Joi.object({
  id: requiredObjectId('Property Id'),
  areaId: optionalObjectId('Area Id'),
  category: optionalString('Category'),
  houseType: optionalString('Property Type'),
  price: optionalNumber('Price'),
  website: nonRequiredString('Website'),
  link: nonRequiredString('URL'),
});

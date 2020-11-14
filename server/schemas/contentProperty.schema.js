import Joi from '@hapi/joi';

Joi.objectId = require('joi-objectid')(Joi);

export const addContentPropertySchema = Joi.object({
  areaId: Joi.objectId().label('Area Id').required(),
  category: Joi.string().label('Category').required(),
  houseType: Joi.string().label('Property Type').required(),
  price: Joi.number().label('Price').required(),
  website: Joi.string().label('Website').optional(),
  link: Joi.string().label('URL').optional(),
});

export const updateContentPropertySchema = Joi.object({
  id: Joi.objectId().label('Property Id').required(),
  areaId: Joi.objectId().label('Area Id').optional(),
  category: Joi.string().label('Category').optional(),
  houseType: Joi.string().label('Property Type').optional(),
  price: Joi.number().label('Price').optional(),
  website: Joi.string().label('Website').optional(),
  link: Joi.string().label('URL').optional(),
});

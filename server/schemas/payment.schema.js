import Joi from '@hapi/joi';

Joi.objectId = require('joi-objectid')(Joi);

export const requiredString = (label) => Joi.string().label(label).required();

export const paymentSchema = Joi.object({
  amount: requiredString('Amount'),
  offerId: Joi.objectId().label('Offer Id').required(),
  propertyId: Joi.objectId().label('Property Id').required(),
});

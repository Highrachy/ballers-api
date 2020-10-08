import Joi from '@hapi/joi';

Joi.objectId = require('joi-objectid')(Joi);

export const addTransactionSchema = Joi.object({
  propertyId: Joi.objectId().label('Property Id').required(),
  userId: Joi.objectId().label('User Id').required(),
  offerId: Joi.objectId().label('Offer Id').required(),
  paymentSource: Joi.string().label('Transaction Payment Source').required(),
  amount: Joi.number().label('Transaction Amount').required(),
  paidOn: Joi.string().label('Payment Date').required(),
  additionalInfo: Joi.string().label('Additional Info').optional(),
});

export const updateTransactionSchema = Joi.object({
  transactionId: Joi.objectId().label('Transaction Id').required(),
  paidOn: Joi.string().label('Payment Date').required(),
});

export const getTransactionsByPropertySchema = Joi.object({
  propertyId: Joi.objectId().label('Property Id').required(),
});

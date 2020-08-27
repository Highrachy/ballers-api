import Joi from '@hapi/joi';

Joi.objectId = require('joi-objectid')(Joi);

const addTransactionSchema = Joi.object({
  propertyId: Joi.objectId().label('Property Id').required(),
  userId: Joi.objectId().label('User Id').optional(),
  paymentSource: Joi.string().label('Transaction Payment Source').required(),
  amount: Joi.number().label('Transaction Amount').required(),
});

export default addTransactionSchema;

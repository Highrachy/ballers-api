import Joi from '@hapi/joi';
import {
  requiredObjectId,
  requiredDate,
  requiredString,
  requiredNumber,
  nonRequiredString,
} from './helper.schema';

export const addTransactionSchema = Joi.object({
  offerId: requiredObjectId('Offer Id'),
  paymentSource: requiredString('Transaction Payment Source'),
  amount: requiredNumber('Transaction Amount'),
  paidOn: requiredDate('Payment Date'),
  additionalInfo: nonRequiredString('Additional Info'),
});

export const updateTransactionSchema = Joi.object({
  transactionId: requiredObjectId('Transaction Id'),
  paidOn: requiredDate('Payment Date'),
});

export const getTransactionsByPropertySchema = Joi.object({
  propertyId: requiredObjectId('Property Id'),
});

import Joi from '@hapi/joi';
import {
  requiredObjectId,
  requiredNumber,
  requiredDate,
  requiredString,
  optionalString,
} from './helper.schema';

export const addOfflinePaymentSchema = Joi.object({
  amount: requiredNumber('Amount'),
  bank: requiredString('Bank'),
  date: requiredDate('Date'),
  offerId: requiredObjectId('Offer id'),
  receipt: optionalString('Receipt'),
  type: requiredString('Payment Type'),
});

export const updateOfflinePaymentSchema = Joi.object({
  id: requiredObjectId('Offline Payment Id'),
  amount: requiredNumber('Amount'),
  bank: requiredString('Bank'),
  date: requiredDate('Date'),
  offerId: requiredObjectId('Offer Id'),
  receipt: optionalString('Receipt'),
  type: requiredString('Payment Type'),
});

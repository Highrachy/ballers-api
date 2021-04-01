import Joi from '@hapi/joi';
import {
  requiredObjectId,
  requiredNumber,
  requiredDate,
  requiredString,
  optionalString,
} from './helper.schema';

const addOfflinePaymentSchema = Joi.object({
  amount: requiredNumber('Amount'),
  bank: requiredString('Bank'),
  date: requiredDate('Date'),
  offerId: requiredObjectId('Offer id'),
  reciept: optionalString('Reciept'),
  type: requiredString('Payment Type'),
});

export default addOfflinePaymentSchema;

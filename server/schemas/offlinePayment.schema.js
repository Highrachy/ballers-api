import Joi from '@hapi/joi';
import {
  requiredObjectId,
  requiredNumber,
  requiredDate,
  requiredString,
  optionalString,
  optionalNumber,
  optionalObjectId,
} from './helper.schema';

export const addOfflinePaymentSchema = Joi.object({
  amount: requiredNumber('Amount'),
  bank: requiredString('Bank'),
  dateOfPayment: requiredDate('Payment Date'),
  offerId: requiredObjectId('Offer id'),
  receipt: optionalString('Receipt'),
  type: requiredString('Payment Type'),
});

export const updateOfflinePaymentSchema = Joi.object({
  id: requiredObjectId('Offline Payment Id'),
  amount: optionalNumber('Amount'),
  bank: optionalString('Bank'),
  dateOfPayment: optionalString('Payment Date'),
  offerId: optionalObjectId('Offer Id'),
  receipt: optionalString('Receipt'),
  type: optionalString('Payment Type'),
});

export const commentSchema = Joi.object({
  question: requiredString('Question'),
  paymentId: requiredObjectId('Payment Id'),
});

export const resolveCommentSchema = Joi.object({
  paymentId: requiredObjectId('Payment Id'),
  commentId: requiredObjectId('Comment Id'),
  response: requiredString('Response'),
});

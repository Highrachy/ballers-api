import Joi from '@hapi/joi';
import {
  requiredObjectId,
  requiredString,
  requiredNumber,
  requiredFutureDate,
  requiredPercentage,
} from './helper.schema';

export const createOfferSchema = Joi.object({
  enquiryId: requiredObjectId('Enquiry ID'),
  deliveryState: requiredString('Delivery State'),
  totalAmountPayable: requiredNumber('Total Amount Payable'),
  title: requiredString('Title'),
  initialPayment: requiredNumber('Initial Payment'),
  initialPaymentDate: requiredFutureDate('Initial Payment Date'),
  periodicPayment: requiredNumber('Periodic Payment'),
  paymentFrequency: requiredNumber('Payment Frequency'),
  allocationInPercentage: requiredPercentage('Allocation'),
  handOverDate: requiredFutureDate('Handover Date'),
  expires: requiredFutureDate('Expiry Date'),
});

export const acceptOfferSchema = Joi.object({
  offerId: requiredObjectId('Offer Id'),
  signature: requiredString('Signature'),
});

export const validateOfferIdSchema = Joi.object({
  offerId: requiredObjectId('Offer Id'),
});

export const raiseConcernSchema = Joi.object({
  offerId: requiredObjectId('Offer Id'),
  question: requiredString('Question'),
});

export const resolveConcernSchema = Joi.object({
  offerId: requiredObjectId('Offer Id'),
  concernId: requiredObjectId('Concern Id'),
  response: requiredString('Response'),
});

export const reactivateOfferSchema = Joi.object({
  offerId: requiredObjectId('Offer Id'),
  initialPaymentDate: requiredFutureDate('Initial Payment Date'),
  expires: requiredFutureDate('Expiry Date'),
});

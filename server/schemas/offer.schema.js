import Joi from '@hapi/joi';
import { TODAY_WORDS } from '../helpers/dates';

Joi.objectId = require('joi-objectid')(Joi);

export const createOfferSchema = Joi.object({
  enquiryId: Joi.objectId().label('Enquiry ID').required(),
  handOverDate: Joi.date()
    .greater(TODAY_WORDS)
    .label('Handover Date')
    .required()
    .messages({
      'date.greater': `"Handover Date" should a date later than ${TODAY_WORDS}`,
    }),
  deliveryState: Joi.string().label('Delivery State').required(),
  totalAmountPayable: Joi.number().label('Total Amount Payable').required(),
  allocationInPercentage: Joi.number().min(1).max(100).label('Allocation In Percentage').required(),
  title: Joi.string().label('Title').required(),
  expires: Joi.date()
    .greater(TODAY_WORDS)
    .label('Expiry Date')
    .required()
    .messages({
      'date.greater': `"Expiry Date" should a date later than ${TODAY_WORDS}`,
    }),
  initialPayment: Joi.number().label('Initial Payment').required(),
  monthlyPayment: Joi.number().label('Monthly Payment').required(),
  paymentFrequency: Joi.number().label('Payment Frequency').required(),
});

export const acceptOfferSchema = Joi.object({
  offerId: Joi.objectId().label('Offer Id').required(),
  signature: Joi.string().label('Signature').required(),
});

export const respondOfferSchema = Joi.object({
  offerId: Joi.objectId().label('Offer Id').required(),
});

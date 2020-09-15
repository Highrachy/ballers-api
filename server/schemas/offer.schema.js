import Joi from '@hapi/joi';

Joi.objectId = require('joi-objectid')(Joi);

const today = new Date().toISOString().slice(0, 10);

export const createOfferSchema = Joi.object({
  enquiryId: Joi.objectId().label('Enquiry ID').required(),
  handOverDate: Joi.date()
    .greater(today)
    .label('Handover Date')
    .required()
    .messages({
      'date.greater': `"Handover Date" should a date later than ${new Date(
        Date.parse(today),
      ).toUTCString()}`,
    }),
  deliveryState: Joi.string().label('Delivery State').required(),
  totalAmountPayable: Joi.number().label('Total Amount Payable').required(),
  allocationInPercentage: Joi.number().min(1).max(100).label('Allocation In Percentage').required(),
  title: Joi.string().label('Title').required(),
  expires: Joi.date()
    .greater(today)
    .label('Expiry Date')
    .required()
    .messages({
      'date.greater': `"Expiry Date" should a date later than ${new Date(
        Date.parse(today),
      ).toUTCString()}`,
    }),
  initialPayment: Joi.number().label('Initial Payment').required(),
  monthlyPayment: Joi.number().label('Monthly Payment').required(),
  paymentFrequency: Joi.number().label('Payment Frequency').required(),
});

export const acceptOfferSchema = Joi.object({
  offerId: Joi.objectId().label('Offer Id').required(),
  signature: Joi.string().label('Signature').required(),
});

export const assignOfferSchema = Joi.object({
  offerId: Joi.objectId().label('Offer Id').required(),
});

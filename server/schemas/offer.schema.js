import Joi from '@hapi/joi';
import {
  requiredObjectId,
  requiredString,
  requiredNumber,
  requiredFutureDate,
  requiredPercentage,
  optionalString,
  optionalNumber,
  optionalObjectId,
} from './helper.schema';

const additionalClause = Joi.array()
  .label('Additional Clause')
  .items(optionalString('Additional Clause'));

const bankAccounts = Joi.array().label('Bank Accounts').items(optionalObjectId('Bank Account Id'));

const otherPayments = Joi.object().keys({
  agencyFee: optionalNumber('Agency Fee'),
  deedOfAssignmentExecution: optionalNumber('Deed Of Assignment Execution'),
  infrastructureDevelopment: optionalNumber('Infrastructure Development'),
  legalFee: optionalNumber('Legal Fee'),
  powerConnectionFee: optionalNumber('Power Connection Fee'),
  surveyPlan: optionalNumber('Survey Plan'),
});

const otherTerms = Joi.object().keys({
  administrativeCharge: optionalNumber('Administrative Charge'),
  bankDraftDue: optionalNumber('Bank Draft Due'),
  dateDue: optionalNumber('Date Due'),
  deductibleRefundPercentage: optionalNumber('Deductible Refund Percentage'),
  gracePeriod: optionalNumber('Grace Period'),
  terminationInterest: optionalNumber('Termination Interest'),
  terminationPeriod: optionalNumber('Termination Period'),
});

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
  additionalClause,
  bankAccounts,
  otherPayments,
  otherTerms,
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

import Joi from '@hapi/joi';
import {
  requiredEmail,
  requiredObjectId,
  optionalString,
  requiredPercentage,
} from './helper.schema';

export const updateReferralSchema = Joi.object({
  referralId: requiredObjectId('Referral Id'),
});

export const sendReferralSchema = Joi.object({
  email: requiredEmail('Email Address'),
  firstName: optionalString('First Name'),
});

export const updateReferralPercentageSchema = Joi.object({
  referralId: requiredObjectId('Referral Id'),
  percentage: requiredPercentage('Percentage'),
});

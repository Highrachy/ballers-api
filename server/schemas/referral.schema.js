import Joi from '@hapi/joi';

Joi.objectId = require('joi-objectid')(Joi);

export const updateReferralSchema = Joi.object({
  referralId: Joi.objectId().label('Referral Id').required(),
});

export const sendReferralSchema = Joi.object({
  email: Joi.string().label('Email Address').email().required(),
  firstName: Joi.string().label('First Name').optional(),
});

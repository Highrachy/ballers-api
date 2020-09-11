import Joi from '@hapi/joi';

Joi.objectId = require('joi-objectid')(Joi);

const updateReferralSchema = Joi.object({
  referralId: Joi.objectId().label('Referral Id').required(),
});

export default updateReferralSchema;

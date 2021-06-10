import Joi from '@hapi/joi';
import { requiredObjectId, requiredString, optionalString } from './helper.schema';
import { BADGE_ACCESS_LEVEL } from '../helpers/constants';

const userLevel = Joi.number()
  .label('Step')
  .valid(...Object.values(BADGE_ACCESS_LEVEL))
  .optional();

export const addBadgeSchema = Joi.object({
  name: requiredString('Name'),
  userLevel,
});

export const updateBadgeSchema = Joi.object({
  id: requiredObjectId('Badge Id'),
  name: optionalString('Name'),
  userLevel,
});

import Joi from '@hapi/joi';
import { requiredObjectId, requiredString, optionalString } from './helper.schema';
import { BADGE_ACCESS_LEVEL } from '../helpers/constants';

const assignedRole = Joi.number()
  .label('Role')
  .valid(...Object.values(BADGE_ACCESS_LEVEL))
  .optional();

const icon = Joi.object().keys({
  name: optionalString('Icon name'),
  color: optionalString('Icon color'),
});

export const addBadgeSchema = Joi.object({
  name: requiredString('Name'),
  image: optionalString('Image'),
  assignedRole,
  icon,
});

export const updateBadgeSchema = Joi.object({
  id: requiredObjectId('Badge Id'),
  name: optionalString('Name'),
  image: optionalString('Image'),
  assignedRole,
  icon,
});

export const assignedRoleBadgeSchema = Joi.object({
  assignedRole,
});

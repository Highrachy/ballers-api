import Joi from '@hapi/joi';
import { requiredObjectId } from './helper.schema';

const assignBadgeSchema = Joi.object({
  badgeId: requiredObjectId('Badge id'),
  userId: requiredObjectId('User id'),
});

export default assignBadgeSchema;

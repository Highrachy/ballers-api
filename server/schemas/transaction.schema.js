import Joi from '@hapi/joi';
import { requiredObjectId, requiredDate, optionalPercentage } from './helper.schema';

const addRemittanceSchema = Joi.object({
  transactionId: requiredObjectId('Transaction Id'),
  date: requiredDate('Date'),
  percentage: optionalPercentage('Remittance'),
});

export default addRemittanceSchema;

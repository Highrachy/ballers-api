import Joi from '@hapi/joi';
import { requiredObjectId, requiredString, optionalString } from './helper.schema';

export const addAccountSchema = Joi.object({
  accountName: requiredString('Account Name'),
  accountNumber: requiredString('Account Number'),
  bank: requiredString('Bank'),
});

export const updateAccountSchema = Joi.object({
  id: requiredObjectId('Account Id'),
  accountName: optionalString('Account Name'),
  accountNumber: optionalString('Account Number'),
  bank: optionalString('Bank'),
});

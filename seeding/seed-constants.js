import { USER_ROLE } from '../server/helpers/constants';

export const MODEL = {
  USER: 'USER',
  RESET: 'RESET',
};

export const ROLE = {
  [USER_ROLE.ADMIN]: 'admin',
  [USER_ROLE.USER]: 'user',
  [USER_ROLE.VENDOR]: 'vendor',
  [USER_ROLE.EDITOR]: 'editor',
};

export const DEFAULT_PASSWORD = 'passworded';

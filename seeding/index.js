import chalk from 'chalk';
import { startDBConnection } from '../server/config';
import logger from '../server/config/winston';
// eslint-disable-next-line import/no-cycle
import seedUsers from './user.seeding';
// eslint-disable-next-line import/no-cycle
import resetDB from './reset.seeding';

export const logSuccess = (data) => {
  logger.info(chalk.greenBright(data));
};

export const logLoading = (data) => {
  logger.info(chalk.yellowBright(data));
};

export const logInfo = (data) => {
  logger.info(chalk.blueBright(data));
};

export const logError = (data) => {
  logger.error(chalk.redBright(data));
};

const MODEL = {
  USER: 'user',
  RESET: 'reset',
};

const ROLE = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  USER: 'user',
  VENDOR: 'vendor',
};

const seedDB = async () => {
  const model = process.env.MODEL;
  const limit = process.env.LIMIT || 1;
  const role = process.env.ROLE || ROLE.USER;

  try {
    startDBConnection();

    switch (model) {
      case MODEL.USER:
        await seedUsers(limit, role);
        break;
      case MODEL.RESET:
        resetDB();
        break;

      default:
        logInfo(`Invalid model input. Available models are: ${Object.values(MODEL)}`);
        break;
    }

    logSuccess('Done!');
  } catch (error) {
    logError(error);
  }
};

seedDB();

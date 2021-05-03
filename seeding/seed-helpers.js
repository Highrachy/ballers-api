// eslint-disable-next-line import/no-extraneous-dependencies
import chalk from 'chalk';
import logger from '../server/config/winston';

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

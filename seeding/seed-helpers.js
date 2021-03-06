/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
import chalk from 'chalk';
// eslint-disable-next-line no-unused-vars
import cTable from 'console.table';

export const logSuccess = (data) => {
  console.log(chalk.greenBright(data));
};

export const logLoading = (data) => {
  console.log(chalk.yellowBright(data));
};

export const logInfo = (data) => {
  console.log(chalk.blueBright(data));
};

export const logError = (data) => {
  console.log(chalk.redBright(data));
};

export const logTable = (table) => {
  console.table(table);
};

export const getOneRandomItem = (item) => item[Math.floor(Math.random() * item.length)];

export const getMultipleRandomItems = (items, noOfItems) =>
  items.sort(() => Math.random() - Math.random()).slice(0, noOfItems);

export const getNumberWithinRange = (min, max, unit = 1) =>
  Math.round((Math.floor(Math.random() * (max - min + 1)) + min) / unit) * unit;

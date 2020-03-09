import appRoot from 'app-root-path';
import winston from 'winston';

const errorLog = `${appRoot}/logs/error.log`;
const combinedLog = `${appRoot}/logs/combined.log`;
const optionsFiles = [
  {
    level: 'error',
    filename: errorLog,
    handleExceptions: true,
    json: true,
    maxsize: 5242880,
    maxFiles: 5,
    colorize: false,
  }, {
    level: 'warn',
    filename: combinedLog,
    handleExceptions: true,
    json: true,
    maxsize: 5242880,
    maxFiles: 5,
    colorize: false,
  },
];
const optionsConsole = {
  level: 'debug',
  handleExceptions: true,
  json: false,
  colorize: true,
  format: winston.format.simple(),
};

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  exitOnError: false,
  transports: [
    new winston.transports.File(optionsFiles[0]),
    new winston.transports.File(optionsFiles[1]),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console(optionsConsole));
}

module.exports = logger;

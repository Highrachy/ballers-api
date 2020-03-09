import appRoot from 'app-root-path';
import winston, { format } from 'winston';

const formatParams = (info) => {
  const {
    timestamp, level, message, ...args
  } = info;
  const currentTime = timestamp.slice(0, 19).replace('T', ' ');
  return `${currentTime} ${level}: ${message} ${
    Object.keys(args).length ? JSON.stringify(args, '', '') : ''
  }`;
};
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
  format: format.combine(
    format.timestamp(),
    format.align(),
    format.printf(formatParams),
  ),
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

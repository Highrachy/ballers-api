import dotenv from 'dotenv';
import mongoose from 'mongoose';
import logger from './winston';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const DB_URL = process.env.DB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/ballers';
const PORT = process.env.PORT || 3000;
const USER_SECRET = process.env.USER_SECRET || 'local_secret';

const ENVIRONMENTS = {
  development: `http://localhost:${PORT}`,
  test: `http://ballers.ng`,
  production: `http://appstaging.ballers.ng`,
};
const HOST = process.env.HOST || ENVIRONMENTS[NODE_ENV] || 'http://appstaging.ballers.ng';

const startDBConnection = () => {
  if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(DB_URL, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
      useUnifiedTopology: true,
    });

    const db = mongoose.connection;

    db.on('error', () => {
      logger.error('Error connecting to db');
    });
    db.once('open', () => {
      logger.info(`Connected to db ${DB_URL}`);
    });
  }
};

export { startDBConnection, PORT, USER_SECRET, HOST };

import mongoose from 'mongoose';
import { DB_URL } from './config';
import logger from './winston';

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

export default startDBConnection;

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import winston from 'winston';
import mongoose from 'mongoose';
import logger from './config/winston';
import { DB_URL, PORT } from './config/config';
import welcome from './routes/welcome';

mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
const app = express();

db.on('error', () => {
  logger.error('Error connecting to db');
});
db.once('open', () => {
  logger.info(`Connected to db ${DB_URL}`);
});

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('combined', { stream: winston.stream.write }));

app.use('/api/v1/welcome', welcome);

app.listen(PORT, (err) => {
  if (err) {
    logger.error(err);
  } else {
    logger.info(`Server running on port ${PORT}`);
  }
});

export default app;

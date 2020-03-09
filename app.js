import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import winston from 'winston';
import logger from './config/winston';

const app = express();
const port = 3000;
const welcome = require('./routes/welcome');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('combined', { stream: winston.stream.write }));

app.use('/api/v1/welcome', welcome);

app.listen(process.env.PORT || port, (err) => {
  if (err) {
    logger.error(err);
  } else {
    logger.info(`Server running on port ${port}`);
  }
});

module.exports = app;

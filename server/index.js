import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import winston from 'winston';
import logger from './config/winston';
import { PORT } from './config/config';
import welcome from './routes/welcome';
import user from './routes/user';
import startDBConnection from './config/db';

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('combined', { stream: winston.stream.write }));

app.use('/api/v1/welcome', welcome);
app.use('/api/v1/user', user);

startDBConnection();

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import winston from 'winston';
import { PORT, startDBConnection } from './config';
import logger from './config/winston';
import routes from './routes';
import { errorMiddleware } from './helpers/errorHandler';
import rateLimiter from './config/rateLimit';

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('combined', { stream: winston.stream.write }));

if (process.env.NODE_ENV !== 'test') {
  app.use('/api/', rateLimiter);
}

app.set('view engine', 'ejs');

routes(app);
app.use(errorMiddleware);

startDBConnection();

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;

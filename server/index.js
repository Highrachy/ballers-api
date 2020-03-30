import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import winston from 'winston';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import logger from './config/winston';
import { PORT } from './config/config';
import startDBConnection from './config/db';
import welcome from './routes/welcome.routes';
import user from './routes/user.routes';
import { errorMiddleware } from './helpers/errorHandler';

const routesPath = path.join(__dirname, './**/*.js');
const app = express();

const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Ballers API',
      version: '1.0.0',
      description: 'API documentation for Ballers from Highrachy',
      license: {
        name: 'MIT',
        url: 'https://choosealicense.com/licenses/mit/',
      },
      contact: {
        name: 'Ballers',
        url: 'https://ballers.ng',
        email: 'info@ballers.ng',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
      },
    ],
  },
  apis: [routesPath],
};
const specs = swaggerJsdoc(options);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('combined', { stream: winston.stream.write }));

app.use('/api/v1/welcome', welcome);
app.use('/api/v1/user', user);
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));
app.use(errorMiddleware);

startDBConnection();

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;

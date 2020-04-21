import swaggerUi from 'swagger-ui-express';
import welcome from './welcome.routes';
import user from './user.routes';
import mailer from './mailer.routes';
import swaggerSpecs from '../config/swagger';

export default (app) => {
  app.use('/api/v1/', welcome);
  app.use('/api/v1/user', user);
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, { explorer: true }));
  app.use('/mailer', mailer);
};

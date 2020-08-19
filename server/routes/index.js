import swaggerUi from 'swagger-ui-express';
import welcome from './welcome.routes';
import user from './user.routes';
import property from './property.routes';
import enquiry from './enquiry.routes';
import mailer from './mailer.routes';
import visitation from './visitation.routes';
import payment from './paymentPlan.routes';
import swaggerSpecs from '../config/swagger';

export default (app) => {
  app.use('/api/v1/', welcome);
  app.use('/api/v1/user', user);
  app.use('/api/v1/property', property);
  app.use('/api/v1/enquiry', enquiry);
  app.use('/api/v1/visitation', visitation);
  app.use('/api/v1/payment', payment);
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, { explorer: true }));
  app.use('/mailer', mailer);
};

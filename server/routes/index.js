import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from '../config/swagger';
import welcome from './welcome.routes';
import user from './user.routes';
import property from './property.routes';
import enquiry from './enquiry.routes';
import mailer from './mailer.routes';
import visitation from './visitation.routes';
import knowledgeBase from './knowledgeBase.routes';
import paymentPlan from './paymentPlan.routes';

export default (app) => {
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, { explorer: true }));
  app.use('/mailer', mailer);
  app.use('/api/v1/', welcome);
  app.use('/api/v1/user', user);
  app.use('/api/v1/property', property);
  app.use('/api/v1/enquiry', enquiry);
  app.use('/api/v1/visitation', visitation);
  app.use('/api/v1/knowledge-base', knowledgeBase);
  app.use('/api/v1/payment-plan', paymentPlan);
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, { explorer: true }));
  app.use('/mailer', mailer);
};

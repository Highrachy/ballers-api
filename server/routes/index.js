import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from '../config/swagger';
import enquiry from './enquiry.routes';
import mailer from './mailer.routes';
import offer from './offer.routes';
import payment from './payment.routes';
import paymentPlan from './paymentPlan.routes';
import property from './property.routes';
import transaction from './transaction.routes';
import referral from './referral.routes';
import user from './user.routes';
import visitation from './visitation.routes';
import welcome from './welcome.routes';

export default (app) => {
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, { explorer: true }));
  app.use('/api/v1/enquiry', enquiry);
  app.use('/mailer', mailer);
  app.use('/api/v1/offer', offer);
  app.use('/api/v1/payment', payment);
  app.use('/api/v1/payment-plan', paymentPlan);
  app.use('/api/v1/property', property);
  app.use('/api/v1/transaction', transaction);
  app.use('/api/v1/referral', referral);
  app.use('/api/v1/user', user);
  app.use('/api/v1/visitation', visitation);
  app.use('/api/v1/', welcome);
};

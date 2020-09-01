import { Factory } from 'rosie';

export default new Factory()
  .sequence('propertyId', (i) => `5f22f8aec790039da124238${i}`)
  .sequence('userId', (i) => `5f22f8aec790039da124238${i}`)
  .attr('paymentSource', 'bank transfer')
  .attr('amount', 14000000);

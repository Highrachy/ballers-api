import { Factory } from 'rosie';

export default new Factory()
  .sequence('propertyId', (i) => `5f46b5fe81d9972b6e82f25${i}`)
  .sequence('userId', (i) => `5f46b5fe81d9972b6e82f25${i}`)
  .attr('paymentSource', 'bank transfer')
  .attr('amount', 14000000);

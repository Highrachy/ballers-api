import { Factory } from 'rosie';

export default new Factory()
  .sequence('name', (i) => `weekly plan-${i}`)
  .attr('description', 'weekly payment')
  .attr('paymentFrequency', 4);

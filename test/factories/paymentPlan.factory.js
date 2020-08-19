import { Factory } from 'rosie';

export default new Factory()
  .sequence('planName', (i) => `weekly plan-${i}`)
  .attr('planDescription', 'weekly payment')
  .attr('paymentFrequency', 'once a week');

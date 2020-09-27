import { Factory } from 'rosie';

export default new Factory()
  .sequence('email', (i) => `email-${i}@mail.com`)
  .attr('firstName', 'John');

import { Factory } from 'rosie';

export default new Factory()
  .sequence('firstName', (i) => `firstName-${i}`)
  .sequence('lastName', (i) => `lastName-${i}`)
  .sequence('email', (i) => `email-${i}@mail.com`)
  .attr('password', '123456')
  .attr('confirmPassword', '123456')
  .attr('phone', '08012345678');

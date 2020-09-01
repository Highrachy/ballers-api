import { Factory } from 'rosie';

export default new Factory()
  .sequence('propertyId', (i) => `5f22f8aec790039da124238${i}`)
  .attr('visitorName', 'John Doe')
  .attr('visitorEmail', 'johndoe@mail.com')
  .attr('visitorPhone', '08012345678')
  .attr('visitDate', '2020-09-12');

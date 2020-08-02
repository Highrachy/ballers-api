import { Factory } from 'rosie';

export default new Factory()
  .sequence('propertyId', (i) => `5f22f8aec790039da124238${i}`)
  .attr('visitorPhone', '08012345678')
  .attr('visitorName', 'John Doe');

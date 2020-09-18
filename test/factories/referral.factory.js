import { Factory } from 'rosie';

export default new Factory()
  .sequence('userId', (i) => `5f5be105512bf6222f0c489${i}`)
  .sequence('referrerId', (i) => `5f22f7f8c790039da124238${i}`);

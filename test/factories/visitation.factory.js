import { Factory } from 'rosie';
import mongoose from 'mongoose';

export default new Factory()
  .option('generateId', false)
  .after((visitation, options) =>
    options.generateId ? { _id: mongoose.Types.ObjectId(), ...visitation } : visitation,
  )
  .sequence('propertyId', (i) => `5f22f8aec790039da124238${i}`)
  .attr('visitorName', 'John Doe')
  .attr('visitorEmail', 'johndoe@mail.com')
  .attr('visitorPhone', '08012345678')
  .attr('visitDate', '2090-09-12');

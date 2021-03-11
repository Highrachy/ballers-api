import { Factory } from 'rosie';
import mongoose from 'mongoose';

export default new Factory()
  .option('generateId', false)
  .after((reportedProperty, options) =>
    options.generateId ? { _id: mongoose.Types.ObjectId(), ...reportedProperty } : reportedProperty,
  )
  .attr('propertyId', '5f2b39035a086cfc4b7fa7f6')
  .sequence('reason', (i) => `reason-${i}`);

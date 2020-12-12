import { Factory } from 'rosie';
import mongoose from 'mongoose';

export default new Factory()
  .option('generateId', false)
  .after((plan, options) =>
    options.generateId ? { _id: mongoose.Types.ObjectId(), ...plan } : plan,
  )
  .sequence('name', (i) => `weekly plan-${i}`)
  .attr('description', 'weekly payment')
  .attr('paymentFrequency', 4);

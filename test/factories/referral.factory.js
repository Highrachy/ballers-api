import { Factory } from 'rosie';
import mongoose from 'mongoose';

export default new Factory()
  .option('generateId', false)
  .after((referral, options) =>
    options.generateId ? { _id: mongoose.Types.ObjectId(), ...referral } : referral,
  )
  .sequence('email', (i) => `email-${i}@mail.com`)
  .attr('firstName', 'John');

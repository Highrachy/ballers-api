import { Factory } from 'rosie';
import mongoose from 'mongoose';

export default new Factory()
  .option('generateId', false)
  .after((user, options) =>
    options.generateId ? { _id: mongoose.Types.ObjectId(), ...user } : user,
  )
  .sequence('firstName', (i) => `firstName-${i}`)
  .sequence('lastName', (i) => `lastName-${i}`)
  .sequence('email', (i) => `email-${i}@mail.com`)
  .attr('password', '123456')
  .attr('confirmPassword', '123456')
  .attr('phone', '08012345678');

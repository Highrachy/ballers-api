import { Factory } from 'rosie';
import mongoose from 'mongoose';

export default new Factory()
  .option('generateId', false)
  .after((notification, options) =>
    options.generateId ? { _id: mongoose.Types.ObjectId(), ...notification } : notification,
  )
  .attr('userId', '6082179739399fdf75887efb')
  .sequence('description', (i) => `Notification success ${i}`)
  .attr('type', 0)
  .attr('action', 'USER')
  .attr('read', false);

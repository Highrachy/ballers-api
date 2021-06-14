import { Factory } from 'rosie';
import mongoose from 'mongoose';

export default new Factory()
  .option('generateId', false)
  .after((assignedBadge, options) =>
    options.generateId ? { _id: mongoose.Types.ObjectId(), ...assignedBadge } : assignedBadge,
  )
  .attr('badgeId', '5f2b39035a086cfc4b7fa7f6')
  .attr('userId', '5fd3794445973e647c624d49');

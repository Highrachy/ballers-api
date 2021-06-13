import { Factory } from 'rosie';
import mongoose from 'mongoose';

export default new Factory()
  .option('generateId', false)
  .after((badge, options) =>
    options.generateId ? { _id: mongoose.Types.ObjectId(), ...badge } : badge,
  )
  .sequence('name', (i) => `User Badge ${i}`)
  .attr('image', 'https://ballers.ng/images/badge.png')
  .attr('assignedRole', -1);

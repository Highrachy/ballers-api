import { Factory } from 'rosie';
import mongoose from 'mongoose';

export default new Factory()
  .option('generateId', false)
  .after((badge, options) =>
    options.generateId ? { _id: mongoose.Types.ObjectId(), ...badge } : badge,
  )
  .sequence('name', (i) => `User Badge ${i}`)
  .attr('image', 'https://ballers.ng/images/badge.png')
  .attr('icon', {
    name: 'demo_icon',
    color: '#000000',
  })
  .attr('assignedRole', -1);

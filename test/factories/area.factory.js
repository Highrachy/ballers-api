import { Factory } from 'rosie';
import mongoose from 'mongoose';

export default new Factory()
  .option('generateId', false)
  .after((area, options) =>
    options.generateId ? { _id: mongoose.Types.ObjectId(), ...area } : area,
  )
  .sequence('area', (i) => `lekki phase ${i}`)
  .sequence('state', (i) => `lagos ${i}`)
  .attr('longitude', 6.7783)
  .attr('latitude', 119.4179);

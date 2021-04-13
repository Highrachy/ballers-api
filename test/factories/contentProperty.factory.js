import { Factory } from 'rosie';
import mongoose from 'mongoose';

export default new Factory()
  .option('generateId', false)
  .after((contentProperty, options) =>
    options.generateId ? { _id: mongoose.Types.ObjectId(), ...contentProperty } : contentProperty,
  )
  .attr('areaId', '5fac8968cdf448110bc184a2')
  .attr('category', 'For Sale')
  .sequence('houseType', (i) => `${i} bedroom apartment`)
  .sequence('price', (i) => i + 4000000)
  .attr('website', 'propery.com')
  .attr('link', 'http://property.com/apartment');

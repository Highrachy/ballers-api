import { Factory } from 'rosie';

export default new Factory()
  .sequence('area', (i) => `Lekki Phase ${i}`)
  .attr('state', 'lagos')
  .attr('longitude', 6.7783)
  .attr('latitude', 119.4179);

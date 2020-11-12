import { Factory } from 'rosie';

export default new Factory()
  .attr('area', 'Lekki Phase 1')
  .attr('state', 'Lagos')
  .sequence('longitude', (i) => i + 6.7783)
  .sequence('latitude', (i) => i + 119.4179);

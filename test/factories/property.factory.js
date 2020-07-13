import { Factory } from 'rosie';

export default new Factory()
  .sequence('name', (i) => `${i} bedroom apartment`)
  .attr('location', 'lagos')
  .sequence('price', (i) => `${i}5000000`)
  .attr('units', '5')
  .sequence('houseType', (i) => `${i} bedroom apartment`)
  .sequence('bedrooms', (i) => `${i}`)
  .sequence('toilets', (i) => `${i + 1}`)
  .sequence('description', (i) => `Newly built ${i} bedroom apartment`)
  .attr('floorPlans', 'http://linktoplan.ng')
  .attr('mapLocation', {
    longitude: '1.23456',
    latitude: '2.34567',
  })
  .attr('neighborhood', '[`Lekki Phase 1`]')
  .attr('addedBy', '5f05af5e8b468f0a68eaa05c')
  .attr('updatedBy', '5f05af5e8b468f0a68eaa05c');

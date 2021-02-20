import { Factory } from 'rosie';
import mongoose from 'mongoose';

export default new Factory()
  .option('generateId', false)
  .after((property, options) =>
    options.generateId ? { _id: mongoose.Types.ObjectId(), ...property } : property,
  )
  .sequence('name', (i) => `${i} bedroom apartment`)
  .attr('titleDocument', 'https://ballers.ng/sampletitledocument.pdf')
  .attr('price', 55000000)
  .attr('units', 5)
  .attr('address', {
    street1: 'sesame street',
    street2: 'oxford street',
    city: 'ikeja',
    state: 'oyo',
    country: 'nigeria',
  })
  .sequence('houseType', (i) => `${i} bedroom apartment`)
  .sequence('bedrooms', (i) => i)
  .sequence('bathrooms', (i) => i)
  .sequence('toilets', (i) => i + 1)
  .sequence('description', (i) => `Newly built ${i} bedroom apartment`)
  .attr('floorPlans', 'http://linktoplan.ng')
  .attr('mapLocation', {
    longitude: '1.23456',
    latitude: '2.34567',
  })
  .attr('neighborhood', {
    gyms: [
      {
        name: 'iFitness',
        distance: 1000,
        mapLocation: {
          longitude: 1.234555,
          latitude: 1.234555,
        },
      },
    ],
    hospitals: [
      {
        name: 'Reddington Hospital',
        distance: 1000,
        mapLocation: {
          longitude: 1.234555,
          latitude: 1.234555,
        },
      },
    ],
    restaurants: [
      {
        name: 'Cut steak house',
        distance: 1000,
        mapLocation: {
          longitude: 1.234555,
          latitude: 1.234555,
        },
      },
    ],
    schools: [
      {
        name: 'British International School',
        distance: 1000,
        mapLocation: {
          longitude: 1.234555,
          latitude: 1.234555,
        },
      },
    ],
    shopping: [
      {
        name: 'Shoprite',
        distance: 1000,
        mapLocation: {
          longitude: 1.234555,
          latitude: 1.234555,
        },
      },
    ],
  })
  .attr('mainImage', 'https://picsum.photos/200')
  .attr('gallery', [
    'https://picsum.photos/200',
    'https://picsum.photos/200',
    'https://picsum.photos/200',
  ]);

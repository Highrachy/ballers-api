import { Factory } from 'rosie';
import mongoose from 'mongoose';

export default new Factory()
  .option('generateId', false)
  .after((enquiry, options) =>
    options.generateId ? { _id: mongoose.Types.ObjectId(), ...enquiry } : enquiry,
  )
  .sequence('title', (i) => `title-${i}`)
  .attr('propertyId', '5f2b39035a086cfc4b7fa7f6')
  .sequence('firstName', (i) => `firstName-${i}`)
  .sequence('otherName', (i) => `otherName-${i}`)
  .sequence('lastName', (i) => `lastName-${i}`)
  .attr('address', '1, sesame street, ajah')
  .attr('occupation', 'developer')
  .attr('phone', '08012345678')
  .attr('address', {
    street1: 'opebi street',
    street2: 'sesame street',
    city: 'Ikeja',
    state: 'Lagos',
    country: 'Nigeria',
  })
  .sequence('email', (i) => `email-${i}@mail.com`)
  .attr('nameOnTitleDocument', 'John F. Doe')
  .attr('investmentFrequency', 'weekly')
  .attr('initialInvestmentAmount', 20000000)
  .attr('periodicInvestmentAmount', 500000)
  .attr('investmentStartDate', '2090-09-08');

import { Factory } from 'rosie';

export default new Factory()
  .sequence('title', (i) => `title-${i}`)
  .attr('propertyId', '5f2b39035a086cfc4b7fa7f6')
  .sequence('firstName', (i) => `firstName-${i}`)
  .sequence('otherName', (i) => `otherName-${i}`)
  .sequence('lastName', (i) => `lastName-${i}`)
  .attr('address', '1, sesame street, ajah')
  .attr('occupation', 'developer')
  .attr('phone', '08012345678')
  .sequence('email', (i) => `email-${i}@mail.com`)
  .attr('preferredPropertyLocation', 'ajah')
  .attr('propertyType', '3 bedroom')
  .attr('nameOnTitleDocument', 'John F. Doe')
  .attr('investmentFrequency', 'weekly')
  .attr('initialInvestmentAmount', 20000000)
  .attr('periodicInvestmentAmount', 500000)
  .attr('investmentStartDate', Date.now());

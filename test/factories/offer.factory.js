import { Factory } from 'rosie';

export default new Factory()
  .attr('userId', '5f22f7f8c790039da1242381')
  .attr('enquiryId', '5f31e1a5580ea36150920130')
  .attr('propertyId', '5f31e156580ea3615092012f')
  .attr('handOverDate', '2020-11-12')
  .attr('deliveryState', 'new')
  .attr('totalAmountPayable', 50000000)
  .sequence('allocationInPercentage', (i) => i)
  .attr('title', 'Test offer')
  .attr('expires', '2020-09-08')
  .attr('initialPayment', 20000000)
  .attr('monthlyPayment', 1000000)
  .attr('paymentFrequency', 1);

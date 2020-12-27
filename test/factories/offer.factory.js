import { Factory } from 'rosie';
import mongoose from 'mongoose';

export default new Factory()
  .option('generateId', false)
  .after((offer, options) =>
    options.generateId ? { _id: mongoose.Types.ObjectId(), ...offer } : offer,
  )
  .attr('enquiryId', '5f31e1a5580ea36150920130')
  .attr('handOverDate', '2090-09-08')
  .attr('deliveryState', 'new')
  .attr('totalAmountPayable', 50000000)
  .sequence('allocationInPercentage', (i) => (i <= 100 ? i : 99))
  .attr('title', 'Test offer')
  .attr('expires', '2090-09-08')
  .attr('initialPayment', 20000000)
  .attr('monthlyPayment', 1000000)
  .attr('paymentFrequency', 1);

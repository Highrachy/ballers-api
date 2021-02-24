import { Factory } from 'rosie';
import mongoose from 'mongoose';
import { parseISO } from 'date-fns';

export default new Factory()
  .option('generateId', false)
  .after((offer, options) =>
    options.generateId ? { _id: mongoose.Types.ObjectId(), ...offer } : offer,
  )
  .attr('enquiryId', '5f31e1a5580ea36150920130')
  .attr('handOverDate', parseISO('2090-09-08'))
  .attr('deliveryState', 'new')
  .attr('totalAmountPayable', 100000)
  .sequence('allocationInPercentage', (i) => (i <= 100 ? i : 99))
  .attr('title', 'Test offer')
  .attr('expires', parseISO('2090-09-08'))
  .attr('initialPayment', 50000)
  .attr('initialPaymentDate', parseISO('2090-09-08'))
  .attr('periodicPayment', 10000)
  .attr('paymentFrequency', 30);

import { Factory } from 'rosie';
import mongoose from 'mongoose';

export default new Factory()
  .option('generateId', false)
  .after((nextPayment, options) =>
    options.generateId ? { _id: mongoose.Types.ObjectId(), ...nextPayment } : nextPayment,
  )
  .attr('expectedAmount', 50000)
  .attr('expiresOn', '2090-09-08')
  .attr('offerId', '5f2b39035a086cfc4b7fa7f6')
  .attr('propertyId', '603ed08d7e0fb12832e65e50')
  .attr('userId', '603c0300f8477208ed73b976')
  .attr('vendorId', '5fd3794445973e647c624d49');

import { Factory } from 'rosie';
import mongoose from 'mongoose';

export default new Factory()
  .option('generateId', false)
  .after((offlinePayment, options) =>
    options.generateId ? { _id: mongoose.Types.ObjectId(), ...offlinePayment } : offlinePayment,
  )
  .attr('amount', 100000)
  .sequence('bank', (i) => `GTbank-${i}`)
  .attr('dateOfPayment', '2020-11-12')
  .attr('offerId', '606a5830a00211e7bd8f9dee')
  .attr('receipt', 'receipt.jpg')
  .attr('type', 'cash deposit');

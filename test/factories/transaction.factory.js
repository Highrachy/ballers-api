import { Factory } from 'rosie';
import mongoose from 'mongoose';

export default new Factory()
  .option('generateId', false)
  .after((transaction, options) =>
    options.generateId ? { _id: mongoose.Types.ObjectId(), ...transaction } : transaction,
  )
  .sequence('propertyId', (i) => `5f22f8aec790039da124238${i}`)
  .sequence('userId', (i) => `5f22f8aec790039da124238${i}`)
  .attr('offerId', '5f7a453a605ddb721fc26946')
  .attr('paymentSource', 'bank transfer')
  .attr('paidOn', '2020-08-12')
  .attr('amount', 14000000);

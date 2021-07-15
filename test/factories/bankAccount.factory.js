import { Factory } from 'rosie';
import mongoose from 'mongoose';

export default new Factory()
  .option('generateId', false)
  .after((bankAccount, options) =>
    options.generateId ? { _id: mongoose.Types.ObjectId(), ...bankAccount } : bankAccount,
  )
  .attr('accountName', 'Highrachy Investment & Technology Limited')
  .sequence('accountNumber', (i) => `012345678${i}`)
  .attr('bank', 'ABC Bank');

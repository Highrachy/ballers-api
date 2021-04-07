import mongoose from 'mongoose';
import { expect } from '../config';
import { resolveOfflinePayment } from '../../server/services/offlinePayment.service';
import OfflinePaymentFactory from '../factories/offlinePayment.factory';
import OfflinePayment from '../../server/models/offlinePayment.model';
import Transaction from '../../server/models/transaction.model';
import Offer from '../../server/models/offer.model';
import OfferFactory from '../factories/offer.factory';

describe('Offline Payment Service', () => {
  const offer = OfferFactory.build(
    {
      totalAmountPayable: 4_000_000,
      initialPayment: 2_000_000,
      periodicPayment: 500_000,
      paymentFrequency: 30,
      initialPaymentDate: new Date('2020-03-01'),
      referenceCode: 'HIG/P/OLP/02/28022021',
      propertyId: mongoose.Types.ObjectId(),
      vendorId: mongoose.Types.ObjectId(),
      userId: mongoose.Types.ObjectId(),
    },
    { generateId: true },
  );

  const offlinePayment = OfflinePaymentFactory.build(
    {
      offerId: offer._id,
      userId: mongoose.Types.ObjectId(),
      amount: 10_000,
      bank: 'GTB',
      dateOfPayment: '2020-01-21',
      type: 'bank transfer',
      resolved: {
        status: false,
      },
    },
    { generateId: true },
  );

  beforeEach(async () => {
    await Offer.create(offer);
    await OfflinePayment.create(offlinePayment);
  });

  describe('#resolveOfflinePayment', () => {
    let countedTransactions;
    const data = {
      adminId: mongoose.Types.ObjectId(),
      offlinePaymentId: offlinePayment._id,
    };

    beforeEach(async () => {
      countedTransactions = await Transaction.countDocuments({});
    });

    context('when offline payment is resolved', () => {
      it('resolves payment & adds new transaction', async () => {
        const payment = await resolveOfflinePayment(data);
        const currentCountedTransactions = await Transaction.countDocuments({});

        expect(payment.resolved.status).to.eql(true);
        expect(payment.resolved.by).to.eql(data.adminId);
        expect(currentCountedTransactions).to.eql(countedTransactions + 1);
      });
    });

    context('when admin id is empty', () => {
      it('throws an error', async () => {
        try {
          await resolveOfflinePayment({ ...data, adminId: '' });
        } catch (err) {
          const currentCountedTransactions = await Transaction.countDocuments({});
          expect(err.statusCode).to.eql(400);
          expect(err.message).to.be.eql('Error resolving offline payment');
          expect(currentCountedTransactions).to.eql(countedTransactions);
        }
      });
    });

    context('when offline payment id is invalid', () => {
      it('throws an error', async () => {
        try {
          await resolveOfflinePayment({ ...data, offlinePaymentId: mongoose.Types.ObjectId() });
        } catch (err) {
          const currentCountedTransactions = await Transaction.countDocuments({});
          expect(err.statusCode).to.eql(404);
          expect(err.message).to.be.eql('Invalid offline payment');
          expect(currentCountedTransactions).to.eql(countedTransactions);
        }
      });
    });
  });
});

import mongoose from 'mongoose';
import { expect, sinon } from '../config';
import NextPayment from '../../server/models/nextPayment.model';
import Offer from '../../server/models/offer.model';
import { generateNextPaymentDate } from '../../server/services/nextPayment.service';
import OfferFactory from '../factories/offer.factory';

describe('NextPayment Service', () => {
  const offer = OfferFactory.build(
    {
      totalAmountPayable: 100000,
      initialPayment: 50000,
      periodicPayment: 10000,
      paymentFrequency: 30,
      initialPaymentDate: new Date('2021-03-01'),
      referenceCode: 'HIG/P/OLP/02/28022021',
      propertyId: mongoose.Types.ObjectId(),
      vendorId: mongoose.Types.ObjectId(),
      userId: mongoose.Types.ObjectId(),
    },
    { generateId: true },
  );

  describe('#generateNextPaymentDate', () => {
    let countedNextPayments;

    beforeEach(async () => {
      await Offer.create(offer);
      countedNextPayments = await NextPayment.countDocuments({});
    });

    context('when a valid nextPayment is entered', () => {
      let fakeDate;
      beforeEach(async () => {
        await generateNextPaymentDate({ offerId: offer._id });
      });

      before(async () => {
        fakeDate = sinon.useFakeTimers({
          now: new Date('2021-04-05'),
        });
      });

      it('adds a new nextPayment', async () => {
        const currentcountedNextPayments = await NextPayment.countDocuments({});
        const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
        expect(currentcountedNextPayments).to.eql(countedNextPayments + 1);
        expect(matchedNextPayments[matchedNextPayments.length - 1].expectedAmount).to.eql(60000);
        expect(matchedNextPayments[matchedNextPayments.length - 1].expiresOn).to.eql(
          new Date('2021-04-30'),
        );
      });

      after(() => {
        fakeDate.restore();
      });
    });
  });
});

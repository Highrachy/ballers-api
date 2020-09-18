import mongoose from 'mongoose';
import { expect, sinon, useDatabase } from '../config';
import {
  addReferral,
  getAllUserReferrals,
  updateReferralToRewarded,
} from '../../server/services/referral.service';
import ReferralFactory from '../factories/referral.factory';
import UserFactory from '../factories/user.factory';
import Referral from '../../server/models/referral.model';
import User from '../../server/models/user.model';
import { REFERRAL_STATUS } from '../../server/helpers/constants';

useDatabase();

describe('Referral Service', () => {
  describe('#addReferral', () => {
    let countedReferrals;
    const userId = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: userId });

    beforeEach(async () => {
      countedReferrals = await Referral.countDocuments({});
      await User.create(user);
    });

    context('when a valid referral is entered', () => {
      it('adds a new referral', async () => {
        const referralInfo = ReferralFactory.build({ userId, referrerId: userId });
        const referral = await addReferral(referralInfo);
        const currentcountedReferrals = await Referral.countDocuments({});
        expect(referral.referralInfo).to.eql(referralInfo.referralInfo);
        expect(referral.userId).to.eql(referralInfo.userId);
        expect(currentcountedReferrals).to.eql(countedReferrals + 1);
      });
    });

    context('when the user id is invalid', () => {
      it('throws a validation error', async () => {
        try {
          const invalidReferralInfo = ReferralFactory.build({ userId: '', referrerId: userId });
          await addReferral(invalidReferralInfo);
        } catch (err) {
          const currentcountedReferrals = await Referral.countDocuments({});
          expect(err.statusCode).to.eql(400);
          expect(err.message).to.be.eql('Error adding referral info');
          expect(currentcountedReferrals).to.eql(countedReferrals);
        }
      });
    });

    context('when the referee id is invalid', () => {
      it('throws a validation error', async () => {
        try {
          const invalidReferralInfo = ReferralFactory.build({ userId, referrerId: '' });
          await addReferral(invalidReferralInfo);
        } catch (err) {
          const currentcountedReferrals = await Referral.countDocuments({});
          expect(err.statusCode).to.eql(400);
          expect(err.message).to.be.eql('Error adding referral info');
          expect(currentcountedReferrals).to.eql(countedReferrals);
        }
      });
    });
  });

  describe('#getAllUserReferrals', () => {
    const userId = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: userId });
    const referral = ReferralFactory.build({ userId, referrerId: userId });

    beforeEach(async () => {
      await User.create(user);
      await addReferral(referral);
      await addReferral(referral);
    });

    context('when referral added is valid', () => {
      it('returns 2 referrals', async () => {
        const referrasls = await getAllUserReferrals(userId);
        expect(referrasls).to.be.an('array');
        expect(referrasls.length).to.be.eql(2);
      });
    });
    context('when new referral is added', () => {
      beforeEach(async () => {
        await addReferral(referral);
      });
      it('returns 3 referrals', async () => {
        const referrasls = await getAllUserReferrals(userId);
        expect(referrasls).to.be.an('array');
        expect(referrasls.length).to.be.eql(3);
      });
    });
  });

  describe('#updateReferralToRewarded', () => {
    const userId = mongoose.Types.ObjectId();
    const referralId = mongoose.Types.ObjectId();
    const referral = ReferralFactory.build({ _id: referralId, userId, referrerId: userId });

    beforeEach(async () => {
      await addReferral(referral);
    });

    context('when referral is rewarded', () => {
      it('returns a valid updated referral', async () => {
        const registeredReferral = await updateReferralToRewarded(referralId);
        expect(registeredReferral._id).to.eql(referralId);
        expect(registeredReferral.userId).to.eql(userId);
        expect(registeredReferral.referrerId).to.eql(userId);
        expect(registeredReferral.status).to.eql(REFERRAL_STATUS.REWARDED);
      });
    });

    context('when findByIdAndUpdate fails', () => {
      it('throws an error', async () => {
        sinon.stub(Referral, 'findByIdAndUpdate').throws(new Error('error msg'));
        try {
          await updateReferralToRewarded(referralId);
        } catch (err) {
          expect(err.statusCode).to.eql(404);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Referral not found');
        }
        Referral.findByIdAndUpdate.restore();
      });
    });
  });
});

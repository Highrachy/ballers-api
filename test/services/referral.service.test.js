import mongoose from 'mongoose';
import { expect, sinon, useDatabase } from '../config';
import {
  addReferral,
  getAllUserReferrals,
  updateReferralToRewarded,
  getReferralByEmail,
  sendReferralInvite,
  getReferralById,
  getAllReferrals,
  getUserByRefCode,
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
          const invalidReferralInfo = ReferralFactory.build({ referrerId: '' });
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

  describe('#getReferralByEmail', () => {
    const email = 'demo@mail.com';
    const userId = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: userId });
    const referral = ReferralFactory.build({ referrerId: userId, email });

    beforeEach(async () => {
      await User.create(user);
      await addReferral(referral);
    });

    it('returns a valid referral by email', async () => {
      const ref = await getReferralByEmail(email);
      expect(ref.email).to.eql(email);
    });
  });

  describe('#sendReferralInvite', () => {
    let countedReferrals;
    const userId = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: userId });

    beforeEach(async () => {
      countedReferrals = await Referral.countDocuments({});
      await User.create(user);
    });

    context('when a valid referral is entered', () => {
      it('adds a new referral', async () => {
        const referralInfo = ReferralFactory.build({ referrerId: userId, email: 'demo@mail.io' });
        const referral = await sendReferralInvite(referralInfo);
        const currentcountedReferrals = await Referral.countDocuments({});
        expect(referral.email).to.eql(referralInfo.email);
        expect(currentcountedReferrals).to.eql(countedReferrals + 1);
      });
    });

    context('when the email is invalid', () => {
      it('throws a validation error', async () => {
        try {
          const invalidReferralInfo = ReferralFactory.build({ email: '' });
          await sendReferralInvite(invalidReferralInfo);
        } catch (err) {
          const currentcountedReferrals = await Referral.countDocuments({});
          expect(err.statusCode).to.eql(400);
          expect(err.message).to.be.eql('Error sending invite');
          expect(currentcountedReferrals).to.eql(countedReferrals);
        }
      });
    });
  });

  describe('#getReferralById', () => {
    const userId = mongoose.Types.ObjectId();
    const referralId = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: userId });
    const referral = ReferralFactory.build({
      _id: referralId,
      referrerId: userId,
      email: 'demo@mail.com',
    });

    beforeEach(async () => {
      await User.create(user);
      await addReferral(referral);
    });

    it('returns a valid referral by referral id', async () => {
      const ref = await getReferralById(referralId);
      expect(ref[0]._id).to.eql(referralId);
    });
  });

  describe('#getUserByRefCode', () => {
    const userId = mongoose.Types.ObjectId();
    const referralCode = 'RC1234';
    const user = UserFactory.build({ _id: userId, referralCode });

    beforeEach(async () => {
      await User.create(user);
    });

    it('returns a valid user by referral code', async () => {
      const res = await getUserByRefCode(referralCode);
      expect(res[0]._id).to.eql(userId);
    });
  });

  describe('#getAllReferrals', () => {
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
        const referrasls = await getAllReferrals();
        expect(referrasls).to.be.an('array');
        expect(referrasls.length).to.be.eql(2);
      });
    });
    context('when new referral is added', () => {
      beforeEach(async () => {
        await addReferral(referral);
      });
      it('returns 3 referrals', async () => {
        const referrasls = await getAllReferrals();
        expect(referrasls).to.be.an('array');
        expect(referrasls.length).to.be.eql(3);
      });
    });
  });
});

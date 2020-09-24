import mongoose from 'mongoose';
import { expect, sinon, useDatabase } from '../config';
import {
  addReferral,
  getAllUserReferrals,
  updateReferralToRewarded,
  getReferralByEmailAndReferrerId,
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
    const referrerId = mongoose.Types.ObjectId();
    const referrer = UserFactory.build({ _id: referrerId, email: 'registered@mail.com' });

    beforeEach(async () => {
      countedReferrals = await Referral.countDocuments({});
      await User.create(referrer);
    });

    context('when a valid direct referral is entered', () => {
      it('adds a new referral', async () => {
        const referralInfo = ReferralFactory.build({ referrerId });
        const referral = await addReferral(referralInfo);
        const currentcountedReferrals = await Referral.countDocuments({});
        expect(referral.referralInfo).to.eql(referralInfo.referralInfo);
        expect(referral.status).to.eql(REFERRAL_STATUS.SENT);
        expect(currentcountedReferrals).to.eql(countedReferrals + 1);
      });
    });

    context('when the referee id is invalid', () => {
      it('throws a validation error', async () => {
        try {
          const invalidReferralInfo = ReferralFactory.build({ referrerId: '' });
          await addReferral(invalidReferralInfo);
        } catch (err) {
          const currentcountedReferrals = await Referral.countDocuments({});
          expect(err.statusCode).to.eql(500);
          expect(err.message).to.be.eql('Internal Server Error');
          expect(currentcountedReferrals).to.eql(countedReferrals);
        }
      });
    });

    // TODO fix tests for invite referral
    // context('when a valid invite referral is entered', () => {
    //   const email = 'sam@mail.com';
    //   const invite = ReferralFactory.build({ referrerId });
    //   before(async () => {
    //     await sendReferralInvite(invite);
    //     countedReferrals = await Referral.countDocuments({});
    //   });
    //   it('updates referal invite', async () => {
    //     const referralInfo = ReferralFactory.build({ referrerId, email });
    //     const referral = await addReferral(referralInfo);
    //     const currentcountedReferrals = await Referral.countDocuments({});
    //     expect(referral.referralInfo).to.eql(referralInfo.referralInfo);
    //     expect(referral.status).to.eql(REFERRAL_STATUS.REGISTERED);
    //     expect(currentcountedReferrals).to.eql(countedReferrals);
    //   });
    // });
  });

  describe('#getAllUserReferrals', () => {
    const referrerId = mongoose.Types.ObjectId();
    const referrer = UserFactory.build({ _id: referrerId });
    const referral1 = ReferralFactory.build({ referrerId, email: 'demo1@mail.com' });
    const referral2 = ReferralFactory.build({ referrerId, email: 'demo2@mail.com' });
    const referral3 = ReferralFactory.build({ referrerId, email: 'demo3@mail.com' });

    beforeEach(async () => {
      await User.create(referrer);
      await addReferral(referral1);
      await addReferral(referral2);
    });

    context('when referral added is valid', () => {
      it('returns 2 referrals', async () => {
        const referrasls = await getAllUserReferrals(referrerId);
        expect(referrasls).to.be.an('array');
        expect(referrasls.length).to.be.eql(2);
      });
    });
    context('when new referral is added', () => {
      beforeEach(async () => {
        await addReferral(referral3);
      });
      it('returns 3 referrals', async () => {
        const referrasls = await getAllUserReferrals(referrerId);
        expect(referrasls).to.be.an('array');
        expect(referrasls.length).to.be.eql(3);
      });
    });
  });

  describe('#updateReferralToRewarded', () => {
    const userId = mongoose.Types.ObjectId();
    const referrerId = mongoose.Types.ObjectId();
    const referralId = mongoose.Types.ObjectId();
    const referral = ReferralFactory.build({ _id: referralId, userId, referrerId });

    beforeEach(async () => {
      await addReferral(referral);
    });

    context('when referral is rewarded', () => {
      it('returns a valid updated referral', async () => {
        const registeredReferral = await updateReferralToRewarded(referralId);
        expect(registeredReferral._id).to.eql(referralId);
        expect(registeredReferral.userId).to.eql(userId);
        expect(registeredReferral.referrerId).to.eql(referrerId);
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

  describe('#getReferralByEmailAndReferrerId', () => {
    const email = 'demo@mail.com';
    const referrerId = mongoose.Types.ObjectId();
    const referrer = UserFactory.build({ _id: referrerId });
    const referral = ReferralFactory.build({ referrerId, email });

    beforeEach(async () => {
      await User.create(referrer);
      await addReferral(referral);
    });

    it('returns a valid referral by email', async () => {
      const ref = await getReferralByEmailAndReferrerId(email, referrerId);
      expect(ref[0].email).to.eql(email);
      expect(ref[0].referrerId).to.eql(referrerId);
    });
  });

  describe('#sendReferralInvite', () => {
    let countedReferrals;
    const referrerId = mongoose.Types.ObjectId();
    const registeredEmail = 'registered@mail.com';
    const referrer = UserFactory.build({ _id: referrerId, email: registeredEmail });

    beforeEach(async () => {
      countedReferrals = await Referral.countDocuments({});
      await User.create(referrer);
    });

    context('when a valid referral is entered', () => {
      it('adds a new referral', async () => {
        const referralInfo = ReferralFactory.build({ referrerId, email: 'demo@mail.io' });
        const referral = await sendReferralInvite(referralInfo);
        const currentcountedReferrals = await Referral.countDocuments({});
        expect(referral.email).to.eql(referralInfo.email);
        expect(currentcountedReferrals).to.eql(countedReferrals + 1);
      });
    });

    context('when referral is sent to registered user', () => {
      it('throws a validation error', async () => {
        try {
          const invalidReferralInfo = ReferralFactory.build({ email: registeredEmail, referrerId });
          await sendReferralInvite(invalidReferralInfo);
        } catch (err) {
          const currentcountedReferrals = await Referral.countDocuments({});
          expect(err.statusCode).to.eql(412);
          expect(err.message).to.be.eql(`${registeredEmail} has already registered on Ballers.`);
          expect(currentcountedReferrals).to.eql(countedReferrals);
        }
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
    const referrerId = mongoose.Types.ObjectId();
    const referralId = mongoose.Types.ObjectId();
    const referrer = UserFactory.build({ _id: referrerId });
    const referral = ReferralFactory.build({
      _id: referralId,
      referrerId,
      email: 'demo@mail.com',
    });

    beforeEach(async () => {
      await User.create(referrer);
      await addReferral(referral);
    });

    it('returns a valid referral by referral id', async () => {
      const ref = await getReferralById(referralId);
      expect(ref[0]._id).to.eql(referralId);
    });
  });

  describe('#getUserByRefCode', () => {
    const referrerId = mongoose.Types.ObjectId();
    const referralCode = 'RC1234';
    const referrer = UserFactory.build({ _id: referrerId, referralCode });

    beforeEach(async () => {
      await User.create(referrer);
    });

    it('returns a valid user by referral code', async () => {
      const res = await getUserByRefCode(referralCode);
      expect(res[0]._id).to.eql(referrerId);
    });
  });

  describe('#getAllReferrals', () => {
    const referrerId = mongoose.Types.ObjectId();
    const referrer = UserFactory.build({ _id: referrerId });
    const referral1 = ReferralFactory.build({ referrerId, email: 'demo1@mail.com' });
    const referral2 = ReferralFactory.build({ referrerId, email: 'demo2@mail.com' });
    const referral3 = ReferralFactory.build({ referrerId, email: 'demo3@mail.com' });

    beforeEach(async () => {
      await User.create(referrer);
      await addReferral(referral1);
      await addReferral(referral2);
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
        await addReferral(referral3);
      });
      it('returns 3 referrals', async () => {
        const referrasls = await getAllReferrals();
        expect(referrasls).to.be.an('array');
        expect(referrasls.length).to.be.eql(3);
      });
    });
  });
});

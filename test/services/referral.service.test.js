import mongoose from 'mongoose';
import { expect, sinon } from '../config';
import {
  addReferral,
  updateReferralToRewarded,
  getReferralByEmailAndReferrerId,
  sendReferralInvite,
  getReferralById,
  getUserByRefCode,
} from '../../server/services/referral.service';
import ReferralFactory from '../factories/referral.factory';
import UserFactory from '../factories/user.factory';
import Referral from '../../server/models/referral.model';
import User from '../../server/models/user.model';
import { REFERRAL_STATUS, REWARD_STATUS, USER_ROLE } from '../../server/helpers/constants';
import { expectNewNotificationToBeAdded } from '../helpers';
import NOTIFICATIONS from '../../server/helpers/notifications';
import { getMoneyFormat } from '../../server/helpers/funtions';

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

    context('when referee was invited directly', () => {
      const inviteEmail = 'sam@mail.com';
      const userId = mongoose.Types.ObjectId();
      const user = UserFactory.build({ _id: userId });
      before(async () => {
        await User.create(user);
        await sendReferralInvite({ email: inviteEmail, referrerId: userId });
        countedReferrals = await Referral.countDocuments({});
      });
      it('updates referral invite to registered', async () => {
        const referralInfo = ReferralFactory.build({ referrerId: userId, email: inviteEmail });
        const referral = await addReferral(referralInfo);
        const currentcountedReferrals = await Referral.countDocuments({});
        expect(referral.referralInfo).to.eql(referralInfo.referralInfo);
        expect(referral.status).to.eql(REFERRAL_STATUS.REGISTERED);
        expect(currentcountedReferrals).to.eql(countedReferrals);
      });
    });
  });

  describe('#updateReferralToRewarded', () => {
    const referralId = mongoose.Types.ObjectId();
    const referrerId = mongoose.Types.ObjectId();
    const referral = ReferralFactory.build({
      _id: referralId,
      referrerId,
      reward: { status: REWARD_STATUS.PAYMENT_COMPLETED, amount: 100_000 },
    });
    const referrer = UserFactory.build({ _id: referrerId });
    const admin = UserFactory.build({ role: USER_ROLE.ADMIN }, { generateId: true });

    beforeEach(async () => {
      await User.insertMany([referrer, admin]);
      await addReferral(referral);
    });

    context('when referral is rewarded', () => {
      it('returns a valid updated referral', async () => {
        const registeredReferral = await updateReferralToRewarded({
          referralId,
          adminId: admin._id,
        });
        expect(registeredReferral.referral._id).to.eql(referralId);
        expect(registeredReferral.referral.referrerId).to.eql(referrerId);
        expect(registeredReferral.referral.status).to.eql(REFERRAL_STATUS.REWARDED);
        expect(registeredReferral.referral.reward.status).to.eql(REWARD_STATUS.REFERRAL_PAID);
      });
    });

    context('when new notification is added', () => {
      beforeEach(async () => {
        await updateReferralToRewarded({
          referralId,
          adminId: admin._id,
        });
      });

      const description = `You have recieved ${getMoneyFormat(
        referral.reward.amount,
      )} as commission for your referral`;

      expectNewNotificationToBeAdded(NOTIFICATIONS.REWARD_REFERRAL, referrerId, {
        description,
        actionId: referralId,
      });
    });

    context('when findByIdAndUpdate fails', () => {
      it('throws an error', async () => {
        sinon.stub(Referral, 'findByIdAndUpdate').throws(new Error('error msg'));
        try {
          await updateReferralToRewarded({
            referralId,
            adminId: admin._id,
          });
        } catch (err) {
          expect(err.statusCode).to.eql(400);
          expect(err.message).to.be.eql('Error rewarding referral');
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
      expect(ref._id).to.eql(referralId);
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
});

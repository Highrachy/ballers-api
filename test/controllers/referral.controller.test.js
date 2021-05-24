import mongoose from 'mongoose';
import { expect, request, sinon } from '../config';
import Referral from '../../server/models/referral.model';
import User from '../../server/models/user.model';
import ReferralFactory from '../factories/referral.factory';
import UserFactory from '../factories/user.factory';
import { addUser } from '../../server/services/user.service';
import { addReferral, sendReferralInvite } from '../../server/services/referral.service';
import { REFERRAL_STATUS, REWARD_STATUS, USER_ROLE } from '../../server/helpers/constants';
import * as MailService from '../../server/services/mailer.service';
import EMAIL_CONTENT from '../../mailer';
import OfferFactory from '../factories/offer.factory';
import EnquiryFactory from '../factories/enquiry.factory';
import PropertyFactory from '../factories/property.factory';
import { createOffer } from '../../server/services/offer.service';
import { addEnquiry } from '../../server/services/enquiry.service';
import Property from '../../server/models/property.model';
import {
  itReturnsForbiddenForNoToken,
  itReturnsForbiddenForTokenWithInvalidAccess,
  itReturnsNotFoundForInvalidToken,
} from '../helpers';

let sendMailStub;
const sandbox = sinon.createSandbox();

let adminToken;
let userToken;
const userId = mongoose.Types.ObjectId();
const adminId = mongoose.Types.ObjectId();
const adminUser = UserFactory.build({
  _id: adminId,
  role: USER_ROLE.ADMIN,
  activated: true,
  email: 'admin@mail.com',
});
const regularUser = UserFactory.build({
  _id: userId,
  role: USER_ROLE.USER,
  activated: true,
  email: 'user@mail.com',
});

describe('Referral Controller', () => {
  beforeEach(() => {
    sendMailStub = sandbox.stub(MailService, 'sendMail');
  });

  afterEach(() => {
    sandbox.restore();
  });

  beforeEach(async () => {
    adminToken = await addUser(adminUser);
    userToken = await addUser(regularUser);
  });

  describe('Referral Invite Route', () => {
    context('with valid data', () => {
      it('returns successful invite', (done) => {
        const invite = { email: 'invite-1@mail.com', firstName: 'John' };
        request()
          .post('/api/v1/referral/invite')
          .set('authorization', userToken)
          .send(invite)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Invite sent');
            expect(sendMailStub.callCount).to.eq(1);
            expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.REFERRAL_INVITE);
            done();
          });
      });
    });

    context('with first name is absent', () => {
      it('returns successful invite', (done) => {
        const invite = { email: 'invite-2@mail.com' };
        request()
          .post('/api/v1/referral/invite')
          .set('authorization', userToken)
          .send(invite)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Invite sent');
            expect(sendMailStub.callCount).to.eq(1);
            expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.REFERRAL_INVITE);
            done();
          });
      });
    });

    context('when an invalid token is used', () => {
      beforeEach(async () => {
        await User.findByIdAndDelete(userId);
      });
      it('returns token error', (done) => {
        const invite = ReferralFactory.build();
        request()
          .post('/api/v1/referral/invite')
          .set('authorization', userToken)
          .send(invite)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid token');
            expect(sendMailStub.callCount).to.eq(0);
            done();
          });
      });
    });

    context('with invalid data', () => {
      context('when invite email is empty', () => {
        it('returns an error', (done) => {
          const invite = ReferralFactory.build({ email: '' });
          request()
            .post('/api/v1/referral/invite')
            .set('authorization', adminToken)
            .send(invite)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Email Address" is not allowed to be empty');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when no email is not given', () => {
        it('returns an error', (done) => {
          const invite = { firstName: 'John' };
          request()
            .post('/api/v1/referral/invite')
            .set('authorization', adminToken)
            .send(invite)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Email Address" is required');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when email that has been invited by another user but has not registered', () => {
        const email = 'invite-1@mail.com';
        let newUserToken;
        const newUserId = mongoose.Types.ObjectId();
        const newUser = UserFactory.build({ _id: newUserId, activated: true });
        beforeEach(async () => {
          newUserToken = await addUser(newUser);
          await sendReferralInvite({ email, referrerId: userId });
        });
        it('returns successful invite', (done) => {
          const invite = { email, firstName: 'John' };
          request()
            .post('/api/v1/referral/invite')
            .set('authorization', newUserToken)
            .send(invite)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Invite sent');
              expect(sendMailStub.callCount).to.eq(1);
              expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.REFERRAL_INVITE);
              done();
            });
        });
      });

      context('when user has sent invite to email previously', () => {
        const email = 'invite-1@mail.com';
        beforeEach(async () => {
          await sendReferralInvite({ email, referrerId: userId });
        });
        it('returns successful invite', (done) => {
          const invite = { email, firstName: 'John' };
          request()
            .post('/api/v1/referral/invite')
            .set('authorization', userToken)
            .send(invite)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Multiple invites cannot be sent to same email');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when invite email is a registered user', () => {
        it('returns an error', (done) => {
          const invite = ReferralFactory.build({ email: 'admin@mail.com' });
          request()
            .post('/api/v1/referral/invite')
            .set('authorization', adminToken)
            .send(invite)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql(
                'admin@mail.com has already registered on Ballers.',
              );
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });
    });
  });

  describe('Get all referrals', () => {
    const referral1 = ReferralFactory.build({ referrerId: adminId, email: 'demo-1@mail.com' });
    const referral2 = ReferralFactory.build({ referrerId: adminId, email: 'demo-2@mail.com' });

    context('when no referral is found', () => {
      it('returns not found', (done) => {
        request()
          .get('/api/v1/referral/all')
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.referrals.length).to.be.eql(0);
            done();
          });
      });
    });

    describe('when referrals exist in db', () => {
      beforeEach(async () => {
        await addReferral(referral1);
        await addReferral(referral2);
      });

      context('with a valid token & id', () => {
        it('returns successful payload', (done) => {
          request()
            .get('/api/v1/referral/all')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('referrals');
              expect(res.body.referrals[0]).to.have.property('reward');
              expect(res.body.referrals[0]).to.have.property('status');
              expect(res.body.referrals[0]).to.have.property('referrerId');
              expect(res.body.referrals[0].referrerId).to.be.eql(adminId.toString());
              expect(res.body.referrals[0]).to.have.property('email');
              expect(res.body.referrals[0].email).to.be.eql('demo-1@mail.com');
              expect(res.body.referrals[0]).to.have.property('referrer');
              expect(res.body.referrals[0].referrer).to.have.property('firstName');
              expect(res.body.referrals[0].referrer).to.have.property('lastName');
              expect(res.body.referrals[0].referrer).to.have.property('email');
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get('/api/v1/referral/all')
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when an invalid token is used', () => {
        beforeEach(async () => {
          await User.findByIdAndDelete(adminId);
        });
        it('returns token error', (done) => {
          request()
            .get('/api/v1/referral/all')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Invalid token');
              done();
            });
        });
      });

      context('when getAllReferrals service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Referral, 'aggregate').throws(new Error('Type Error'));
          request()
            .get('/api/v1/referral/all')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              Referral.aggregate.restore();
            });
        });
      });
    });
  });

  describe('Get all owned referrals', () => {
    const referral1 = ReferralFactory.build({ referrerId: userId, email: 'demo1@mail.com' });
    const referral2 = ReferralFactory.build({ referrerId: adminId, email: 'demo2@mail.com' });
    const referral3 = ReferralFactory.build({ referrerId: userId, email: 'demo3@mail.com' });

    context('when no referral is found', () => {
      it('returns not found', (done) => {
        request()
          .get('/api/v1/referral/')
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.referrals.length).to.be.eql(0);
            done();
          });
      });
    });

    describe('when referrals exist in db', () => {
      beforeEach(async () => {
        await addReferral(referral1);
        await addReferral(referral2);
        await addReferral(referral3);
      });

      context('with a valid token & id', () => {
        it('returns successful payload', (done) => {
          request()
            .get('/api/v1/referral/')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.referrals.length).to.be.eql(2);
              expect(res.body).to.have.property('referrals');
              expect(res.body.referrals[0]).to.have.property('reward');
              expect(res.body.referrals[0]).to.have.property('status');
              expect(res.body.referrals[0]).to.have.property('referrerId');
              expect(res.body.referrals[0].referrerId).to.be.eql(userId.toString());
              expect(res.body.referrals[0]).to.have.property('email');
              expect(res.body.referrals[0].email).to.be.eql('demo1@mail.com');
              expect(res.body.referrals[0]).to.have.property('referrer');
              expect(res.body.referrals[0].referrer).to.have.property('email');
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get('/api/v1/referral/')
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when an invalid token is used', () => {
        beforeEach(async () => {
          await User.findByIdAndDelete(userId);
        });
        it('returns token error', (done) => {
          request()
            .get('/api/v1/referral/')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Invalid token');
              done();
            });
        });
      });

      context('when getAllUserReferrals service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Referral, 'aggregate').throws(new Error('Type Error'));
          request()
            .get('/api/v1/referral/')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              Referral.aggregate.restore();
            });
        });
      });
    });
  });

  describe('Get user information by referral code', () => {
    const testId = mongoose.Types.ObjectId();
    const referralCode = 'RC1234';
    const email = 'referrer@mail.com';
    const firstName = 'Sammy';
    const referrer = UserFactory.build({ _id: testId, referralCode, email, firstName });

    beforeEach(async () => {
      await User.create(referrer);
    });

    context('with a valid referral code', () => {
      it('returns successful payload', (done) => {
        request()
          .get(`/api/v1/referral/ref/${referralCode}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('user');
            expect(res.body.user._id).to.be.eql(testId.toString());
            expect(res.body.user.firstName).to.be.eql(firstName);
            expect(res.body.user.email).to.be.eql(email);
            expect(res.body.user).to.not.have.property('password');
            done();
          });
      });
    });

    context('with an invalid referral id', () => {
      it('returns not found', (done) => {
        request()
          .get(`/api/v1/referral/ref/AB1234`)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('User not found');
            done();
          });
      });
    });

    context('when getUserByRefCode service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(User, 'aggregate').throws(new Error('Type Error'));
        request()
          .get(`/api/v1/referral/ref/${referralCode}`)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            User.aggregate.restore();
          });
      });
    });
  });

  describe('Get a referral by the id', () => {
    const referralId = mongoose.Types.ObjectId();
    const invalidId = mongoose.Types.ObjectId();
    const referral = ReferralFactory.build({ _id: referralId, referrerId: adminId });

    beforeEach(async () => {
      await addReferral(referral);
    });

    context('with a valid id', () => {
      it('returns successful payload', (done) => {
        request()
          .get(`/api/v1/referral/${referralId}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('referral');
            done();
          });
      });
    });

    context('with an invalid referral id', () => {
      it('returns not found', (done) => {
        request()
          .get(`/api/v1/referral/${invalidId}`)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Referral not found');
            done();
          });
      });
    });

    context('when getReferralById service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Referral, 'aggregate').throws(new Error('Type Error'));
        request()
          .get(`/api/v1/referral/${referralId}`)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            Referral.aggregate.restore();
          });
      });
    });
  });

  describe('Reward a referral', () => {
    const referralId = mongoose.Types.ObjectId();
    const invalidId = mongoose.Types.ObjectId();
    const referral = ReferralFactory.build({ _id: referralId, referrerId: adminId });

    const referralDetails = {
      referralId,
    };

    beforeEach(async () => {
      await addReferral(referral);
    });

    context('with valid data & token', () => {
      it('returns assigned referral', (done) => {
        request()
          .put('/api/v1/referral/rewarded')
          .set('authorization', adminToken)
          .send(referralDetails)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Referral rewarded');
            expect(res.body).to.have.property('referral');
            expect(res.body.referral._id).to.be.eql(referralId.toString());
            expect(res.body.referral.status).to.be.eql(REFERRAL_STATUS.REWARDED);
            expect(res.body.referral.reward.status).to.be.eql(REWARD_STATUS.PAID);
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .put('/api/v1/referral/rewarded')
          .send(referralDetails)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('with unauthorized user access token', () => {
      it('returns error', (done) => {
        request()
          .put('/api/v1/referral/rewarded')
          .set('authorization', userToken)
          .send(referralDetails)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('when updateReferralToRewarded service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Referral, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          .put('/api/v1/referral/rewarded')
          .set('authorization', adminToken)
          .send(referralDetails)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Referral.findByIdAndUpdate.restore();
          });
      });
    });

    context('with invalid data', () => {
      context('when referral id is empty', () => {
        it('returns an error', (done) => {
          const invalidData = { referralId: '' };
          request()
            .put('/api/v1/referral/rewarded')
            .set('authorization', adminToken)
            .send(invalidData)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Referral Id" is not allowed to be empty');
              done();
            });
        });
      });
      context('when invalid referral id', () => {
        it('returns an error', (done) => {
          const invalidData = { referralId: invalidId };
          request()
            .put('/api/v1/referral/rewarded')
            .set('authorization', adminToken)
            .send(invalidData)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Error rewarding referral');
              done();
            });
        });
      });
    });
  });

  describe('Pay out referrals', () => {
    const referredUser = UserFactory.build(
      { role: USER_ROLE.USER, activated: true },
      { generateId: true },
    );
    const referral = ReferralFactory.build(
      { referrerId: adminId, userId: referredUser._id },
      { generateId: true },
    );

    const vendorUser = UserFactory.build(
      { role: USER_ROLE.VENDOR, activated: true },
      { generateId: true },
    );

    const endpoint = `/api/v1/referral/pay/${referral._id}`;
    const method = 'put';

    const properties = PropertyFactory.buildList(
      2,
      { addedBy: vendorUser._id, flagged: { status: false }, approved: { status: true } },
      { generateId: true },
    );

    const enquiry1 = EnquiryFactory.build(
      {
        userId: referredUser._id,
        propertyId: properties[0]._id,
      },
      { generateId: true },
    );
    const offer1 = OfferFactory.build(
      {
        enquiryId: enquiry1._id,
        vendorId: vendorUser._id,
        totalAmountPayable: 500_000,
      },
      { generateId: true },
    );

    const enquiry2 = EnquiryFactory.build(
      {
        userId: referredUser._id,
        propertyId: properties[1]._id,
      },
      { generateId: true },
    );
    const offer2 = OfferFactory.build(
      {
        enquiryId: enquiry2._id,
        vendorId: vendorUser._id,
        totalAmountPayable: 900_000,
      },
      { generateId: true },
    );

    beforeEach(async () => {
      await addUser(vendorUser);
      await Property.insertMany(properties);
      await addUser(referredUser);
      await addReferral(referral);
      await addEnquiry(enquiry1);
      await addEnquiry(enquiry2);
      await createOffer(offer1);
      await createOffer(offer2);
    });

    context('with admin token', () => {
      it('returns successful payload', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.referral.status).to.be.eql('Rewarded');
            expect(res.body.referral.reward.status).to.be.eql('Paid');
            expect(res.body.referral.reward.paidBy).to.be.eql(adminUser._id.toString());
            done();
          });
      });
    });

    context('with user and vendor token', () => {
      [regularUser, vendorUser].map((user) =>
        itReturnsForbiddenForTokenWithInvalidAccess({
          endpoint,
          method,
          user,
          useExistingUser: true,
        }),
      );
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: adminUser,
      userId: adminUser._id,
      useExistingUser: true,
    });

    context('when payReferral service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Referral, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Referral.findByIdAndUpdate.restore();
          });
      });
    });
  });
});

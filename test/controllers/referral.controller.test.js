import mongoose from 'mongoose';
import querystring from 'querystring';
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
import { REFERRAL_FILTERS } from '../../server/helpers/filters';
import Offer from '../../server/models/offer.model';
import OfferFactory from '../factories/offer.factory';
import {
  itReturnsForbiddenForNoToken,
  itReturnsNotFoundForInvalidToken,
  itReturnsAnErrorWhenServiceFails,
  itReturnsTheRightPaginationValue,
  itReturnsEmptyValuesWhenNoItemExistInDatabase,
  expectsPaginationToReturnTheRightValues,
  defaultPaginationResult,
  futureDate,
  filterTestForSingleParameter,
  itReturnsNoResultWhenNoFilterParameterIsMatched,
  itReturnAllResultsWhenAnUnknownFilterIsUsed,
  currentDate,
} from '../helpers';
import PropertyFactory from '../factories/property.factory';
import { addProperty } from '../../server/services/property.service';

let sendMailStub;
const sandbox = sinon.createSandbox();

let adminToken;
let userToken;

const adminUser = UserFactory.build(
  {
    role: USER_ROLE.ADMIN,
    activated: true,
    email: 'admin@mail.com',
  },
  { generateId: true },
);
const regularUser = UserFactory.build(
  {
    role: USER_ROLE.USER,
    activated: true,
    email: 'user@mail.com',
  },
  { generateId: true },
);

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
        await User.findByIdAndDelete(regularUser._id);
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
          await sendReferralInvite({ email, referrerId: regularUser._id });
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
          await sendReferralInvite({ email, referrerId: regularUser._id });
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
    const method = 'get';
    const endpoint = '/api/v1/referral/all';
    let vendorToken;
    let editorToken;

    const vendorUser = UserFactory.build(
      { role: USER_ROLE.VENDOR, activated: true },
      { generateId: true },
    );
    const editorUser = UserFactory.build(
      { role: USER_ROLE.EDITOR, activated: true },
      { generateId: true },
    );

    const referredUser = UserFactory.build(
      { role: USER_ROLE.USER, activated: true },
      { generateId: true },
    );

    const property = PropertyFactory.build({ addedBy: vendorUser._id }, { generateId: true });

    const offer = OfferFactory.build(
      {
        enquiryId: mongoose.Types.ObjectId(),
        vendorId: vendorUser._id,
        propertyId: property._id,
        userId: regularUser._id,
        totalAmountPayable: 100_000,
        initialPayment: 50_000,
        periodicPayment: 10_000,
        paymentFrequency: 30,
        initialPaymentDate: new Date('2020-03-01'),
        referenceCode: '123456XXX',
      },
      { generateId: true },
    );

    const userReferrals = ReferralFactory.buildList(
      10,
      {
        referrerId: regularUser._id,
        userId: referredUser._id,
        offerId: mongoose.Types.ObjectId(),
        createdAt: currentDate,
        status: REFERRAL_STATUS.REGISTERED,
        reward: {
          amount: 50_000,
          status: REWARD_STATUS.PAYMENT_STARTED,
          paidBy: vendorUser._id,
          paidOn: currentDate,
        },
      },
      { generateId: true },
    );
    const vendorReferrals = ReferralFactory.buildList(
      3,
      {
        referrerId: vendorUser._id,
        userId: referredUser._id,
        offerId: mongoose.Types.ObjectId(),
        createdAt: currentDate,
        status: REFERRAL_STATUS.REGISTERED,
        reward: {
          amount: 50_000,
          status: REWARD_STATUS.PAYMENT_STARTED,
          paidBy: vendorUser._id,
          paidOn: currentDate,
        },
      },
      { generateId: true },
    );
    const editorReferrals = ReferralFactory.buildList(
      4,
      {
        referrerId: editorUser._id,
        userId: referredUser._id,
        offerId: mongoose.Types.ObjectId(),
        createdAt: currentDate,
        status: REFERRAL_STATUS.REGISTERED,
        reward: {
          amount: 50_000,
          status: REWARD_STATUS.PAYMENT_STARTED,
          paidBy: vendorUser._id,
          paidOn: currentDate,
        },
      },
      { generateId: true },
    );
    const referral = ReferralFactory.build(
      {
        referrerId: adminUser._id,
        userId: regularUser._id,
        email: 'demo-2@mail.com',
        offerId: offer._id,
        createdAt: futureDate,
        status: REFERRAL_STATUS.REWARDED,
        reward: {
          amount: 100_000,
          status: REWARD_STATUS.PAYMENT_COMPLETED,
          paidBy: adminUser._id,
          paidOn: futureDate,
        },
      },
      { generateId: true },
    );

    beforeEach(async () => {
      vendorToken = await addUser(vendorUser);
      editorToken = await addUser(editorUser);
      await addUser(referredUser);
      await addProperty(property);
      await Offer.create(offer);
    });

    describe('Referral pagination', () => {
      context('when no referrals exists in db', () => {
        itReturnsEmptyValuesWhenNoItemExistInDatabase({
          endpoint,
          method,
          user: adminUser,
          useExistingUser: true,
        });
      });

      describe('when referrals exist in db', () => {
        beforeEach(async () => {
          await Referral.insertMany([
            referral,
            ...userReferrals,
            ...editorReferrals,
            ...vendorReferrals,
          ]);
        });

        itReturnsTheRightPaginationValue({
          endpoint,
          method,
          user: adminUser,
          useExistingUser: true,
        });

        context('with admin token', () => {
          it('returns all referrals in db with offer info', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, defaultPaginationResult);
                expect(res.body.result[0]._id).to.be.eql(referral._id.toString());
                expect(res.body.result[0].offerInfo._id).to.be.eql(offer._id.toString());
                expect(res.body.result[0].offerInfo.totalAmountPayable).to.be.eql(
                  offer.totalAmountPayable,
                );
                expect(res.body.result[0].referee._id).to.be.eql(regularUser._id.toString());
                expect(res.body.result[0].referrer._id).to.be.eql(adminUser._id.toString());
                expect(res.body.result[0].propertyInfo._id).to.be.eql(property._id.toString());
                done();
              });
          });
        });

        context('with user token', () => {
          it('returns all owned referrals', (done) => {
            request()
              [method](endpoint)
              .set('authorization', userToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  ...defaultPaginationResult,
                  total: 10,
                  totalPage: 1,
                });
                expect(res.body.result[0]._id).to.be.eql(userReferrals[0]._id.toString());
                done();
              });
          });
        });

        context('with vendor token', () => {
          it('returns all owned referrals', (done) => {
            request()
              [method](endpoint)
              .set('authorization', vendorToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  ...defaultPaginationResult,
                  total: 3,
                  totalPage: 1,
                  result: 3,
                });
                done();
              });
          });
        });

        context('with editor token', () => {
          it('returns all owned referrals', (done) => {
            request()
              [method](endpoint)
              .set('authorization', editorToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  ...defaultPaginationResult,
                  total: 4,
                  totalPage: 1,
                  result: 4,
                });
                done();
              });
          });
        });

        itReturnsForbiddenForNoToken({ endpoint, method });

        itReturnsNotFoundForInvalidToken({
          endpoint,
          method,
          user: adminUser,
          userId: adminUser._id,
          useExistingUser: true,
        });

        itReturnsAnErrorWhenServiceFails({
          endpoint,
          method,
          user: adminUser,
          model: Referral,
          modelMethod: 'aggregate',
          useExistingUser: true,
        });
      });
    });

    describe('Referral filter', () => {
      beforeEach(async () => {
        await Referral.insertMany([
          referral,
          ...userReferrals,
          ...editorReferrals,
          ...vendorReferrals,
        ]);
      });

      describe('Unknown Filters', () => {
        const unknownFilter = {
          dob: '1993-02-01',
        };

        itReturnAllResultsWhenAnUnknownFilterIsUsed({
          filter: unknownFilter,
          method,
          endpoint,
          user: adminUser,
          expectedPagination: defaultPaginationResult,
          useExistingUser: true,
        });
      });

      context('when multiple filters are used', () => {
        const multipleFilters = {
          status: referral.status,
          referrerId: referral.referrerId,
          rewardAmount: referral.reward.amount,
          rewardStatus: referral.reward.status,
        };
        const filteredParams = querystring.stringify(multipleFilters);

        it('returns matched referral', (done) => {
          request()
            [method](`${endpoint}?${filteredParams}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expectsPaginationToReturnTheRightValues(res, {
                currentPage: 1,
                limit: 10,
                offset: 0,
                result: 1,
                total: 1,
                totalPage: 1,
              });
              expect(res.body.result[0]._id).to.be.eql(referral._id.toString());
              expect(res.body.result[0].status).to.be.eql(multipleFilters.status);
              expect(res.body.result[0].referrerId).to.be.eql(
                multipleFilters.referrerId.toString(),
              );
              expect(res.body.result[0].reward.status).to.be.eql(multipleFilters.rewardStatus);
              expect(res.body.result[0].reward.amount).to.be.eql(multipleFilters.rewardAmount);
              done();
            });
        });
      });

      context('when no parameter is matched', () => {
        const nonMatchingFilters = {
          status: REFERRAL_STATUS.SENT,
          referrerId: mongoose.Types.ObjectId(),
          rewardAmount: 44_000,
          rewardStatus: REWARD_STATUS.PENDING,
        };

        itReturnsNoResultWhenNoFilterParameterIsMatched({
          filter: nonMatchingFilters,
          method,
          endpoint,
          user: adminUser,
          useExistingUser: true,
        });
      });

      filterTestForSingleParameter({
        filter: REFERRAL_FILTERS,
        method,
        endpoint,
        user: adminUser,
        dataObject: referral,
        useExistingUser: true,
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
    const referral = ReferralFactory.build({ _id: referralId, referrerId: adminUser._id });

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
    const referral = ReferralFactory.build({ _id: referralId, referrerId: adminUser._id });

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
            expect(res.body.referral.reward.status).to.be.eql(REWARD_STATUS.REFERRAL_PAID);
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
              expect(res.body.success).to.be.eql(false);
              expect(res.body.error.statusCode).to.be.eql(404);
              expect(res.body.error.message).to.be.eql('Referral not found');
              done();
            });
        });
      });
    });
  });
});

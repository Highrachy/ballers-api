import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import querystring from 'querystring';
import { expect, request, sinon } from '../config';
import User from '../../server/models/user.model';
import {
  addUser,
  banUser,
  generateLog,
  generateToken,
  getUserByEmail,
} from '../../server/services/user.service';
import { addProperty } from '../../server/services/property.service';
import UserFactory from '../factories/user.factory';
import PropertyFactory from '../factories/property.factory';
import * as MailService from '../../server/services/mailer.service';
import EMAIL_CONTENT from '../../mailer';
import Upload from '../../server/helpers/uploadImage';
import { addReferral, sendReferralInvite } from '../../server/services/referral.service';
import OfferFactory from '../factories/offer.factory';
import EnquiryFactory from '../factories/enquiry.factory';
import TransactionFactory from '../factories/transaction.factory';
import ReferralFactory from '../factories/referral.factory';
import { addEnquiry } from '../../server/services/enquiry.service';
import { createOffer, acceptOffer } from '../../server/services/offer.service';
import { addTransaction } from '../../server/services/transaction.service';
import {
  itReturnsTheRightPaginationValue,
  itReturnsForbiddenForTokenWithInvalidAccess,
  itReturnsForbiddenForNoToken,
  itReturnsAnErrorWhenServiceFails,
  itReturnsNotFoundForInvalidToken,
  expectsPaginationToReturnTheRightValues,
  futureDate,
  currentDate,
  defaultPaginationResult,
  filterTestForSingleParameter,
  itReturnsNoResultWhenNoFilterParameterIsMatched,
  itReturnAllResultsWhenAnUnknownFilterIsUsed,
  pastDate,
} from '../helpers';
import {
  USER_ROLE,
  VENDOR_STEPS,
  VENDOR_INFO_STATUS,
  COMMENT_STATUS,
  BADGE_ACCESS_LEVEL,
} from '../../server/helpers/constants';
import AddressFactory from '../factories/address.factory';
import VendorFactory from '../factories/vendor.factory';
import { USER_FILTERS } from '../../server/helpers/filters';
import Notification from '../../server/models/notification.model';
import NotificationFactory from '../factories/notification.factory';
import BadgeFactory from '../factories/badge.factory';
import AssignedBadgeFactory from '../factories/assignedBadge.factory';
import { addBadge } from '../../server/services/badge.service';
import { assignBadge } from '../../server/services/assignedBadge.service';
import { slugify } from '../../server/helpers/funtions';

let adminToken;
let userToken;
const adminUser = UserFactory.build(
  {
    role: USER_ROLE.ADMIN,
    activated: true,
    address: { country: 'Nigeria' },
    createdAt: currentDate,
  },
  { generateId: true },
);
const regularUser = UserFactory.build(
  { role: USER_ROLE.USER, activated: true },
  { generateId: true },
);
let sendMailStub;
const sandbox = sinon.createSandbox();

describe('User Controller', () => {
  beforeEach(() => {
    sendMailStub = sandbox.stub(MailService, 'sendMail');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('User Registration', () => {
    beforeEach(async () => {
      adminToken = await addUser(adminUser);
      userToken = await addUser(regularUser);
    });

    describe('Register Route', () => {
      context('with valid data', () => {
        it('returns successful token', (done) => {
          const user = UserFactory.build({ email: 'myemail@mail.com' });
          request()
            .post('/api/v1/user/register')
            .send(user)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Registration successful');
              expect(res.body).to.have.property('token');
              expect(sendMailStub.callCount).to.eq(1);
              expect(sendMailStub).to.have.be.calledWith(
                EMAIL_CONTENT.ACTIVATE_YOUR_ACCOUNT,
                user,
                {
                  link: `http://ballers.ng/activate?token=${res.body.token}`,
                },
              );
              done();
            });
        });
      });

      context('when user registers as a vendor ', () => {
        it('returns successful token', (done) => {
          const vendor = UserFactory.build({ vendor: { companyName: 'Highrachy Investment' } });
          request()
            .post('/api/v1/user/register')
            .send(vendor)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Registration successful');
              expect(res.body).to.have.property('token');
              expect(sendMailStub.callCount).to.eq(1);
              expect(sendMailStub).to.have.be.calledWith(
                EMAIL_CONTENT.ACTIVATE_YOUR_ACCOUNT,
                vendor,
                {
                  link: `http://ballers.ng/activate?token=${res.body.token}`,
                },
              );
              done();
            });
        });
      });

      context('when email exists in the db', () => {
        const user = UserFactory.build({ email: 'myemail@mail.com' });

        beforeEach(async () => {
          await User.create(user);
        });

        context('when email is in lower case', () => {
          it('returns error for an existing email', (done) => {
            request()
              .post('/api/v1/user/register')
              .send(user)
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Email is linked to another account');
                expect(res.body.error).to.be.eql('Email is linked to another account');
                expect(sendMailStub.callCount).to.eq(0);
                done();
              });
          });
        });

        context('when email is in mixed case', () => {
          it('returns error for an existing email', (done) => {
            request()
              .post('/api/v1/user/register')
              .send({ ...user, email: 'MYemail@mail.coM' })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Email is linked to another account');
                expect(res.body.error).to.be.eql('Email is linked to another account');
                expect(sendMailStub.callCount).to.eq(0);
                done();
              });
          });
        });
      });

      context('when user was invited before registering', () => {
        const registeredUserId = mongoose.Types.ObjectId();
        const referralCode = 'RC1234';
        const registeredUser = UserFactory.build({
          _id: registeredUserId,
          referralCode,
        });
        const email = 'newuser@mail.com';
        const user = UserFactory.build({ email, referralCode });
        before(async () => {
          await User.create(registeredUser);
          await sendReferralInvite({ email, referrerId: registeredUserId });
        });
        it('returns successful token', (done) => {
          request()
            .post('/api/v1/user/register')
            .send(user)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Registration successful');
              expect(res.body).to.have.property('token');
              expect(sendMailStub.callCount).to.eq(1);
              done();
            });
        });
      });

      context('with invalid data', () => {
        context('when firstName is empty', () => {
          it('returns an error', (done) => {
            const user = UserFactory.build({ firstName: '' });
            request()
              .post('/api/v1/user/register')
              .send(user)
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('"First Name" is not allowed to be empty');
                expect(sendMailStub.callCount).to.eq(0);
                done();
              });
          });
        });

        context('when lastName is empty', () => {
          it('returns an error', (done) => {
            const user = UserFactory.build({ lastName: '' });
            request()
              .post('/api/v1/user/register')
              .send(user)
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('"Last Name" is not allowed to be empty');
                expect(sendMailStub.callCount).to.eq(0);
                done();
              });
          });
        });

        context('when email is empty', () => {
          it('returns an error', (done) => {
            const user = UserFactory.build({ email: '' });
            request()
              .post('/api/v1/user/register')
              .send(user)
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

        context('with invalid email address', () => {
          it('returns an error', (done) => {
            const user = UserFactory.build({ email: 'wrong-email' });
            request()
              .post('/api/v1/user/register')
              .send(user)
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('"Email Address" must be a valid email');
                expect(sendMailStub.callCount).to.eq(0);
                done();
              });
          });
        });

        context('when password is empty', () => {
          it('returns an error', (done) => {
            const user = UserFactory.build({ password: '' });
            request()
              .post('/api/v1/user/register')
              .send(user)
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('"Password" is not allowed to be empty');
                expect(sendMailStub.callCount).to.eq(0);
                done();
              });
          });
        });

        context('when password is weak', () => {
          it('returns an error', (done) => {
            const user = UserFactory.build({ password: '123' });
            request()
              .post('/api/v1/user/register')
              .send(user)
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql(
                  '"Password" length must be at least 6 characters long',
                );
                expect(sendMailStub.callCount).to.eq(0);
                done();
              });
          });
        });

        context('when confirm password is empty', () => {
          it('returns an error', (done) => {
            const user = UserFactory.build({ confirmPassword: '' });
            request()
              .post('/api/v1/user/register')
              .send(user)
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('Password does not match');
                expect(sendMailStub.callCount).to.eq(0);
                done();
              });
          });
        });

        context('when confirm password is not equal to password', () => {
          it('returns an error', (done) => {
            const user = UserFactory.build({ password: '123456', confirmPassword: '000000' });
            request()
              .post('/api/v1/user/register')
              .send(user)
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('Password does not match');
                expect(sendMailStub.callCount).to.eq(0);
                done();
              });
          });
        });
      });

      context('when phone number is empty', () => {
        it('registers error', (done) => {
          const user = UserFactory.build({ phone: '' });
          request()
            .post('/api/v1/user/register')
            .send(user)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Registration successful');
              expect(res.body).to.have.property('token');
              expect(sendMailStub.callCount).to.eq(1);
              done();
            });
        });
      });

      context('when phone number is not given', () => {
        it('returns an error', (done) => {
          const user = UserFactory.build();
          delete user.phone;
          request()
            .post('/api/v1/user/register')
            .send(user)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Registration successful');
              expect(res.body).to.have.property('token');
              expect(sendMailStub.callCount).to.eq(1);
              done();
            });
        });
      });

      context('when phone number is less than 6 digits', () => {
        it('returns an error', (done) => {
          const user = UserFactory.build({ phone: '12345' });
          request()
            .post('/api/v1/user/register')
            .send(user)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.error).to.be.eql('"Phone" length must be at least 6 characters long');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when phone number is more than 14 digits', () => {
        it('returns an error', (done) => {
          const user = UserFactory.build({ phone: '123456789012345' });
          request()
            .post('/api/v1/user/register')
            .send(user)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.error).to.be.eql(
                '"Phone" length must be less than or equal to 14 characters long',
              );
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });
    });

    describe('Login Route', () => {
      describe('when the user has been activated', () => {
        const userLogin = { email: 'myemail@mail.com', password: '123456' };
        const user = UserFactory.build({ ...userLogin, activated: true });
        beforeEach(async () => {
          await addUser(user);
        });

        context('when email is in lower case', () => {
          it('returns successful payload', (done) => {
            request()
              .post('/api/v1/user/login')
              .send(userLogin)
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.message).to.be.eql('Login successful');
                expect(res.body.user.firstName).to.be.eql(user.firstName);
                expect(res.body.user.lastName).to.be.eql(user.lastName);
                expect(res.body.user.email).to.be.eql(user.email);
                expect(res.body.user).to.have.property('token');
                done();
              });
          });
        });

        context('when email is in mixed case', () => {
          it('returns successful payload', (done) => {
            request()
              .post('/api/v1/user/login')
              .send({ email: 'MyEMail@mail.coM', password: '123456' })
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.message).to.be.eql('Login successful');
                expect(res.body.user.firstName).to.be.eql(user.firstName);
                expect(res.body.user.lastName).to.be.eql(user.lastName);
                expect(res.body.user.email).to.be.eql(user.email);
                expect(res.body.user).to.have.property('token');
                done();
              });
          });
        });

        context('with empty email', () => {
          it('returns error', (done) => {
            request()
              .post('/api/v1/user/login')
              .send({ ...userLogin, email: '' })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('"Email Address" is not allowed to be empty');
                done();
              });
          });
        });

        context('with empty password', () => {
          it('returns error', (done) => {
            request()
              .post('/api/v1/user/login')
              .send({ ...userLogin, password: '' })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('"Password" is not allowed to be empty');
                done();
              });
          });
        });

        context('when login service returns an error', () => {
          it('returns the error', (done) => {
            sinon.stub(User, 'findOne').throws(new Error('Type Error'));
            request()
              .post('/api/v1/user/login')
              .send(userLogin)
              .end((err, res) => {
                expect(res).to.have.status(500);
                expect(res.body.success).to.be.eql(false);
                done();
                User.findOne.restore();
              });
          });
        });

        context('when compare error returns an error', () => {
          it('returns the error', (done) => {
            sinon.stub(bcrypt, 'compare').throws(new Error('testing'));
            request()
              .post('/api/v1/user/login')
              .send(userLogin)
              .end((err, res) => {
                expect(res).to.have.status(500);
                expect(res.body.success).to.be.eql(false);
                done();
                bcrypt.compare.restore();
              });
          });
        });
      });

      describe('when the user has not activated', () => {
        const userLogin = { email: 'myemail@mail.com', password: '123456' };
        const user = UserFactory.build({ ...userLogin, activated: false });
        beforeEach(async () => {
          await addUser(user);
        });

        context('with valid data', () => {
          it('returns successful payload', (done) => {
            request()
              .post('/api/v1/user/login')
              .send(userLogin)
              .end((err, res) => {
                expect(res).to.have.status(401);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Your account needs to be activated.');
                expect(res.body.error).to.be.eql('Your account needs to be activated.');
                done();
              });
          });
        });
      });
    });

    describe('Activate User Route', () => {
      let token;
      const user = UserFactory.build({ activated: false });

      beforeEach(async () => {
        token = await addUser(user);
      });
      context('with a valid token', () => {
        it('returns successful payload', (done) => {
          request()
            .get(`/api/v1/user/activate?token=${token}`)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.user.firstName).to.be.eql(user.firstName);
              expect(res.body.user.lastName).to.be.eql(user.lastName);
              expect(res.body.user.email).to.be.eql(user.email);
              expect(res.body.user.activated).to.be.eql(true);
              expect(res.body.user.token).to.be.eql(token);
              expect(res.body.user).to.have.property('activationDate');
              expect(sendMailStub.callCount).to.eq(1);
              expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.WELCOME_MESSAGE);
              done();
            });
        });
      });

      context('with an invalid token', () => {
        it('returns successful payload', (done) => {
          request()
            .get(`/api/v1/user/activate?token=${token}1234a56`)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });
    });

    describe('Generate a Password Reset Link', () => {
      const email = 'myemail@mail.com';
      const user = UserFactory.build({ email });

      beforeEach(async () => {
        await addUser(user);
      });

      context('with a valid token', () => {
        it('returns successful payload', (done) => {
          request()
            .post('/api/v1/user/reset-password')
            .send({ email })
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql(
                'A password reset link has been sent to your email account',
              );
              expect(sendMailStub.callCount).to.eq(1);
              expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.RESET_PASSWORD_LINK);
              done();
            });
        });
      });

      context('with an invalid email', () => {
        it('returns successful payload', (done) => {
          request()
            .post('/api/v1/user/reset-password')
            .send({ email: 'invalid@email.com' })
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Your email address is not found.');
              expect(res.body.error).to.be.eql('Your email address is not found.');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });
    });

    describe('Change Password from Reset Link', () => {
      let token;
      const password = '123@ABC';
      const confirmPassword = '123@ABC';
      const user = UserFactory.build();

      beforeEach(async () => {
        token = await addUser(user);
      });

      context('with a valid token', () => {
        it('returns successful payload', (done) => {
          request()
            .post(`/api/v1/user/change-password/${token}`)
            .send({ password, confirmPassword })
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Your password has been successfully changed');
              expect(sendMailStub.callCount).to.eq(1);
              expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.CHANGED_PASSWORD);
              done();
            });
        });
      });

      context('when password is empty', () => {
        it('returns an error', (done) => {
          request()
            .post(`/api/v1/user/change-password/${token}`)
            .send({ password: '', confirmPassword })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Password" is not allowed to be empty');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when password is weak', () => {
        it('returns an error', (done) => {
          request()
            .post(`/api/v1/user/change-password/${token}`)
            .send({ password: '123', confirmPassword })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql(
                '"Password" length must be at least 6 characters long',
              );
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when confirm password is empty', () => {
        it('returns an error', (done) => {
          request()
            .post(`/api/v1/user/change-password/${token}`)
            .send({ password, confirmPassword: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('Password does not match');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when confirm password is not equal to password', () => {
        it('returns an error', (done) => {
          request()
            .post(`/api/v1/user/change-password/${token}`)
            .send({ password, confirmPassword: '000000' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('Password does not match');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('with invalid token', () => {
        it('returns an error', (done) => {
          request()
            .post(`/api/v1/user/change-password/123456`)
            .send({ password, confirmPassword })
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('User not found');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });
    });

    describe('Current User', () => {
      const method = 'get';
      const endpoint = '/api/v1/user/who-am-i';

      const userNotification1 = NotificationFactory.build(
        { userId: regularUser._id, read: false, createdAt: pastDate },
        { generateId: true },
      );

      const userNotification2 = NotificationFactory.build(
        { userId: regularUser._id, read: true, createdAt: currentDate },
        { generateId: true },
      );

      const userNotification3 = NotificationFactory.build(
        { userId: regularUser._id, read: false, createdAt: futureDate },
        { generateId: true },
      );

      const adminNotification = NotificationFactory.build(
        { userId: adminUser._id, read: false, createdAt: currentDate },
        { generateId: true },
      );

      beforeEach(async () => {
        await Notification.insertMany([
          userNotification1,
          userNotification2,
          userNotification3,
          adminNotification,
        ]);
      });

      context('with valid token', () => {
        it('returns a valid user', (done) => {
          request()
            .get('/api/v1/user/who-am-i')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.user.firstName).to.be.eql(regularUser.firstName);
              expect(res.body.user.lastName).to.be.eql(regularUser.lastName);
              expect(res.body.user.email).to.be.eql(regularUser.email);
              expect(res.body.user.notifications.length).to.be.eql(3);
              expect(res.body.user.notifications[0]._id).to.be.eql(
                userNotification3._id.toString(),
              );
              expect(res.body.user.notifications[0].read).to.be.eql(false);
              expect(res.body.user.notifications[1]._id).to.not.eql(
                userNotification2._id.toString(),
              );
              expect(res.body.user.notifications[2]._id).to.be.eql(
                userNotification1._id.toString(),
              );
              expect(res.body.user.notifications[2].read).to.be.eql(false);
              expect(res.body.user).to.not.have.property('password');
              done();
            });
        });
      });

      itReturnsForbiddenForNoToken({ endpoint, method });

      itReturnsAnErrorWhenServiceFails({
        endpoint,
        method,
        user: regularUser,
        model: User,
        modelMethod: 'aggregate',
        useExistingUser: true,
      });

      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user: regularUser,
        userId: regularUser._id,
        useExistingUser: true,
      });

      context('when a user is banned', () => {
        beforeEach(async () => {
          await banUser({
            adminId: adminUser._id,
            userId: regularUser._id,
            reason: 'Fake Certificate',
          });
        });
        it('returns unauthorized', (done) => {
          request()
            .get('/api/v1/user/who-am-i')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(401);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql(
                'Your account has been locked. Kindly contact Ballers Support for more information',
              );
              done();
            });
        });
      });
    });

    describe('Update User route', () => {
      const newUser = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '08012345678',
        profileImage: 'https://ballers.ng/image.png',
      };

      context('with valid token', () => {
        it('returns a updated user', (done) => {
          request()
            .put('/api/v1/user/update')
            .set('authorization', userToken)
            .send(newUser)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.user.firstName).to.be.eql(newUser.firstName);
              expect(res.body.user.lastName).to.be.eql(newUser.lastName);
              expect(res.body.user.phone).to.be.eql(newUser.phone);
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .put('/api/v1/user/update')
            .send(newUser)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when update service returns an error', () => {
        it('returns the error', (done) => {
          sinon.stub(User, 'findOneAndUpdate').throws(new Error('Type Error'));
          request()
            .put('/api/v1/user/update')
            .set('authorization', userToken)
            .send(newUser)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body.success).to.be.eql(false);
              done();
              User.findOneAndUpdate.restore();
            });
        });
      });

      context('with invalid data', () => {
        context('when first name is empty', () => {
          it('returns an error', (done) => {
            const invalidUser = UserFactory.build({ firstName: '' });
            request()
              .put('/api/v1/user/update')
              .set('authorization', userToken)
              .send(invalidUser)
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('"First Name" is not allowed to be empty');
                done();
              });
          });
        });

        context('when profile image is empty', () => {
          it('returns an error', (done) => {
            const invalidUser = UserFactory.build({ profileImage: '' });
            request()
              .put('/api/v1/user/update')
              .set('authorization', userToken)
              .send(invalidUser)
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('"Profile Image" is not allowed to be empty');
                done();
              });
          });
        });

        context('when preferences house type is empty', () => {
          it('returns an error', (done) => {
            const invalidUser = UserFactory.build({ preferences: { houseType: '' } });
            request()
              .put('/api/v1/user/update')
              .set('authorization', userToken)
              .send(invalidUser)
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql(
                  '"Property House Type" is not allowed to be empty',
                );
                done();
              });
          });
        });
        context('when preferences location is empty', () => {
          it('returns an error', (done) => {
            const invalidUser = UserFactory.build({ preferences: { location: '' } });
            request()
              .put('/api/v1/user/update')
              .set('authorization', userToken)
              .send(invalidUser)
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('"Property Location" is not allowed to be empty');
                done();
              });
          });
        });
        context('when preferences max price is empty', () => {
          it('returns an error', (done) => {
            const invalidUser = UserFactory.build({ preferences: { maxPrice: '' } });
            request()
              .put('/api/v1/user/update')
              .set('authorization', userToken)
              .send(invalidUser)
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('"Property Maximum Price" must be a number');
                done();
              });
          });
        });
        context('when preferences min price is empty', () => {
          it('returns an error', (done) => {
            const invalidUser = UserFactory.build({ preferences: { minPrice: '' } });
            request()
              .put('/api/v1/user/update')
              .set('authorization', userToken)
              .send(invalidUser)
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('"Property Minimum Price" must be a number');
                done();
              });
          });
        });
      });

      context('when user tries to update bank info', () => {
        it('updates account details', (done) => {
          const data = {
            additionalInfo: {
              bankInfo: {
                accountNumber: '1234567890',
                accountName: 'Highrachy Investment Limited',
                bankName: 'ABC Bank',
              },
            },
          };
          request()
            .put('/api/v1/user/update')
            .set('authorization', userToken)
            .send(data)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('User updated');
              expect(res.body.user._id).to.be.eql(regularUser._id.toString());
              expect(res.body.user.additionalInfo.bankInfo).to.be.eql(data.additionalInfo.bankInfo);
              done();
            });
        });
      });
    });

    describe('Add property to favorite route', () => {
      const vendorUser = UserFactory.build(
        {
          role: USER_ROLE.VENDOR,
          activated: true,
        },
        { generateId: true },
      );
      const property = PropertyFactory.build({ addedBy: vendorUser._id }, { generateId: true });

      beforeEach(async () => {
        await addUser(vendorUser);
        await addProperty(property);
      });

      const favorite = {
        propertyId: property._id,
      };

      context('with right details', () => {
        it('returns property added to favorites', (done) => {
          request()
            .post('/api/v1/user/add-to-favorites')
            .set('authorization', userToken)
            .send(favorite)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Property added to favorites');
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .post('/api/v1/user/add-to-favorites')
            .send(favorite)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('with invalid property id sent', () => {
        it('returns a validation error', (done) => {
          request()
            .post('/api/v1/user/add-to-favorites')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              done();
            });
        });
      });

      context('when addPropertyToFavorites service returns an error', () => {
        it('returns the error', (done) => {
          sinon.stub(User, 'findByIdAndUpdate').throws(new Error('Type Error'));
          request()
            .post('/api/v1/user/add-to-favorites')
            .set('authorization', userToken)
            .send(favorite)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body.success).to.be.eql(false);
              done();
              User.findByIdAndUpdate.restore();
            });
        });
      });
    });

    describe('Remove property from favorite route', () => {
      const propertyId = mongoose.Types.ObjectId();

      const favorite = {
        propertyId,
      };

      context('with right details', () => {
        it('returns property added to favorites', (done) => {
          request()
            .post('/api/v1/user/remove-favorite')
            .set('authorization', userToken)
            .send(favorite)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Property removed from favorites');
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .post('/api/v1/user/remove-favorite')
            .send(favorite)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('with invalid property id sent', () => {
        it('returns a validation error', (done) => {
          request()
            .post('/api/v1/user/remove-favorite')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              done();
            });
        });
      });

      context('when removePropertyFromFavorites service returns an error', () => {
        it('returns the error', (done) => {
          sinon.stub(User, 'findByIdAndUpdate').throws(new Error('Type Error'));
          request()
            .post('/api/v1/user/remove-favorite')
            .set('authorization', userToken)
            .send(favorite)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body.success).to.be.eql(false);
              done();
              User.findByIdAndUpdate.restore();
            });
        });
      });
    });

    describe('Upload User Profile', () => {
      let token;
      const user = UserFactory.build();

      beforeEach(async () => {
        token = await addUser(user);
        sinon.stub(Upload, 'uploadImage').callsFake((req, res, next) => {
          req.body = { title: 'testing' };
          req.files = { filename: 'test', url: 'urltest' };
          return next();
        });
      });

      context('with valid token', () => {
        it('returns an updated image profile', (done) => {
          request()
            .post('/api/v1/user/profile-image')
            .set('authorization', token)
            .set('Content-type', 'application/x-www-form-urlendcoded')
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              done();
            });
        });
      });
    });

    describe('Account Overview', () => {
      const vendor = UserFactory.build(
        { role: USER_ROLE.VENDOR, activated: true },
        { generateId: true },
      );
      const property = PropertyFactory.build(
        { addedBy: vendor._id, price: 20_000_000 },
        { generateId: true },
      );
      const referral = ReferralFactory.build(
        {
          referrerId: regularUser._id,
          reward: { amount: 50_000 },
          accumulatedReward: { total: 40_000 },
        },
        { generateId: true },
      );
      const referral2 = ReferralFactory.build(
        {
          referrerId: regularUser._id,
          accumulatedReward: { total: 100_000 },
        },
        { generateId: true },
      );

      const enquiry = EnquiryFactory.build(
        { userId: regularUser._id, propertyId: property._id },
        { generateId: true },
      );
      const offer = OfferFactory.build(
        {
          enquiryId: enquiry._id,
          vendorId: vendor._id,
          userId: regularUser._id,
          totalAmountPayable: 19_000_000,
        },
        { generateId: true },
      );
      const transaction = TransactionFactory.build(
        {
          propertyId: property._id,
          userId: regularUser._id,
          addedBy: adminUser._id,
          updatedBy: adminUser._id,
          offerId: offer._id,
          amount: 250_000,
        },
        { generateId: true },
      );

      beforeEach(async () => {
        await addUser(vendor);
      });

      context('with valid token', () => {
        it('returns contribution reward of zero', (done) => {
          request()
            .get('/api/v1/user/account-overview')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.accountOverview.contributionReward).to.be.eql(0);
              expect(res.body.accountOverview.totalAmountPaid).to.be.eql(0);
              expect(res.body.accountOverview.referralRewards).to.be.eql(0);
              done();
            });
        });
      });

      describe('when offer has been accepted', () => {
        beforeEach(async () => {
          await addReferral(referral);
          await addReferral(referral2);
          await addProperty(property);
          await addEnquiry(enquiry);
          await createOffer(offer);
          await addTransaction(transaction);
          await acceptOffer({
            user: regularUser,
            offerId: offer._id,
            signature: 'https://ballers.ng/signature.png',
          });
        });

        context('with valid token', () => {
          it('returns a valid contribution reward', (done) => {
            request()
              .get('/api/v1/user/account-overview')
              .set('authorization', userToken)
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.accountOverview.contributionReward).to.be.eql(
                  property.price - offer.totalAmountPayable,
                );
                expect(res.body.accountOverview.totalAmountPaid).to.be.eql(transaction.amount);
                expect(res.body.accountOverview.referralRewards).to.be.eql(
                  referral.accumulatedReward.total + referral2.accumulatedReward.total,
                );
                done();
              });
          });
        });

        context('with no token', () => {
          it('returns a forbidden error', (done) => {
            request()
              .get('/api/v1/user/account-overview')
              .end((err, res) => {
                expect(res).to.have.status(403);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Token needed to access resources');
                done();
              });
          });
        });

        context('with invalid token', () => {
          it('returns an authorization error', (done) => {
            request()
              .get('/api/v1/user/account-overview')
              .set('authorization', 'invalid-token')
              .end((err, res) => {
                expect(res).to.have.status(401);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Authentication Failed');
                done();
              });
          });
        });
      });
    });

    describe('Upgrade User to content editor', () => {
      const userInfo = { userId: regularUser._id };
      context('with valid token', () => {
        it('returns a upgraded user', (done) => {
          request()
            .put('/api/v1/user/editor/upgrade')
            .set('authorization', adminToken)
            .send(userInfo)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('User is now a Content Editor');
              expect(res.body.user.role).to.be.eql(3);
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .put('/api/v1/user/editor/upgrade')
            .send(userInfo)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when non admin token is used', () => {
        it('returns forbidden error', (done) => {
          request()
            .put('/api/v1/user/editor/upgrade')
            .set('authorization', userToken)
            .send(userInfo)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('You are not permitted to perform this action');
              done();
            });
        });
      });

      context('when findByIdAndUpdate returns an error', () => {
        it('returns the error', (done) => {
          sinon.stub(User, 'findByIdAndUpdate').throws(new Error('Type Error'));
          request()
            .put('/api/v1/user/editor/upgrade')
            .set('authorization', adminToken)
            .send(userInfo)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body.success).to.be.eql(false);
              done();
              User.findByIdAndUpdate.restore();
            });
        });
      });

      context('with invalid data', () => {
        context('when user id is empty', () => {
          it('returns an error', (done) => {
            request()
              .put('/api/v1/user/editor/upgrade')
              .set('authorization', adminToken)
              .send({ userId: '' })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('"User id" is not allowed to be empty');
                done();
              });
          });
        });
      });
    });

    describe('Downgrade Content editor to user', () => {
      const userInfo = { userId: regularUser._id };
      context('with valid token', () => {
        it('returns a upgraded user', (done) => {
          request()
            .put('/api/v1/user/editor/downgrade')
            .set('authorization', adminToken)
            .send(userInfo)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Content Editor is now a User');
              expect(res.body.user.role).to.be.eql(1);
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .put('/api/v1/user/editor/downgrade')
            .send(userInfo)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when non admin token is used', () => {
        it('returns forbidden error', (done) => {
          request()
            .put('/api/v1/user/editor/downgrade')
            .set('authorization', userToken)
            .send(userInfo)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('You are not permitted to perform this action');
              done();
            });
        });
      });

      context('when findByIdAndUpdate returns an error', () => {
        it('returns the error', (done) => {
          sinon.stub(User, 'findByIdAndUpdate').throws(new Error('Type Error'));
          request()
            .put('/api/v1/user/editor/downgrade')
            .set('authorization', adminToken)
            .send(userInfo)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body.success).to.be.eql(false);
              done();
              User.findByIdAndUpdate.restore();
            });
        });
      });

      context('with invalid data', () => {
        context('when user id is empty', () => {
          it('returns an error', (done) => {
            request()
              .put('/api/v1/user/editor/downgrade')
              .set('authorization', adminToken)
              .send({ userId: '' })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('"User id" is not allowed to be empty');
                done();
              });
          });
        });
      });
    });

    describe('Verify vendor', () => {
      const vendorId = mongoose.Types.ObjectId();
      const vendorUser = UserFactory.build({
        _id: vendorId,
        role: USER_ROLE.VENDOR,
        activated: true,
        vendor: {
          verification: {
            companyInfo: {
              status: VENDOR_INFO_STATUS.VERIFIED,
            },
            bankDetails: {
              status: VENDOR_INFO_STATUS.VERIFIED,
            },
            directorInfo: {
              status: VENDOR_INFO_STATUS.VERIFIED,
            },
            documentUpload: {
              status: VENDOR_INFO_STATUS.VERIFIED,
            },
          },
        },
      });
      const invalidUserId = mongoose.Types.ObjectId();
      const invalidUser = UserFactory.build({ _id: invalidUserId });
      const endpoint = '/api/v1/user/vendor/verify';
      const method = 'put';

      const data = { vendorId };

      beforeEach(async () => {
        await addUser(vendorUser);
      });

      context('with valid token', () => {
        it('returns a verified vendor', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send(data)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Vendor verified');
              expect(res.body.vendor.vendor.verified).to.be.eql(true);
              expect(res.body.vendor.vendor.verifiedBy).to.be.eql(adminUser._id.toString());
              expect(sendMailStub.callCount).to.eq(1);
              expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.VERIFY_VENDOR);
              done();
            });
        });
      });

      context('when vendor step has not been verified', () => {
        const unVerifiedVendorId = mongoose.Types.ObjectId();
        const unVerifiedVendor = UserFactory.build({
          _id: unVerifiedVendorId,
          role: USER_ROLE.VENDOR,
          activated: true,
          vendor: {
            verification: {
              companyInfo: {
                status: VENDOR_INFO_STATUS.PENDING,
              },
              bankDetails: {
                status: VENDOR_INFO_STATUS.VERIFIED,
              },
              directorInfo: {
                status: VENDOR_INFO_STATUS.VERIFIED,
              },
              documentUpload: {
                status: VENDOR_INFO_STATUS.VERIFIED,
              },
            },
          },
        });

        beforeEach(async () => {
          await addUser(unVerifiedVendor);
        });

        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ vendorId: unVerifiedVendorId })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('companyInfo has not been verified');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      itReturnsForbiddenForNoToken({ endpoint, method, data });
      itReturnsForbiddenForTokenWithInvalidAccess({ endpoint, method, user: invalidUser, data });
      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user: invalidUser,
        userId: invalidUserId,
        data,
      });

      context('when findByIdAndUpdate returns an error', () => {
        it('returns the error', (done) => {
          sinon.stub(User, 'findByIdAndUpdate').throws(new Error('Type Error'));
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send(data)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body.success).to.be.eql(false);
              expect(sendMailStub.callCount).to.eq(0);
              done();
              User.findByIdAndUpdate.restore();
            });
        });
      });

      context('with invalid data', () => {
        context('when user id is empty', () => {
          it('returns an error', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send({ vendorId: '' })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('"Vendor id" is not allowed to be empty');
                expect(sendMailStub.callCount).to.eq(0);
                done();
              });
          });
        });
      });
    });

    describe('Verify vendor step', () => {
      const vendorUser = UserFactory.build(
        {
          role: USER_ROLE.VENDOR,
          activated: true,
          vendor: {
            verification: {
              companyInfo: {
                status: VENDOR_INFO_STATUS.PENDING,
                comments: [
                  {
                    status: COMMENT_STATUS.PENDING,
                    _id: mongoose.Types.ObjectId(),
                    comment: 'sample comment 1',
                    addedBy: adminUser._id,
                  },
                  {
                    status: COMMENT_STATUS.PENDING,
                    _id: mongoose.Types.ObjectId(),
                    comment: 'sample comment 2',
                    addedBy: adminUser._id,
                  },
                ],
              },
              bankDetails: {
                status: VENDOR_INFO_STATUS.PENDING,
                comments: [
                  {
                    status: COMMENT_STATUS.PENDING,
                    _id: mongoose.Types.ObjectId(),
                    comment: 'sample comment 1',
                    addedBy: adminUser._id,
                  },
                  {
                    status: COMMENT_STATUS.PENDING,
                    _id: mongoose.Types.ObjectId(),
                    comment: 'sample comment 2',
                    addedBy: adminUser._id,
                  },
                ],
              },
              documentUpload: {
                status: VENDOR_INFO_STATUS.PENDING,
                comments: [
                  {
                    status: COMMENT_STATUS.PENDING,
                    _id: mongoose.Types.ObjectId(),
                    comment: 'sample comment 1',
                    addedBy: adminUser._id,
                  },
                  {
                    status: COMMENT_STATUS.PENDING,
                    _id: mongoose.Types.ObjectId(),
                    comment: 'sample comment 2',
                    addedBy: adminUser._id,
                  },
                ],
              },
              directorInfo: {
                status: VENDOR_INFO_STATUS.PENDING,
                comments: [
                  {
                    status: COMMENT_STATUS.PENDING,
                    _id: mongoose.Types.ObjectId(),
                    comment: 'sample comment 1',
                    addedBy: adminUser._id,
                  },
                  {
                    status: COMMENT_STATUS.PENDING,
                    _id: mongoose.Types.ObjectId(),
                    comment: 'sample comment 2',
                    addedBy: adminUser._id,
                  },
                ],
              },
            },
          },
        },
        { generateId: true },
      );
      const invalidUserId = mongoose.Types.ObjectId();
      const invalidUser = UserFactory.build({ _id: invalidUserId });
      const endpoint = '/api/v1/user/vendor/verify/step';
      const method = 'put';

      const data = { vendorId: vendorUser._id };

      beforeEach(async () => {
        await addUser(vendorUser);
      });

      context('when a valid token is used', () => {
        VENDOR_STEPS.map((step) =>
          it('returns verified step', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send({ ...data, step })
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.message).to.be.eql('Vendor information verified');
                expect(res.body.vendor._id).to.be.eql(vendorUser._id.toString());
                expect(res.body.vendor.vendor.verification[step].status).to.be.eql('Verified');
                expect(res.body.vendor.vendor.verification[step].verifiedBy).to.be.eql(
                  adminUser._id.toString(),
                );
                expect(res.body.vendor.vendor.verification[step].comments[0].status).to.be.eql(
                  'Resolved',
                );
                expect(res.body.vendor.vendor.verification[step].comments[1].status).to.be.eql(
                  'Resolved',
                );
                done();
              });
          }),
        );
      });

      itReturnsForbiddenForNoToken({
        endpoint,
        method,
        data: { ...data, status: VENDOR_STEPS[0] },
      });
      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user: invalidUser,
        data: {
          ...data,
          status: VENDOR_STEPS[0],
        },
      });
      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user: invalidUser,
        userId: invalidUserId,
        data: {
          ...data,
          status: VENDOR_STEPS[0],
        },
      });

      context('when findByIdAndUpdate returns an error', () => {
        VENDOR_STEPS.map((step) =>
          it('returns the error', (done) => {
            sinon.stub(User, 'findByIdAndUpdate').throws(new Error('Type Error'));
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send({ ...data, step })
              .end((err, res) => {
                expect(res).to.have.status(400);
                expect(res.body.success).to.be.eql(false);
                done();
                User.findByIdAndUpdate.restore();
              });
          }),
        );
      });

      context('with invalid data', () => {
        context('when step is empty', () => {
          it('returns an error', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send({ ...data, step: '' })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql(
                  '"Step" must be one of [companyInfo, bankDetails, directorInfo, documentUpload]',
                );
                done();
              });
          });
        });

        context('when step contains incorrect value', () => {
          it('returns an error', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send({ ...data, step: 'randomtext' })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql(
                  '"Step" must be one of [companyInfo, bankDetails, directorInfo, documentUpload]',
                );
                done();
              });
          });
        });

        context('when vendor id is empty', () => {
          VENDOR_STEPS.map((step) =>
            it('returns an error', (done) => {
              request()
                [method](endpoint)
                .set('authorization', adminToken)
                .send({ vendorId: '', step })
                .end((err, res) => {
                  expect(res).to.have.status(412);
                  expect(res.body.success).to.be.eql(false);
                  expect(res.body.message).to.be.eql('Validation Error');
                  expect(res.body.error).to.be.eql('"Vendor id" is not allowed to be empty');
                  done();
                });
            }),
          );
        });
      });
    });

    describe('Add comment to vendor info', () => {
      const vendorId = mongoose.Types.ObjectId();
      const vendorUser = UserFactory.build({
        _id: vendorId,
        role: USER_ROLE.VENDOR,
        activated: true,
      });
      const invalidUserId = mongoose.Types.ObjectId();
      const invalidUser = UserFactory.build({ _id: invalidUserId });
      const endpoint = '/api/v1/user/vendor/verify/comment';
      const method = 'put';

      const data = { vendorId, comment: 'sample comment 1' };

      beforeEach(async () => {
        await addUser(vendorUser);
      });

      context('when a valid token is used', () => {
        VENDOR_STEPS.map((step) =>
          it('returns verified step', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send({ ...data, step })
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.message).to.be.eql('Comment added');
                expect(res.body.vendor.vendor.verification[step].status).to.be.eql('Pending');
                expect(res.body.vendor.vendor.verification[step].comments[0].comment).to.be.eql(
                  data.comment,
                );
                expect(res.body.vendor.vendor.verification[step].comments[0].addedBy).to.be.eql(
                  adminUser._id.toString(),
                );
                done();
              });
          }),
        );
      });

      itReturnsForbiddenForNoToken({
        endpoint,
        method,
        data: { ...data, status: VENDOR_STEPS[0] },
      });
      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user: invalidUser,
        data: {
          ...data,
          status: VENDOR_STEPS[0],
        },
      });
      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user: invalidUser,
        userId: invalidUserId,
        data: {
          ...data,
          status: VENDOR_STEPS[0],
        },
      });

      context('when findByIdAndUpdate returns an error', () => {
        VENDOR_STEPS.map((step) =>
          it('returns the error', (done) => {
            sinon.stub(User, 'findByIdAndUpdate').throws(new Error('Type Error'));
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send({ ...data, step })
              .end((err, res) => {
                expect(res).to.have.status(400);
                expect(res.body.success).to.be.eql(false);
                done();
                User.findByIdAndUpdate.restore();
              });
          }),
        );
      });

      context('with invalid data', () => {
        context('when step is empty', () => {
          it('returns an error', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send({ ...data, step: '' })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql(
                  '"Step" must be one of [companyInfo, bankDetails, directorInfo, documentUpload]',
                );
                done();
              });
          });
        });

        context('when step contains incorrect value', () => {
          it('returns an error', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send({ ...data, step: 'randomtext' })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql(
                  '"Step" must be one of [companyInfo, bankDetails, directorInfo, documentUpload]',
                );
                done();
              });
          });
        });

        context('when vendor id is empty', () => {
          VENDOR_STEPS.map((step) =>
            it('returns an error', (done) => {
              request()
                [method](endpoint)
                .set('authorization', adminToken)
                .send({ vendorId: '', step })
                .end((err, res) => {
                  expect(res).to.have.status(412);
                  expect(res.body.success).to.be.eql(false);
                  expect(res.body.message).to.be.eql('Validation Error');
                  expect(res.body.error).to.be.eql('"Vendor id" is not allowed to be empty');
                  done();
                });
            }),
          );
        });
      });
    });

    describe('Resolve verification step comment', () => {
      const generateComments = (step) =>
        [...new Array(2)].map((_, index) => ({
          status: COMMENT_STATUS.PENDING,
          _id: mongoose.Types.ObjectId(),
          comment: `${step} comment ${index}`,
          addedBy: adminUser._id,
        }));

      const vendorUser = UserFactory.build(
        {
          role: USER_ROLE.VENDOR,
          activated: true,
          vendor: {
            verification: {
              companyInfo: {
                status: VENDOR_INFO_STATUS.PENDING,
                comments: generateComments('companyInfo'),
              },
              bankDetails: {
                status: VENDOR_INFO_STATUS.PENDING,
                comments: generateComments('bankDetails'),
              },
              documentUpload: {
                status: VENDOR_INFO_STATUS.PENDING,
                comments: generateComments('documentUpload'),
              },
              directorInfo: {
                status: VENDOR_INFO_STATUS.PENDING,
                comments: generateComments('directorInfo'),
              },
            },
          },
        },
        { generateId: true },
      );
      const invalidUserId = mongoose.Types.ObjectId();
      const invalidUser = UserFactory.build({ _id: invalidUserId });
      const endpoint = '/api/v1/user/vendor/verify/comment/resolve';
      const method = 'put';

      const data = { vendorId: vendorUser._id };

      beforeEach(async () => {
        await addUser(vendorUser);
      });

      context('when a valid token is used', () => {
        VENDOR_STEPS.map((step) =>
          it('returns verified step', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send({
                ...data,
                step,
                commentId: vendorUser.vendor.verification[step].comments[0]._id,
              })
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.message).to.be.eql('Comment resolved');
                expect(res.body.vendor._id).to.be.eql(vendorUser._id.toString());
                expect(res.body.vendor.vendor.verification[step].comments[0].status).to.be.eql(
                  'Resolved',
                );
                expect(res.body.vendor.vendor.verification[step].comments[1].status).to.be.eql(
                  'Pending',
                );
                done();
              });
          }),
        );
      });

      itReturnsForbiddenForNoToken({
        endpoint,
        method,
        data: {
          ...data,
          step: VENDOR_STEPS[0],
          commentId: vendorUser.vendor.verification[VENDOR_STEPS[0]].comments[0]._id,
        },
      });
      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user: invalidUser,
        data: {
          ...data,
          step: VENDOR_STEPS[0],
          commentId: vendorUser.vendor.verification[VENDOR_STEPS[0]].comments[0]._id,
        },
      });
      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user: invalidUser,
        userId: invalidUserId,
        data: {
          ...data,
          step: VENDOR_STEPS[0],
          commentId: vendorUser.vendor.verification[VENDOR_STEPS[0]].comments[0]._id,
        },
      });

      context('when vendor id is invalid', () => {
        VENDOR_STEPS.map((step) =>
          it('returns not found', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send({
                vendorId: invalidUserId,
                step,
                commentId: vendorUser.vendor.verification[step].comments[0]._id,
              })
              .end((err, res) => {
                expect(res).to.have.status(404);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('User not found');
                done();
              });
          }),
        );
      });

      context('when vendor id is not for a vendor', () => {
        VENDOR_STEPS.map((step) =>
          it('returns not found', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send({
                vendorId: regularUser._id,
                step,
                commentId: vendorUser.vendor.verification[step].comments[0]._id,
              })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('User is not a vendor');
                done();
              });
          }),
        );
      });

      context('when findOneAndUpdate returns an error', () => {
        VENDOR_STEPS.map((step) =>
          it('returns the error', (done) => {
            sinon.stub(User, 'findOneAndUpdate').throws(new Error('Type Error'));
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send({
                ...data,
                step,
                commentId: vendorUser.vendor.verification[step].comments[0]._id,
              })
              .end((err, res) => {
                expect(res).to.have.status(400);
                expect(res.body.success).to.be.eql(false);
                done();
                User.findOneAndUpdate.restore();
              });
          }),
        );
      });

      context('with invalid data', () => {
        context('when step is empty', () => {
          it('returns an error', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send({ ...data, step: '' })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql(
                  '"Step" must be one of [companyInfo, bankDetails, directorInfo, documentUpload]',
                );
                done();
              });
          });
        });

        context('when step contains incorrect value', () => {
          it('returns an error', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send({ ...data, step: 'randomtext' })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql(
                  '"Step" must be one of [companyInfo, bankDetails, directorInfo, documentUpload]',
                );
                done();
              });
          });
        });

        context('when vendor id is empty', () => {
          VENDOR_STEPS.map((step) =>
            it('returns an error', (done) => {
              request()
                [method](endpoint)
                .set('authorization', adminToken)
                .send({ vendorId: '', step })
                .end((err, res) => {
                  expect(res).to.have.status(412);
                  expect(res.body.success).to.be.eql(false);
                  expect(res.body.message).to.be.eql('Validation Error');
                  expect(res.body.error).to.be.eql('"Vendor id" is not allowed to be empty');
                  done();
                });
            }),
          );
        });
      });
    });

    describe('Update vendor info', () => {
      let vendorToken;
      const vendorUser = UserFactory.build(
        {
          role: USER_ROLE.VENDOR,
          activated: true,
          phone: '08012345678',
          phone2: '09012345678',
          address: AddressFactory.build(),
          vendor: VendorFactory.build(),
        },
        { generateId: true },
      );
      const invalidUserId = mongoose.Types.ObjectId();
      const invalidUser = UserFactory.build({ _id: invalidUserId });
      const endpoint = '/api/v1/user/vendor/update';
      const method = 'put';

      const sensitiveData = {
        phone: '12345678901',
        vendor: {
          bankInfo: {
            accountNumber: '1234567890',
            accountName: 'Highrachy Investment Limited',
            bankName: 'ABC Bank',
          },
          companyName: 'Dangote PLC',
          entity: 'Individual',
          identification: {
            url: 'https://ballers.ng/cac-certificate.png',
            type: 'CAC Certificate',
          },
          redanNumber: '1234567890',
          taxCertificate: 'tax-certificate',
        },
      };

      const updatedFields = Object.keys({ ...sensitiveData, ...sensitiveData.vendor })
        .filter((key) => {
          return key !== 'vendor';
        })
        .sort();

      const logs = [
        generateLog({
          updatedFields,
          updatedVendor: sensitiveData,
          user: vendorUser,
        }),
      ];

      const nonSensitiveData = {
        phone2: '12345678901',
        address: {
          country: 'Ghana',
          state: 'Accra',
        },
        vendor: {
          companyLogo: 'https://ballers.ng/newlogo.png',
          directors: [
            {
              name: 'John Doe',
              isSignatory: false,
              phone: '08012345678',
            },
          ],
          socialMedia: [
            {
              name: 'Facebook',
              url: 'https://facebook.com/highrachy',
            },
          ],
          website: 'https://highrachy.com/',
        },
      };

      const itReturnsUpdatedVendorForSensitive = (res, data) => {
        expect(res).to.have.status(200);
        expect(res.body.success).to.be.eql(true);
        expect(res.body.message).to.be.eql('Vendor information updated');
        expect(res.body.user._id).to.be.eql(vendorUser._id.toString());
        expect(res.body.user.phone).to.be.eql(data.phone);
        expect(res.body.user.vendor.bankInfo).to.be.eql(data.vendor.bankInfo);
        expect(res.body.user.vendor.companyName).to.be.eql(data.vendor.companyName);
        expect(res.body.user.vendor.entity).to.be.eql(data.vendor.entity);
        expect(res.body.user.vendor.identification).to.be.eql(data.vendor.identification);
        expect(res.body.user.vendor.redanNumber).to.be.eql(data.vendor.redanNumber);
        expect(res.body.user.vendor.taxCertificate).to.be.eql(data.vendor.taxCertificate);
        expect(res.body.user.vendor.verification.bankDetails.status).to.be.eql('In Review');
        expect(res.body.user.vendor.verification.companyInfo.status).to.be.eql('In Review');
        expect(res.body.user.vendor.verification.documentUpload.status).to.be.eql('In Review');
        expect(res.body.user.vendor.verification.directorInfo.status).to.be.eql('Pending');
        expect(res.body.user.vendor.logs[0].bankInfo).to.be.eql(logs[0].bankInfo);
        expect(res.body.user.vendor.logs[0].taxCertificate).to.be.eql(logs[0].taxCertificate);
        expect(res.body.user.vendor.logs[0].companyName).to.be.eql(logs[0].companyName);
        expect(res.body.user.vendor.logs[0].identification).to.be.eql(logs[0].identification);
        expect(res.body.user.vendor.logs[0]).to.have.property('updatedAt');
        expect(res.body.user.vendor.verified).to.be.eql(false);
      };

      const itReturnsUpdatedVendorForNonSensitive = (res, data) => {
        expect(res).to.have.status(200);
        expect(res.body.success).to.be.eql(true);
        expect(res.body.message).to.be.eql('Vendor information updated');
        expect(res.body.user._id).to.be.eql(vendorUser._id.toString());
        expect(res.body.user.phone2).to.be.eql(data.phone2);
        expect(res.body.user.address).to.be.eql({
          ...vendorUser.address,
          ...data.address,
        });
        expect(res.body.user.vendor.companyLogo).to.be.eql(data.vendor.companyLogo);
        expect(res.body.user.vendor.socialMedia.length).to.be.eql(2);
        expect(res.body.user.vendor.directors.length).to.be.eql(2);
        expect(res.body.user.vendor.website).to.be.eql(data.vendor.website);
        expect(res.body.user.vendor.verification.bankDetails.status).to.be.eql('Pending');
        expect(res.body.user.vendor.verification.companyInfo.status).to.be.eql('In Review');
        expect(res.body.user.vendor.verification.directorInfo.status).to.be.eql('In Review');
        expect(res.body.user.vendor.verification.documentUpload.status).to.be.eql('Pending');
      };

      beforeEach(async () => {
        vendorToken = await addUser(vendorUser);
      });

      context('when vendor is verified', () => {
        context('when sensitive data is sent', () => {
          it('returns updated vendor', (done) => {
            request()
              [method](endpoint)
              .set('authorization', vendorToken)
              .send(sensitiveData)
              .end((err, res) => {
                itReturnsUpdatedVendorForSensitive(res, sensitiveData);
                expect(res.body.user.vendor.logs.length).to.be.eql(1);
                done();
              });
          });
        });

        context('when user has existing log', () => {
          beforeEach(async () => {
            await User.findByIdAndUpdate(vendorUser._id, { 'vendor.logs': logs });
          });
          it('returns updated vendor', (done) => {
            request()
              [method](endpoint)
              .set('authorization', vendorToken)
              .send(sensitiveData)
              .end((err, res) => {
                itReturnsUpdatedVendorForSensitive(res, sensitiveData);
                expect(res.body.user.vendor.logs.length).to.be.eql(2);
                expect(res.body.user.vendor.logs[1].bankInfo).to.be.eql(logs[0].bankInfo);
                expect(res.body.user.vendor.logs[1].taxCertificate).to.be.eql(
                  logs[0].taxCertificate,
                );
                expect(res.body.user.vendor.logs[1].companyName).to.be.eql(logs[0].companyName);
                expect(res.body.user.vendor.logs[1].identification).to.be.eql(
                  logs[0].identification,
                );
                done();
              });
          });
        });

        context('when non sensitive data is sent', () => {
          it('verification status remains true', (done) => {
            request()
              [method](endpoint)
              .set('authorization', vendorToken)
              .send(nonSensitiveData)
              .end((err, res) => {
                itReturnsUpdatedVendorForNonSensitive(res, nonSensitiveData);
                expect(res.body.user.vendor.verified).to.be.eql(true);
                done();
              });
          });
        });
      });

      context('when vendor is unverified', () => {
        beforeEach(async () => {
          await User.findByIdAndUpdate(vendorUser._id, { 'vendor.verified': false });
        });

        context('when sensitive data is sent', () => {
          it('returns updated vendor', (done) => {
            request()
              [method](endpoint)
              .set('authorization', vendorToken)
              .send(sensitiveData)
              .end((err, res) => {
                itReturnsUpdatedVendorForSensitive(res, sensitiveData);
                expect(res.body.user.vendor.logs.length).to.be.eql(1);
                done();
              });
          });
        });

        context('when non sensitive data is sent', () => {
          it('verification status remains false', (done) => {
            request()
              [method](endpoint)
              .set('authorization', vendorToken)
              .send(nonSensitiveData)
              .end((err, res) => {
                itReturnsUpdatedVendorForNonSensitive(res, nonSensitiveData);
                expect(res.body.user.vendor.verified).to.be.eql(false);
                done();
              });
          });
        });
      });

      context('updating a single field', () => {
        Object.keys(sensitiveData).map((field) =>
          it('returns updated vendor', (done) => {
            request()
              [method](endpoint)
              .set('authorization', vendorToken)
              .send({ [field]: sensitiveData[field] })
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.message).to.be.eql('Vendor information updated');
                expect(res.body.user._id).to.be.eql(vendorUser._id.toString());
                expect(res.body.user).to.have.property(field);
                done();
              });
          }),
        );
      });

      itReturnsForbiddenForNoToken({
        endpoint,
        method,
        data: sensitiveData,
      });

      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user: invalidUser,
        data: sensitiveData,
      });

      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user: invalidUser,
        userId: invalidUserId,
        data: sensitiveData,
      });

      context('when findByIdAndUpdate returns an error', () => {
        it('returns the error', (done) => {
          sinon.stub(User, 'findByIdAndUpdate').throws(new Error('Type Error'));
          request()
            [method](endpoint)
            .set('authorization', vendorToken)
            .send(sensitiveData)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body.success).to.be.eql(false);
              done();
              User.findByIdAndUpdate.restore();
            });
        });
      });
    });

    describe('Delete director or signatories', () => {
      let vendorToken;
      const signatoryId = mongoose.Types.ObjectId();
      const nonSignatoryId = mongoose.Types.ObjectId();
      const vendorUser = UserFactory.build(
        {
          role: USER_ROLE.VENDOR,
          activated: true,
          vendor: {
            companyName: 'Highrachy Investment Limited',
            verified: true,
            directors: [
              {
                _id: nonSignatoryId,
                name: 'Jane Doe',
                isSignatory: false,
                phone: '08012345678',
              },
              {
                _id: signatoryId,
                name: 'Samuel',
                isSignatory: true,
                signature: 'signature.png',
                phone: '08012345678',
              },
              {
                _id: mongoose.Types.ObjectId(),
                name: 'John',
                isSignatory: false,
                phone: '08012345678',
              },
            ],
            verification: {
              directorInfo: {
                status: VENDOR_INFO_STATUS.VERIFIED,
              },
            },
          },
        },
        { generateId: true },
      );
      const invalidUser = UserFactory.build({ role: USER_ROLE.USER }, { generateId: true });
      const endpoint = `/api/v1/user/vendor/director/${nonSignatoryId}`;
      const method = 'delete';

      beforeEach(async () => {
        vendorToken = await addUser(vendorUser);
      });

      context('when a valid token is used', () => {
        it('deletes director', (done) => {
          request()
            [method](endpoint)
            .set('authorization', vendorToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Director removed');
              expect(res.body.user._id).to.be.eql(vendorUser._id.toString());
              expect(res.body.user.vendor.directors.length).to.be.eql(2);
              expect(res.body.user.vendor.directors[0]._id).to.not.eql(nonSignatoryId);
              expect(res.body.user.vendor.directors[1]._id).to.not.eql(nonSignatoryId);
              expect(res.body.user.vendor.verification.directorInfo.status).to.be.eql('Verified');
              done();
            });
        });
      });

      context('when a valid token is used & vendor is not verified', () => {
        beforeEach(async () => {
          await User.findByIdAndUpdate(vendorUser._id, { 'vendor.verified': false });
        });

        it('sets director verification to `In Review`', (done) => {
          request()
            [method](endpoint)
            .set('authorization', vendorToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Director removed');
              expect(res.body.user.vendor.verification.directorInfo.status).to.be.eql('In Review');
              done();
            });
        });
      });

      context('when id passed is last account signatory', () => {
        it('returns error', (done) => {
          request()
            [method](`/api/v1/user/vendor/director/${signatoryId}`)
            .set('authorization', vendorToken)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql(
                'Signatory cannot be deleted. Verified vendors must have at least one signatory.',
              );
              done();
            });
        });
      });

      context('when vendor is not verified', () => {
        beforeEach(async () => {
          await User.findByIdAndUpdate(vendorUser._id, { 'vendor.verified': false });
        });
        it('deletes last signatory', (done) => {
          request()
            [method](`/api/v1/user/vendor/director/${signatoryId}`)
            .set('authorization', vendorToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Director removed');
              done();
            });
        });
      });

      itReturnsForbiddenForNoToken({
        endpoint,
        method,
      });

      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user: invalidUser,
      });

      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user: invalidUser,
        userId: invalidUser._id,
      });

      context('when findByIdAndUpdate returns an error', () => {
        it('returns the error', (done) => {
          sinon.stub(User, 'findByIdAndUpdate').throws(new Error('Type Error'));
          request()
            [method](endpoint)
            .set('authorization', vendorToken)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body.success).to.be.eql(false);
              done();
              User.findByIdAndUpdate.restore();
            });
        });
      });
    });

    describe('Edit director or signatories', () => {
      let vendorToken;
      const signatoryId = mongoose.Types.ObjectId();
      const vendorUser = UserFactory.build(
        {
          role: USER_ROLE.VENDOR,
          activated: true,
          vendor: {
            companyName: 'Highrachy Investment Limited',
            verified: true,
            directors: [
              {
                _id: signatoryId,
                name: 'Jane Doe',
                isSignatory: false,
                phone: '08012345678',
              },
              {
                _id: mongoose.Types.ObjectId(),
                name: 'John',
                isSignatory: false,
                phone: '08012345678',
              },
              {
                _id: mongoose.Types.ObjectId(),
                name: 'Alex',
                isSignatory: true,
                signature: 'signature.png',
                phone: '08012345678',
              },
            ],
          },
        },
        { generateId: true },
      );
      const invalidUser = UserFactory.build({ role: USER_ROLE.ADMIN }, { generateId: true });
      const endpoint = '/api/v1/user/vendor/director';
      const method = 'put';

      const data = {
        _id: signatoryId,
        name: 'Samuel',
        isSignatory: true,
        signature: 'signature.png',
        phone: '000000000',
      };

      beforeEach(async () => {
        vendorToken = await addUser(vendorUser);
      });

      context('when a valid token is used', () => {
        it('returns updated vendor', (done) => {
          request()
            [method](endpoint)
            .set('authorization', vendorToken)
            .send(data)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Director information was successfully updated');
              expect(res.body.user._id).to.be.eql(vendorUser._id.toString());
              expect(res.body.user.vendor.directors.length).to.be.eql(
                vendorUser.vendor.directors.length,
              );
              expect(res.body.user.vendor.directors[0]).to.eql({
                ...vendorUser.vendor.directors[0],
                _id: signatoryId.toString(),
                name: data.name,
                isSignatory: data.isSignatory,
                signature: data.signature,
                phone: data.phone,
              });
              expect(res.body.user.vendor.directors[1]).to.eql({
                ...vendorUser.vendor.directors[1],
                _id: vendorUser.vendor.directors[1]._id.toString(),
              });
              expect(res.body.user.vendor.directors[2]).to.eql({
                ...vendorUser.vendor.directors[2],
                _id: vendorUser.vendor.directors[2]._id.toString(),
              });
              expect(res.body.user.vendor.verification.directorInfo.status).to.be.eql('In Review');
              done();
            });
        });
      });

      itReturnsForbiddenForNoToken({
        endpoint,
        method,
        data,
      });

      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user: invalidUser,
        data,
      });

      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user: invalidUser,
        userId: invalidUser._id,
        data,
      });

      context('when findByIdAndUpdate returns an error', () => {
        it('returns the error', (done) => {
          sinon.stub(User, 'findOneAndUpdate').throws(new Error('Type Error'));
          request()
            [method](endpoint)
            .set('authorization', vendorToken)
            .send(data)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body.success).to.be.eql(false);
              done();
              User.findOneAndUpdate.restore();
            });
        });
      });
    });

    describe('Get one user', () => {
      const invalidUserId = mongoose.Types.ObjectId();
      const testUser = UserFactory.build(
        { role: USER_ROLE.USER, activated: true },
        { generateId: true },
      );
      const vendorUser = UserFactory.build(
        { role: USER_ROLE.VENDOR, activated: true },
        { generateId: true },
      );

      const method = 'get';
      const endpoint = `/api/v1/user/${testUser._id}`;

      const userBadge = BadgeFactory.build(
        { assignedRole: BADGE_ACCESS_LEVEL.USER, name: 'Special badge' },
        { generateId: true },
      );

      const vendorBadge = BadgeFactory.build(
        { assignedRole: BADGE_ACCESS_LEVEL.VENDOR },
        { generateId: true },
      );

      const allBadge = BadgeFactory.build(
        { assignedRole: BADGE_ACCESS_LEVEL.ALL },
        { generateId: true },
      );

      const assignedAllBadge = AssignedBadgeFactory.build(
        {
          badgeId: allBadge._id,
          userId: testUser._id,
        },
        { generateId: true },
      );
      const assignUserBadge = AssignedBadgeFactory.build(
        {
          badgeId: userBadge._id,
          userId: testUser._id,
        },
        { generateId: true },
      );
      const assignVendorBadge = AssignedBadgeFactory.build(
        {
          badgeId: vendorBadge._id,
          userId: vendorUser._id,
        },
        { generateId: true },
      );

      beforeEach(async () => {
        await addUser(testUser);
        await addUser(vendorUser);
        await addBadge(allBadge);
        await addBadge(userBadge);
        await addBadge(vendorBadge);
        await assignBadge(assignedAllBadge);
        await assignBadge(assignUserBadge);
        await assignBadge(assignVendorBadge);
      });

      context('with a valid token & id', () => {
        it('successfully returns user', (done) => {
          request()
            .get(endpoint)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.user._id).to.be.eql(testUser._id.toString());
              expect(res.body.user).to.not.have.property('password');
              expect(res.body.user).to.not.have.property('notifications');
              expect(res.body.user.assignedBadges.length).to.be.eql(2);
              expect(res.body.user.assignedBadges[0]._id).to.be.eql(
                assignedAllBadge._id.toString(),
              );
              expect(res.body.user.assignedBadges[1]._id).to.be.eql(assignUserBadge._id.toString());
              expect(res.body.user.badges[0]._id).to.be.eql(userBadge._id.toString());
              expect(res.body.user.badges[0].name).to.be.eql(userBadge.name);
              expect(res.body.user.badges[0].image).to.be.eql(userBadge.image);
              expect(res.body.user.badges[0].icon).to.be.eql(userBadge.icon);
              expect(res.body.user.badges[0].slug).to.be.eql(slugify(userBadge.name));
              expect(res.body.user.badges[1]._id).to.be.eql(allBadge._id.toString());
              done();
            });
        });
      });

      context('with a valid token & id', () => {
        it('successfully returns vendor details', (done) => {
          request()
            .get(`/api/v1/user/${vendorUser._id}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.user._id).to.be.eql(vendorUser._id.toString());
              expect(res.body.user).to.not.have.property('password');
              expect(res.body.user).to.not.have.property('notifications');
              expect(res.body.user.assignedBadges.length).to.be.eql(1);
              expect(res.body.user.assignedBadges[0]._id).to.be.eql(
                assignVendorBadge._id.toString(),
              );
              done();
            });
        });
      });

      itReturnsForbiddenForNoToken({
        endpoint,
        method,
      });

      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user: regularUser,
        useExistingUser: true,
      });

      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user: adminUser,
        userId: adminUser._id,
        useExistingUser: true,
      });

      context('with an invalid user id', () => {
        it('returns not found', (done) => {
          request()
            .get(`/api/v1/user/${invalidUserId}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              done();
            });
        });
      });

      itReturnsAnErrorWhenServiceFails({
        endpoint,
        method,
        user: adminUser,
        model: User,
        modelMethod: 'aggregate',
        useExistingUser: true,
      });
    });

    describe('Certify vendor', () => {
      const vendorUser = UserFactory.build(
        {
          role: USER_ROLE.VENDOR,
          activated: true,
          vendor: {
            verified: true,
          },
        },
        { generateId: true },
      );
      const invalidUserId = mongoose.Types.ObjectId();
      const invalidUser = UserFactory.build({ _id: invalidUserId });
      const endpoint = '/api/v1/user/vendor/certify';
      const method = 'put';

      const data = { vendorId: vendorUser._id };

      beforeEach(async () => {
        await addUser(vendorUser);
      });

      context('with valid token', () => {
        it('returns a certified vendor', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send(data)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Vendor certified');
              expect(res.body.vendor.vendor.certified).to.be.eql(true);
              expect(res.body.vendor.vendor.certifiedBy).to.be.eql(adminUser._id.toString());
              expect(sendMailStub.callCount).to.eq(1);
              expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.CERTIFY_VENDOR);
              done();
            });
        });
      });

      context('when vendor has not been verified', () => {
        const unVerifiedVendor = UserFactory.build(
          {
            role: USER_ROLE.VENDOR,
            activated: true,
            vendor: {
              companyName: 'ABC Limited',
              verified: false,
            },
          },
          { generateId: true },
        );

        beforeEach(async () => {
          await addUser(unVerifiedVendor);
        });

        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ vendorId: unVerifiedVendor._id })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql(
                'ABC Limited must be verified before approval as a certified vendor',
              );
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when vendor id is invalid', () => {
        const invalidVendorId = mongoose.Types.ObjectId();

        it('returns not found', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ vendorId: invalidVendorId })
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Vendor not found');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when id sent is not for a vendor', () => {
        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ vendorId: regularUser._id })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('User is not a registered vendor');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      itReturnsForbiddenForNoToken({ endpoint, method, data });
      itReturnsForbiddenForTokenWithInvalidAccess({ endpoint, method, user: invalidUser, data });
      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user: invalidUser,
        userId: invalidUserId,
        data,
      });

      context('when findByIdAndUpdate returns an error', () => {
        it('returns the error', (done) => {
          sinon.stub(User, 'findByIdAndUpdate').throws(new Error('Type Error'));
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send(data)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body.success).to.be.eql(false);
              expect(sendMailStub.callCount).to.eq(0);
              done();
              User.findByIdAndUpdate.restore();
            });
        });
      });

      context('with invalid data', () => {
        context('when user id is empty', () => {
          it('returns an error', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send({ vendorId: '' })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql('"Vendor id" is not allowed to be empty');
                expect(sendMailStub.callCount).to.eq(0);
                done();
              });
          });
        });
      });
    });

    describe('Ban User', () => {
      const user = UserFactory.build(
        {
          role: USER_ROLE.USER,
          activated: true,
          banned: { status: false },
        },
        { generateId: true },
      );
      const invalidUser = UserFactory.build({ role: USER_ROLE.USER }, { generateId: true });
      const endpoint = '/api/v1/user/ban';
      const method = 'put';

      const data = {
        userId: user._id,
        reason: 'Suspected fraud',
      };

      beforeEach(async () => {
        await addUser(user);
      });

      context('when a valid token is used', () => {
        it('returns banned user', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send(data)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('User banned');
              expect(res.body.user._id).to.be.eql(user._id.toString());
              expect(res.body.user.banned.status).to.be.eql(true);
              expect(res.body.user.banned.case[0].bannedReason).to.be.eql(data.reason);
              expect(res.body.user.banned.case[0].bannedBy).to.be.eql(adminUser._id.toString());
              expect(sendMailStub.callCount).to.eq(1);
              expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.BAN_USER);
              done();
            });
        });
      });

      context('when user has been banned previously', () => {
        beforeEach(async () => {
          await banUser({ adminId: adminUser._id, userId: user._id, reason: 'Fake Certificate' });
        });
        it('adds reason to user ban', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send(data)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('User banned');
              expect(res.body.user._id).to.be.eql(user._id.toString());
              expect(res.body.user.banned.status).to.be.eql(true);
              expect(res.body.user.banned.case[0].bannedReason).to.be.eql('Fake Certificate');
              expect(res.body.user.banned.case[0].bannedBy).to.be.eql(adminUser._id.toString());
              expect(res.body.user.banned.case[1].bannedReason).to.be.eql(data.reason);
              expect(res.body.user.banned.case[1].bannedBy).to.be.eql(adminUser._id.toString());
              expect(sendMailStub.callCount).to.eq(1);
              expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.BAN_USER);
              done();
            });
        });
      });

      itReturnsForbiddenForNoToken({
        endpoint,
        method,
        data,
      });

      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user: invalidUser,
        data,
      });

      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user: invalidUser,
        userId: invalidUser._id,
        data,
      });

      context('when findByIdAndUpdate returns an error', () => {
        it('returns the error', (done) => {
          sinon.stub(User, 'findOneAndUpdate').throws(new Error('Type Error'));
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send(data)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body.success).to.be.eql(false);
              done();
              User.findOneAndUpdate.restore();
            });
        });
      });
    });

    describe('Unban User', () => {
      const user = UserFactory.build(
        {
          role: USER_ROLE.USER,
          activated: true,
          banned: {
            status: true,
            case: [
              {
                _id: mongoose.Types.ObjectId(),
                bannedBy: adminUser._id,
                bannedReason: 'Suspected fraud',
              },
            ],
          },
        },
        { generateId: true },
      );
      const invalidUser = UserFactory.build({ role: USER_ROLE.USER }, { generateId: true });
      const endpoint = '/api/v1/user/unban';
      const method = 'put';

      const data = {
        userId: user._id,
        caseId: user.banned.case[0]._id,
        reason: 'Fraud case resolved',
      };

      beforeEach(async () => {
        await addUser(user);
      });

      context('when a valid token is used', () => {
        it('returns unbanned user', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send(data)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('User unbanned');
              expect(res.body.user._id).to.be.eql(user._id.toString());
              expect(res.body.user.banned.status).to.be.eql(false);
              expect(res.body.user.banned.case[0]._id).to.be.eql(data.caseId.toString());
              expect(res.body.user.banned.case[0].unBannedReason).to.be.eql(data.reason);
              expect(res.body.user.banned.case[0].unBannedBy).to.be.eql(adminUser._id.toString());
              expect(sendMailStub.callCount).to.eq(1);
              expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.UNBAN_USER);
              done();
            });
        });
      });

      itReturnsForbiddenForNoToken({
        endpoint,
        method,
        data,
      });

      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user: invalidUser,
        data,
      });

      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user: invalidUser,
        userId: invalidUser._id,
        data,
      });

      context('when findByIdAndUpdate returns an error', () => {
        it('returns the error', (done) => {
          sinon.stub(User, 'findOneAndUpdate').throws(new Error('Type Error'));
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send(data)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body.success).to.be.eql(false);
              done();
              User.findOneAndUpdate.restore();
            });
        });
      });
    });

    describe('Update Vendor Remittance Percentage', () => {
      const vendorUser = UserFactory.build(
        {
          role: USER_ROLE.USER,
          activated: true,
          vendor: {
            remittancePercentage: 5,
          },
        },
        { generateId: true },
      );
      const endpoint = '/api/v1/user/remittance';
      const method = 'put';

      const data = {
        vendorId: vendorUser._id,
        percentage: 12,
      };

      beforeEach(async () => {
        await addUser(vendorUser);
      });

      context('when a valid token is used', () => {
        it('returns vendor with updated percentage', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send(data)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Remittance Percentage Updated');
              expect(res.body.user._id).to.be.eql(vendorUser._id.toString());
              expect(res.body.user.vendor.remittancePercentage).to.be.eql(data.percentage);
              done();
            });
        });
      });

      context('with invalid data', () => {
        context('when invalid vendor id', () => {
          it('returns not found', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send({ ...data, vendorId: mongoose.Types.ObjectId() })
              .end((err, res) => {
                expect(res).to.have.status(404);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('User not found');
                done();
              });
          });
        });

        context('when percentage is less than 1', () => {
          it('returns error', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send({ ...data, percentage: 0 })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql(
                  '"Remittance In Percentage" must be larger than or equal to 1',
                );
                done();
              });
          });
        });

        context('when percentage is more than 100', () => {
          it('returns error', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send({ ...data, percentage: 101 })
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Validation Error');
                expect(res.body.error).to.be.eql(
                  '"Remittance In Percentage" must be less than or equal to 100',
                );
                done();
              });
          });
        });
      });

      itReturnsForbiddenForNoToken({
        endpoint,
        method,
        data,
      });

      [vendorUser, regularUser].map((user) =>
        itReturnsForbiddenForTokenWithInvalidAccess({
          endpoint,
          method,
          user,
          data,
          useExistingUser: true,
        }),
      );

      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user: adminUser,
        userId: adminUser._id,
        data,
        useExistingUser: true,
      });

      context('when findByIdAndUpdate returns an error', () => {
        it('returns error', (done) => {
          sinon.stub(User, 'findByIdAndUpdate').throws(new Error('Type Error'));
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send(data)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body.success).to.be.eql(false);
              done();
              User.findByIdAndUpdate.restore();
            });
        });
      });
    });

    describe('Request user bank details', () => {
      const endpoint = `/api/v1/user/request-bank/${regularUser._id}`;
      const method = 'post';

      const vendorUser = UserFactory.build({ role: USER_ROLE.VENDOR, activated: true });

      context('when token is valid', () => {
        it('sends notification to user', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Bank details requested');
              expect(sendMailStub.callCount).to.eq(1);
              done();
            });
        });
      });

      context('when user id is invalid', () => {
        it('returns not found', (done) => {
          request()
            [method](`/api/v1/user/request-bank/${mongoose.Types.ObjectId()}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('User not found');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('with valid user without valid access', () => {
        beforeEach(async () => {
          await addUser(vendorUser);
        });

        [vendorUser, regularUser].map((user) =>
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
    });

    describe('Resend activation email', () => {
      const endpoint = '/api/v1/user/resend-activation';
      const method = 'post';

      let unactivatedUserToken;

      const unactivatedUser = UserFactory.build(
        { role: USER_ROLE.USER, activated: false },
        { generateId: true },
      );
      const body = { userId: unactivatedUser._id };

      beforeEach(async () => {
        unactivatedUserToken = await addUser(unactivatedUser);
      });

      context('when request is made by admin', () => {
        context('when user id is valid', () => {
          it('sends activation email', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send(body)
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.message).to.be.eql('Reactivation email sent');
                expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.ACTIVATE_YOUR_ACCOUNT);
                expect(sendMailStub.callCount).to.eq(1);
                done();
              });
          });
        });

        context('when user id is invalid', () => {
          it('returns not found', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .send({ userId: mongoose.Types.ObjectId() })
              .end((err, res) => {
                expect(res).to.have.status(404);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('User not found');
                expect(sendMailStub.callCount).to.eq(0);
                done();
              });
          });
        });
      });

      context('when request is made by user', () => {
        context('when user is not activated', () => {
          it('sends activation email', (done) => {
            request()
              [method](endpoint)
              .set('authorization', unactivatedUserToken)
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.message).to.be.eql('Reactivation email sent');
                expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.ACTIVATE_YOUR_ACCOUNT);
                expect(sendMailStub.callCount).to.eq(1);
                done();
              });
          });
        });

        context('when user is activated', () => {
          it('returns error', (done) => {
            request()
              [method](endpoint)
              .set('authorization', userToken)
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Account has been previously activated');
                expect(sendMailStub.callCount).to.eq(0);
                done();
              });
          });
        });

        context('when user tries to send activation mail for another user', () => {
          it('returns error', (done) => {
            request()
              [method](endpoint)
              .set('authorization', userToken)
              .send(body)
              .end((err, res) => {
                expect(res).to.have.status(412);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('Account has been previously activated');
                expect(sendMailStub.callCount).to.eq(0);
                done();
              });
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
    });

    describe('Update user referral percentage', () => {
      const method = 'put';
      const endpoint = '/api/v1/user/referral-percentage';

      const vendorUser = UserFactory.build(
        { role: USER_ROLE.VENDOR, activated: true, 'additionalInfo.referralPercentage': 1.5 },
        { generateId: true },
      );

      const referralDetails = {
        userId: vendorUser._id,
        percentage: 2,
      };

      beforeEach(async () => {
        await addUser(vendorUser);
      });

      context('with valid data & token', () => {
        it('updates referral percentage', (done) => {
          request()
            .put(endpoint)
            .set('authorization', adminToken)
            .send(referralDetails)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Referral percentage updated');
              expect(res.body.user._id).to.be.eql(vendorUser._id.toString());
              expect(res.body.user.additionalInfo.referralPercentage).to.be.eql(
                referralDetails.percentage,
              );
              done();
            });
        });
      });

      context('with invalid referral id', () => {
        it('returns not found', (done) => {
          request()
            .put(endpoint)
            .set('authorization', adminToken)
            .send({ ...referralDetails, userId: mongoose.Types.ObjectId() })
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('User not found');
              done();
            });
        });
      });

      itReturnsForbiddenForNoToken({ endpoint, method, data: referralDetails });

      [regularUser, vendorUser].map((user) =>
        itReturnsForbiddenForTokenWithInvalidAccess({
          endpoint,
          method,
          user,
          data: referralDetails,
          useExistingUser: true,
        }),
      );

      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user: adminUser,
        userId: adminUser._id,
        data: referralDetails,
        useExistingUser: true,
      });
    });
  });

  describe('Get all users', () => {
    const endpoint = '/api/v1/user/all';
    const dummyUsers = UserFactory.buildList(13, {
      role: USER_ROLE.USER,
      activated: true,
      referralCode: 'ab1234',
      address: { country: 'Nigeria' },
      activationDate: currentDate,
      createdAt: currentDate,
    });
    const dummyEditors = UserFactory.buildList(2, {
      role: USER_ROLE.EDITOR,
      activated: true,
      activationDate: currentDate,
      createdAt: currentDate,
    });
    const dummyVendor = UserFactory.build(
      {
        role: USER_ROLE.VENDOR,
        activated: false,
        activationDate: futureDate,
        createdAt: futureDate,
        firstName: 'vendor1',
        lastName: 'doe',
        email: 'dummyevendor@mail.com',
        referralCode: 'ed1234',
        phone: '08023054226',
        phone2: '08132139448',
        address: {
          country: 'france',
          city: 'marsielle',
          state: 'Ghana',
          street1: 'napoleon st',
          street2: 'CDG street',
        },
        banned: {
          status: true,
        },
        vendor: {
          companyName: 'Dangote PLC',
          verified: true,
          certified: true,
          certifiedOn: futureDate,
          verifiedOn: futureDate,
          entity: 'Coporation',
          redanNumber: '0123456789',
          verification: {
            companyInfo: {
              status: VENDOR_INFO_STATUS.VERIFIED,
            },
            bankDetails: {
              status: VENDOR_INFO_STATUS.VERIFIED,
            },
            directorInfo: {
              status: VENDOR_INFO_STATUS.IN_REVIEW,
            },
            documentUpload: {
              status: VENDOR_INFO_STATUS.IN_REVIEW,
            },
          },
        },
      },
      { generateId: true },
    );
    const dummyAdmin = UserFactory.build(
      {
        role: USER_ROLE.ADMIN,
        activated: true,
        address: { country: 'Nigeria' },
        activationDate: currentDate,
        createdAt: currentDate,
      },
      { generateId: true },
    );
    const method = 'get';

    describe('User pagination', () => {
      beforeEach(async () => {
        await User.insertMany([dummyAdmin, dummyVendor, ...dummyUsers, ...dummyEditors]);
      });

      itReturnsTheRightPaginationValue({
        endpoint,
        method,
        user: adminUser,
      });
      itReturnsForbiddenForTokenWithInvalidAccess({ endpoint, method, user: regularUser });
      itReturnsForbiddenForNoToken({ endpoint, method });
      itReturnsAnErrorWhenServiceFails({
        endpoint,
        method,
        user: adminUser,
        model: User,
        modelMethod: 'aggregate',
      });
      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user: adminUser,
        userId: adminUser._id,
      });
    });

    describe('User filters', () => {
      beforeEach(async () => {
        await User.insertMany([dummyAdmin, dummyVendor, ...dummyUsers, ...dummyEditors]);
        const adminInfo = await getUserByEmail(dummyAdmin.email);
        adminToken = generateToken(adminInfo._id);
      });

      beforeEach(async () => {
        adminToken = await addUser(adminUser);
      });

      context('when single filter satisfies multiple users', () => {
        [USER_ROLE.EDITOR, USER_ROLE.ADMIN].map((user) =>
          it('returns matched users', (done) => {
            request()
              [method](`${endpoint}?role=${user}`)
              .set('authorization', adminToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  currentPage: 1,
                  limit: 10,
                  offset: 0,
                  result: 2,
                  total: 2,
                  totalPage: 1,
                });
                expect(res.body.result[0].role).to.be.eql(user);
                done();
              });
          }),
        );
      });

      context('when multiple filters are used', () => {
        const dummyVendorDetails = {
          firstName: dummyVendor.firstName,
          role: dummyVendor.role,
          activated: dummyVendor.activated,
          verified: dummyVendor.vendor.verified,
          companyName: dummyVendor.vendor.companyName,
          country: dummyVendor.address.country,
        };
        const filteredParams = querystring.stringify(dummyVendorDetails);

        it('returns matched user', (done) => {
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
              expect(res.body.result[0]._id).to.be.eql(dummyVendor._id.toString());
              expect(res.body.result[0].firstName).to.be.eql(dummyVendorDetails.firstName);
              expect(res.body.result[0].role).to.be.eql(dummyVendorDetails.role);
              expect(res.body.result[0].activated).to.be.eql(dummyVendorDetails.activated);
              expect(res.body.result[0].vendor.verified).to.be.eql(dummyVendorDetails.verified);
              expect(res.body.result[0].vendor.companyName).to.be.eql(
                dummyVendorDetails.companyName,
              );
              expect(res.body.result[0].address.country).to.be.eql(dummyVendorDetails.country);
              done();
            });
        });
      });

      context('when multiple filters are used', () => {
        const filterToReturnTwoResults = {
          role: 2,
          companyName: 'go',
        };
        const filteredParams = querystring.stringify(filterToReturnTwoResults);

        it('returns matched users', (done) => {
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
              expect(res.body.result[0].role).to.be.eql(filterToReturnTwoResults.role);
              expect(res.body.result[0].vendor.companyName.toLowerCase()).to.have.string(
                filterToReturnTwoResults.companyName,
              );
              done();
            });
        });
      });

      context('when unknown filter is used', () => {
        const unknownFilter = {
          dob: '1993-02-01',
        };

        itReturnAllResultsWhenAnUnknownFilterIsUsed({
          filter: unknownFilter,
          method,
          endpoint,
          user: adminUser,
          expectedPagination: {
            ...defaultPaginationResult,
            result: 10,
            total: 18,
            totalPage: 2,
          },
          useExistingUser: true,
        });
      });

      context('when no parameter is matched', () => {
        const nonMatchingOfferFilters = {
          role: 2,
          verified: false,
          firstName: 'John',
          activated: true,
          companyName: 'Highrachy',
          country: 'Ghana',
        };

        itReturnsNoResultWhenNoFilterParameterIsMatched({
          filter: nonMatchingOfferFilters,
          method,
          endpoint,
          user: adminUser,
          useExistingUser: true,
        });
      });

      filterTestForSingleParameter({
        filter: USER_FILTERS,
        method,
        endpoint,
        user: adminUser,
        dataObject: dummyVendor,
        useExistingUser: true,
      });
    });

    describe('User Sorting', () => {
      const user1 = UserFactory.build(
        {
          role: USER_ROLE.USER,
          activated: true,
          address: { country: 'Nigeria' },
          activationDate: '2020-12-11',
        },
        { generateId: true },
      );
      const user2 = UserFactory.build(
        {
          role: USER_ROLE.ADMIN,
          activated: false,
          address: { country: 'France' },
          activationDate: '1997-05-11',
        },
        { generateId: true },
      );
      const user3 = UserFactory.build(
        {
          role: USER_ROLE.VENDOR,
          activated: true,
          address: { country: 'China' },
          activationDate: '2003-03-29',
        },
        { generateId: true },
      );

      beforeEach(async () => {
        await addUser(user1);
        adminToken = await addUser(user2);
        await addUser(user3);
      });

      context('when an unknown filter is used', () => {
        const sortQuery = {
          sortBy: 'dob',
        };
        const filteredParams = querystring.stringify(sortQuery);
        it('returns all users', (done) => {
          request()
            [method](`${endpoint}?${filteredParams}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res.body.result[0]._id).to.be.eql(user1._id.toString());
              expect(res.body.result[1]._id).to.be.eql(user2._id.toString());
              expect(res.body.result[2]._id).to.be.eql(user3._id.toString());
              done();
            });
        });
      });

      context('when sorted by role', () => {
        context('in ascending order', () => {
          const sortQuery = {
            sortBy: 'role',
          };
          const filteredParams = querystring.stringify(sortQuery);
          it('returns matched users', (done) => {
            request()
              [method](`${endpoint}?${filteredParams}`)
              .set('authorization', adminToken)
              .end((err, res) => {
                expect(res.body.result[0]._id).to.be.eql(user2._id.toString());
                expect(res.body.result[1]._id).to.be.eql(user1._id.toString());
                expect(res.body.result[2]._id).to.be.eql(user3._id.toString());
                done();
              });
          });
        });
        context('in descending order', () => {
          const sortQuery = {
            sortBy: 'role',
            sortDirection: 'desc',
          };
          const filteredParams = querystring.stringify(sortQuery);
          it('returns matched users', (done) => {
            request()
              [method](`${endpoint}?${filteredParams}`)
              .set('authorization', adminToken)
              .end((err, res) => {
                expect(res.body.result[0]._id).to.be.eql(user3._id.toString());
                expect(res.body.result[1]._id).to.be.eql(user1._id.toString());
                expect(res.body.result[2]._id).to.be.eql(user2._id.toString());
                done();
              });
          });
        });
      });

      context('when sorted by activated', () => {
        context('in ascending order', () => {
          const sortQuery = {
            sortBy: 'activated',
          };
          const filteredParams = querystring.stringify(sortQuery);
          it('returns matched users', (done) => {
            request()
              [method](`${endpoint}?${filteredParams}`)
              .set('authorization', adminToken)
              .end((err, res) => {
                expect(res.body.result[0]._id).to.be.eql(user2._id.toString());
                expect(res.body.result[1]._id).to.be.eql(user1._id.toString());
                expect(res.body.result[2]._id).to.be.eql(user3._id.toString());
                done();
              });
          });
        });
        context('in descending order', () => {
          const sortQuery = {
            sortBy: 'activated',
            sortDirection: 'desc',
          };
          const filteredParams = querystring.stringify(sortQuery);
          it('returns matched users', (done) => {
            request()
              [method](`${endpoint}?${filteredParams}`)
              .set('authorization', adminToken)
              .end((err, res) => {
                expect(res.body.result[0]._id).to.be.eql(user1._id.toString());
                expect(res.body.result[1]._id).to.be.eql(user3._id.toString());
                expect(res.body.result[2]._id).to.be.eql(user2._id.toString());
                done();
              });
          });
        });
      });

      context('when sorted by country', () => {
        context('in ascending order', () => {
          const sortQuery = {
            sortBy: 'country',
          };
          const filteredParams = querystring.stringify(sortQuery);
          it('returns matched users', (done) => {
            request()
              [method](`${endpoint}?${filteredParams}`)
              .set('authorization', adminToken)
              .end((err, res) => {
                expect(res.body.result[0]._id).to.be.eql(user3._id.toString());
                expect(res.body.result[1]._id).to.be.eql(user2._id.toString());
                expect(res.body.result[2]._id).to.be.eql(user1._id.toString());
                done();
              });
          });
        });
        context('in descending order', () => {
          const sortQuery = {
            sortBy: 'country',
            sortDirection: 'desc',
          };
          const filteredParams = querystring.stringify(sortQuery);
          it('returns matched users', (done) => {
            request()
              [method](`${endpoint}?${filteredParams}`)
              .set('authorization', adminToken)
              .end((err, res) => {
                expect(res.body.result[0]._id).to.be.eql(user1._id.toString());
                expect(res.body.result[1]._id).to.be.eql(user2._id.toString());
                expect(res.body.result[2]._id).to.be.eql(user3._id.toString());
                done();
              });
          });
        });
      });

      context('when sorted by activationDate', () => {
        context('in ascending order', () => {
          const sortQuery = {
            sortBy: 'activationDate',
          };
          const filteredParams = querystring.stringify(sortQuery);
          it('returns matched users', (done) => {
            request()
              [method](`${endpoint}?${filteredParams}`)
              .set('authorization', adminToken)
              .end((err, res) => {
                expect(res.body.result[0]._id).to.be.eql(user2._id.toString());
                expect(res.body.result[1]._id).to.be.eql(user3._id.toString());
                expect(res.body.result[2]._id).to.be.eql(user1._id.toString());
                done();
              });
          });
        });
        context('in descending order', () => {
          const sortQuery = {
            sortBy: 'activationDate',
            sortDirection: 'desc',
          };
          const filteredParams = querystring.stringify(sortQuery);
          it('returns matched users', (done) => {
            request()
              [method](`${endpoint}?${filteredParams}`)
              .set('authorization', adminToken)
              .end((err, res) => {
                expect(res.body.result[0]._id).to.be.eql(user1._id.toString());
                expect(res.body.result[1]._id).to.be.eql(user3._id.toString());
                expect(res.body.result[2]._id).to.be.eql(user2._id.toString());
                done();
              });
          });
        });
      });
    });

    describe('Range Filter', () => {
      const user1 = UserFactory.build(
        {
          role: USER_ROLE.ADMIN,
          activationDate: '2021-11-03',
        },
        { generateId: true },
      );
      const user2 = UserFactory.build(
        {
          role: USER_ROLE.USER,
          activationDate: '2001-11-11',
        },
        { generateId: true },
      );
      const user3 = UserFactory.build(
        {
          role: USER_ROLE.VENDOR,
          activationDate: '2011-01-03',
        },
        { generateId: true },
      );
      const user4 = UserFactory.build(
        {
          role: USER_ROLE.EDITOR,
          activationDate: '1998-08-15',
        },
        { generateId: true },
      );

      beforeEach(async () => {
        adminToken = await addUser(user1);
        await addUser(user2);
        await addUser(user3);
        await addUser(user4);
      });

      context('when unknown parameter is used', () => {
        const unknownFilter = {
          dob: '1997-12-15:2001-10-29',
        };
        const filteredParams = querystring.stringify(unknownFilter);

        it('returns all users', (done) => {
          request()
            [method](`${endpoint}?${filteredParams}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expectsPaginationToReturnTheRightValues(res, {
                currentPage: 1,
                limit: 10,
                offset: 0,
                result: 4,
                total: 4,
                totalPage: 1,
              });
              done();
            });
        });
      });

      describe('when parameter is a number', () => {
        context('when the value is range', () => {
          const queryFilter = {
            role: '1:3',
          };
          const filteredParams = querystring.stringify(queryFilter);

          it('returns matched users', (done) => {
            request()
              [method](`${endpoint}?${filteredParams}`)
              .set('authorization', adminToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  currentPage: 1,
                  limit: 10,
                  offset: 0,
                  result: 3,
                  total: 3,
                  totalPage: 1,
                });
                done();
              });
          });
        });

        context('when the value is from', () => {
          const queryFilter = {
            role: '2:0',
          };
          const filteredParams = querystring.stringify(queryFilter);

          it('returns matched users', (done) => {
            request()
              [method](`${endpoint}?${filteredParams}`)
              .set('authorization', adminToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  currentPage: 1,
                  limit: 10,
                  offset: 0,
                  result: 2,
                  total: 2,
                  totalPage: 1,
                });
                done();
              });
          });
        });

        context('when the value is to', () => {
          const queryFilter = {
            role: '0:1',
          };
          const filteredParams = querystring.stringify(queryFilter);

          it('returns matched users', (done) => {
            request()
              [method](`${endpoint}?${filteredParams}`)
              .set('authorization', adminToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  currentPage: 1,
                  limit: 10,
                  offset: 0,
                  result: 2,
                  total: 2,
                  totalPage: 1,
                });
                done();
              });
          });
        });
      });

      describe('when parameter is a date', () => {
        context('when the value is range', () => {
          const queryFilter = {
            activationDate: '1998-01-01:2011-12-31',
          };
          const filteredParams = querystring.stringify(queryFilter);

          it('returns matched users', (done) => {
            request()
              [method](`${endpoint}?${filteredParams}`)
              .set('authorization', adminToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  currentPage: 1,
                  limit: 10,
                  offset: 0,
                  result: 3,
                  total: 3,
                  totalPage: 1,
                });
                done();
              });
          });
        });

        context('when the value is from', () => {
          const queryFilter = {
            activationDate: '2011-01-01:0',
          };
          const filteredParams = querystring.stringify(queryFilter);

          it('returns matched users', (done) => {
            request()
              [method](`${endpoint}?${filteredParams}`)
              .set('authorization', adminToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  currentPage: 1,
                  limit: 10,
                  offset: 0,
                  result: 2,
                  total: 2,
                  totalPage: 1,
                });
                done();
              });
          });
        });

        context('when the value is to', () => {
          const queryFilter = {
            activationDate: '0:2021-12-03',
          };
          const filteredParams = querystring.stringify(queryFilter);

          it('returns matched users', (done) => {
            request()
              [method](`${endpoint}?${filteredParams}`)
              .set('authorization', adminToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  currentPage: 1,
                  limit: 10,
                  offset: 0,
                  result: 4,
                  total: 4,
                  totalPage: 1,
                });
                done();
              });
          });
        });
      });
    });
  });
});

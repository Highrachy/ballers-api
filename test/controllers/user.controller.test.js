import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { expect, request, sinon, useDatabase } from '../config';
import User from '../../server/models/user.model';
import { addUser } from '../../server/services/user.service';
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
  itReturnsForbiddenForInvalidToken,
  itReturnsForbiddenForNoToken,
  itReturnsAnErrorWhenServiceFails,
} from '../helpers';
import { USER_ROLE } from '../../server/helpers/constants';

useDatabase();

let adminToken;
let userToken;
const userId = mongoose.Types.ObjectId();
const adminId = mongoose.Types.ObjectId();
const adminUser = UserFactory.build({ _id: adminId, role: 0, activated: true });
const regularUser = UserFactory.build({ _id: userId, role: 1, activated: true });

let sendMailStub;
const sandbox = sinon.createSandbox();

describe('User Controller', () => {
  beforeEach(() => {
    sendMailStub = sandbox.stub(MailService, 'sendMail');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('User Controller', () => {
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

        before(async () => {
          await User.create(user);
        });

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
        it('registers the user', (done) => {
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
    });

    describe('Login Route', () => {
      describe('when the user has been activated', () => {
        const userLogin = { email: 'myemail@mail.com', password: '123456' };
        const user = UserFactory.build({ ...userLogin, activated: true });
        beforeEach(async () => {
          await addUser(user);
        });

        context('with valid data', () => {
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
              expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.CHANGE_PASSWORD);
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
      context('with no token', () => {
        it('returns a forbidden error', (done) => {
          request()
            .get('/api/v1/user/who-am-i')
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
            .get('/api/v1/user/who-am-i')
            .set('authorization', 'invalid-token')
            .end((err, res) => {
              expect(res).to.have.status(401);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Authentication Failed');
              done();
            });
        });
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
              expect(res.body.user).to.not.have.property('password');
              done();
            });
        });
      });

      context('when user is not found', () => {
        beforeEach(async () => {
          await User.findByIdAndDelete(userId);
        });
        it('returns token error', (done) => {
          request()
            .get('/api/v1/user/who-am-i')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Invalid token');
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
              expect(res.body).to.have.property('user');
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

      context('with invalid updated user', () => {
        it('returns a updated user', (done) => {
          request()
            .put('/api/v1/user/update')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
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
    });

    describe('Add property to favorite route', () => {
      const _id = mongoose.Types.ObjectId();
      const propertyId = mongoose.Types.ObjectId();
      const property = PropertyFactory.build({ _id: propertyId, addedBy: _id, updatedBy: _id });

      beforeEach(async () => {
        await addProperty(property);
      });

      const favorite = {
        propertyId,
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
      const vendorId = mongoose.Types.ObjectId();
      const propertyId = mongoose.Types.ObjectId();
      const offerId = mongoose.Types.ObjectId();
      const transactionId = mongoose.Types.ObjectId();
      const vendor = UserFactory.build({ _id: vendorId });
      const property = PropertyFactory.build({
        _id: propertyId,
        addedBy: vendorId,
        updatedBy: vendorId,
        price: 20000000,
      });
      const referralId = mongoose.Types.ObjectId();
      const referral = ReferralFactory.build({
        _id: referralId,
        referrerId: userId,
        reward: { amount: 50000 },
      });

      const enquiryId = mongoose.Types.ObjectId();
      const enquiry = EnquiryFactory.build({ _id: enquiryId, userId, propertyId });
      const offer = OfferFactory.build({
        _id: offerId,
        enquiryId,
        vendorId,
        userId,
        totalAmountPayable: 19000000,
      });
      const transaction = TransactionFactory.build({
        _id: transactionId,
        propertyId,
        userId,
        adminId: vendorId,
        amount: 250000,
      });

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
          await addProperty(property);
          await addEnquiry(enquiry);
          await createOffer(offer);
          await addTransaction(transaction);
          await acceptOffer({ userId, offerId, signature: 'https://ballers.ng/signature.png' });
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
                expect(res.body.accountOverview.referralRewards).to.be.eql(referral.reward.amount);
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
      const userInfo = { userId };
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
      const userInfo = { userId };
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
  });

  describe('Get all users', () => {
    const endpoint = '/api/v1/user/all';
    const dummyUsers = UserFactory.buildList(16);

    beforeEach(async () => {
      adminToken = await addUser(adminUser);
      userToken = await addUser(regularUser);
      await User.insertMany(dummyUsers);
    });

    describe('when users exist in db', () => {
      itReturnsTheRightPaginationValue(endpoint, adminToken);

      itReturnsForbiddenForInvalidToken(endpoint, userToken);

      itReturnsForbiddenForNoToken(endpoint);

      itReturnsAnErrorWhenServiceFails(endpoint, adminToken, User, 'aggregate');

      context('when token is invalid', () => {
        beforeEach(async () => {
          await User.findByIdAndDelete(adminId);
        });
        it('returns token error', (done) => {
          request()
            .get(endpoint)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Invalid token');
              done();
            });
        });
      });
    });
  });

  describe('Get all vendors', () => {
    const endpoint = '/api/v1/user/vendor/all';
    const dummyVendors = UserFactory.buildList(17, {
      vendor: { companyName: 'Google', verified: false },
      role: USER_ROLE.VENDOR,
    });
    const vendor = UserFactory.build({
      vendor: { companyName: 'Highrachy investment', verified: true },
    });

    beforeEach(async () => {
      adminToken = await addUser(adminUser);
      userToken = await addUser(regularUser);
      await User.insertMany(dummyVendors);
      await addUser(vendor);
    });

    describe('when vendors exist in db', () => {
      itReturnsTheRightPaginationValue(endpoint, adminToken);

      itReturnsForbiddenForInvalidToken(endpoint, userToken);

      itReturnsForbiddenForNoToken(endpoint);

      itReturnsAnErrorWhenServiceFails(endpoint, adminToken, User, 'aggregate');

      context('when token is invalid', () => {
        beforeEach(async () => {
          await User.findByIdAndDelete(adminId);
        });
        it('returns token error', (done) => {
          request()
            .get(endpoint)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Invalid token');
              done();
            });
        });
      });
    });
  });
});

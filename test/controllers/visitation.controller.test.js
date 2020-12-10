import mongoose from 'mongoose';
import { expect, request, useDatabase, sinon } from '../config';
import User from '../../server/models/user.model';
import Visitation from '../../server/models/visitation.model';
// import Property from '../../server/models/property.model';
import VisitationFactory from '../factories/visitation.factory';
import PropertyFactory from '../factories/property.factory';
import UserFactory from '../factories/user.factory';
import { addUser } from '../../server/services/user.service';
import { addProperty } from '../../server/services/property.service';
// import { scheduleVisitation } from '../../server/services/visitation.service';
import { USER_ROLE } from '../../server/helpers/constants';
import * as MailService from '../../server/services/mailer.service';
import EMAIL_CONTENT from '../../mailer';
import {
  expectsPaginationToReturnTheRightValues,
  defaultPaginationResult,
  itReturnsTheRightPaginationValue,
  itReturnsForbiddenForInvalidToken,
  itReturnsForbiddenForNoToken,
  itReturnsAnErrorWhenServiceFails,
  itReturnsAnErrorForInvalidToken,
} from '../helpers';

useDatabase();

let sendMailStub;
const sandbox = sinon.createSandbox();

let userToken;
let adminToken;
let vendorToken;
let vendor2Token;

const user = UserFactory.build({ role: USER_ROLE.USER, activated: true }, { generateId: true });
const admin = UserFactory.build({ role: USER_ROLE.ADMIN, activated: true }, { generateId: true });
const vendor = UserFactory.build(
  {
    role: USER_ROLE.VENDOR,
    activated: true,
    email: 'vendor@mail.com',
  },
  { generateId: true },
);
const demoProperty = PropertyFactory.build(
  {
    addedBy: vendor._id,
    updatedBy: vendor._id,
  },
  { generateId: true },
);
const vendor2 = UserFactory.build(
  {
    role: USER_ROLE.VENDOR,
    activated: true,
  },
  { generateId: true },
);

describe('Visitation Controller', () => {
  beforeEach(async () => {
    userToken = await addUser(user);
    adminToken = await addUser(admin);
    vendorToken = await addUser(vendor);
    vendor2Token = await addUser(vendor2);
    await addProperty(demoProperty);
    sendMailStub = sandbox.stub(MailService, 'sendMail');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Schedule Visit Route', () => {
    context('with valid data', () => {
      it('returns successful property', (done) => {
        const booking = VisitationFactory.build({ propertyId: demoProperty._id });
        request()
          .post('/api/v1/visitation/schedule')
          .set('authorization', userToken)
          .send(booking)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Visit scheduled successfully');
            expect(res.body).to.have.property('schedule');
            expect(res.body.schedule.propertyId).to.be.eql(demoProperty._id.toString());
            expect(sendMailStub.callCount).to.eq(1);
            expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.SCHEDULE_VISIT);
            done();
          });
      });
    });

    context('when user token is not available', () => {
      let invalidUserToken;
      const invalidUserId = mongoose.Types.ObjectId();
      const invalidUser = UserFactory.build({
        _id: invalidUserId,
        role: USER_ROLE.USER,
        activated: true,
      });

      beforeEach(async () => {
        invalidUserToken = await addUser(invalidUser);
        await User.findByIdAndDelete(invalidUserId);
      });

      it('returns token error', (done) => {
        const booking = VisitationFactory.build({ propertyId: demoProperty._id });
        request()
          .post('/api/v1/visitation/schedule')
          .set('authorization', invalidUserToken)
          .send(booking)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid token');
            expect(sendMailStub.callCount).to.eq(0);
            done();
          });
      });
    });

    context('when property does not exist', () => {
      it('returns a property not found error', (done) => {
        const booking = VisitationFactory.build();
        request()
          .post('/api/v1/visitation/schedule')
          .set('authorization', userToken)
          .send(booking)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Property not found');
            expect(sendMailStub.callCount).to.eq(0);
            done();
          });
      });
    });

    context('with invalid data', () => {
      context('when property ID is empty', () => {
        it('returns an error', (done) => {
          const booking = VisitationFactory.build({ propertyId: '' });
          request()
            .post('/api/v1/visitation/schedule')
            .set('authorization', userToken)
            .send(booking)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property id" is not allowed to be empty');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });
      context('when visitor name is empty', () => {
        it('returns an error', (done) => {
          const property = VisitationFactory.build({ visitorName: '' });
          request()
            .post('/api/v1/visitation/schedule')
            .set('authorization', userToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Name" is not allowed to be empty');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });
      context('when visitor email is empty', () => {
        it('returns an error', (done) => {
          const property = VisitationFactory.build({ visitorEmail: '' });
          request()
            .post('/api/v1/visitation/schedule')
            .set('authorization', userToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Email address" is not allowed to be empty');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });
      context('when visitor phone is empty', () => {
        it('returns an error', (done) => {
          const booking = VisitationFactory.build({ visitorPhone: '' });
          request()
            .post('/api/v1/visitation/schedule')
            .set('authorization', userToken)
            .send(booking)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Phone" is not allowed to be empty');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });
      context('when visitor phone is less than 11 numbers', () => {
        it('returns an error', (done) => {
          const booking = VisitationFactory.build({ visitorPhone: '1234567890' });
          request()
            .post('/api/v1/visitation/schedule')
            .set('authorization', userToken)
            .send(booking)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql(
                '"Phone" length must be at least 11 characters long',
              );
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });
      context('when visitor phone is more than 14 numbers', () => {
        it('returns an error', (done) => {
          const booking = VisitationFactory.build({ visitorPhone: '123456789012345' });
          request()
            .post('/api/v1/visitation/schedule')
            .set('authorization', userToken)
            .send(booking)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql(
                '"Phone" length must be less than or equal to 14 characters long',
              );
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });
      context('when visit date is empty', () => {
        it('returns an error', (done) => {
          const booking = VisitationFactory.build({ visitDate: '' });
          request()
            .post('/api/v1/visitation/schedule')
            .set('authorization', userToken)
            .send(booking)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Visit Date" must be a valid date');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });
      context('when visit date is a random string', () => {
        it('returns an error', (done) => {
          const property = VisitationFactory.build({ visitDate: 'abcdefghij' });
          request()
            .post('/api/v1/visitation/schedule')
            .set('authorization', userToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Visit Date" must be a valid date');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });
      context('when visit date is a past date', () => {
        it('returns an error', (done) => {
          const property = VisitationFactory.build({ visitDate: '2020-01-01' });
          request()
            .post('/api/v1/visitation/schedule')
            .set('authorization', userToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });
    });
  });

  describe.only('Get all visitations', () => {
    const endpoint = '/api/v1/visitation/all';
    const method = 'get';
    // const size18Array = new Array(18);

    // const dummyProperties = size18Array.map(() =>
    //   PropertyFactory.build(
    //     {
    //       addedBy: vendor._id,
    //       updatedBy: vendor._id,
    //     },
    //     { generateId: true },
    //   ),
    // );

    // const dummyVisitations = size18Array.map((_, index) =>
    //   VisitationFactory.build(
    //     {
    //       propertyId: dummyProperties[index]._id,
    //       userId: user._id,
    //     },
    //     { generateId: true },
    //   ),
    // );

    // beforeEach(async () => {
    //   await Property.insertMany(dummyProperties);
    //   await Visitation.insertMany(dummyVisitations);
    // });

    const regularUser = UserFactory.build({ role: USER_ROLE.USER, activated: true });
    const adminUser = UserFactory.build(
      { role: USER_ROLE.ADMIN, activated: true },
      { generateId: true },
    );

    itReturnsTheRightPaginationValue({ endpoint, method, user: adminUser });
    itReturnsForbiddenForInvalidToken({ endpoint, method, user: regularUser });
    itReturnsForbiddenForNoToken({ endpoint, method });
    itReturnsAnErrorWhenServiceFails({
      endpoint,
      method,
      user: adminUser,
      model: Visitation,
      modelMethod: 'aggregate',
    });
    itReturnsAnErrorForInvalidToken({
      endpoint,
      method,
      user: adminUser,
      model: Visitation,
      userId: adminUser._id,
    });

    describe('when properties exist in db', () => {
      context('when no parameters are passed', () => {
        it('returns the default values', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .end((err, res) => {
              expectsPaginationToReturnTheRightValues(res, defaultPaginationResult);
              done();
            });
        });
      });

      context('when parameters page and limit are passed', () => {
        it('returns the given page and limit', (done) => {
          request()
            [method](`${endpoint}?page=2&limit=5`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expectsPaginationToReturnTheRightValues(res, {
                ...defaultPaginationResult,
                currentPage: 2,
                limit: 5,
                offset: 5,
                result: 5,
                totalPage: 4,
              });
              done();
            });
        });
      });

      context('when admin token is used', () => {
        it('returns the given page and limit', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .end((err, res) => {
              expectsPaginationToReturnTheRightValues(res, defaultPaginationResult);
              done();
            });
        });
      });

      context('when page is set to 2', () => {
        it('returns the second page', (done) => {
          request()
            [method](`${endpoint}?page=2`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expectsPaginationToReturnTheRightValues(res, {
                ...defaultPaginationResult,
                result: 8,
                offset: 10,
                currentPage: 2,
              });
              done();
            });
        });
      });

      context('when limit is set to 4', () => {
        it('returns 4 properties', (done) => {
          request()
            [method](`${endpoint}?limit=4`)
            .set('authorization', vendor2Token)
            .end((err, res) => {
              expectsPaginationToReturnTheRightValues(res, {
                ...defaultPaginationResult,
                limit: 4,
                result: 4,
                totalPage: 5,
              });
              done();
            });
        });
      });

      context('with a user access token', () => {
        it('returns successful payload', (done) => {
          request()
            [method](endpoint)
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('You are not permitted to perform this action');
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            [method](endpoint)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when getAllVisitations service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Visitation, 'aggregate').throws(new Error('Type Error'));
          request()
            [method](endpoint)
            .set('authorization', vendorToken)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              Visitation.aggregate.restore();
            });
        });
      });
    });
  });
});

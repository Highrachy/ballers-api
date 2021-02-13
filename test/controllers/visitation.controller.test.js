import mongoose from 'mongoose';
import { expect, request, useDatabase, sinon } from '../config';
import User from '../../server/models/user.model';
import Visitation from '../../server/models/visitation.model';
import Property from '../../server/models/property.model';
import VisitationFactory from '../factories/visitation.factory';
import PropertyFactory from '../factories/property.factory';
import UserFactory from '../factories/user.factory';
import { addUser } from '../../server/services/user.service';
import { addProperty } from '../../server/services/property.service';
import { USER_ROLE, VISITATION_STATUS } from '../../server/helpers/constants';
import * as MailService from '../../server/services/mailer.service';
import { scheduleVisitation } from '../../server/services/visitation.service';
import EMAIL_CONTENT from '../../mailer';
import {
  itReturnsTheRightPaginationValue,
  itReturnsForbiddenForTokenWithInvalidAccess,
  itReturnsForbiddenForNoToken,
  itReturnsAnErrorWhenServiceFails,
  itReturnsNotFoundForInvalidToken,
  itReturnsEmptyValuesWhenNoItemExistInDatabase,
  itReturnsErrorForUnverifiedVendor,
  defaultPaginationResult,
  futureDate,
  whenNoFilterParameterIsMatched,
  whenUnknownFilterIsUsed,
  expectsPaginationToReturnTheRightValues,
  filterTestForSingleParameter,
} from '../helpers';
import { VISITATION_FILTERS } from '../../server/helpers/filters';

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
    email: 'vendor1@mail.com',
    vendor: {
      verified: true,
    },
  },
  { generateId: true },
);
const vendor2 = UserFactory.build(
  {
    role: USER_ROLE.VENDOR,
    activated: true,
    email: 'vendor2@mail.com',
    vendor: {
      verified: true,
    },
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
          const property = VisitationFactory.build({
            propertyId: demoProperty._id,
            visitorEmail: '',
          });
          request()
            .post('/api/v1/visitation/schedule')
            .set('authorization', userToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Visit scheduled successfully');
              expect(res.body).to.have.property('schedule');
              expect(res.body.schedule.propertyId).to.be.eql(demoProperty._id.toString());
              expect(sendMailStub.callCount).to.eq(1);
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
      context('when visitor phone is less than 6 numbers', () => {
        it('returns an error', (done) => {
          const booking = VisitationFactory.build({ visitorPhone: '12345' });
          request()
            .post('/api/v1/visitation/schedule')
            .set('authorization', userToken)
            .send(booking)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Phone" length must be at least 6 characters long');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });
      context('when visitor phone is more than 14 numbers', () => {
        it('returns an error', (done) => {
          const booking = VisitationFactory.build({ visitorPhone: '1234567890123456' });
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

  describe('Get all visitations', () => {
    const endpoint = '/api/v1/visitation/all';
    const method = 'get';

    const vendorProperties = PropertyFactory.buildList(
      13,
      {
        addedBy: vendor._id,
        updatedBy: vendor._id,
      },
      { generateId: true },
    );

    const vendor2Properties = PropertyFactory.buildList(
      5,
      {
        addedBy: vendor2._id,
        updatedBy: vendor2._id,
      },
      { generateId: true },
    );

    const dummyProperties = [...vendorProperties, ...vendor2Properties];

    const dummyVisitations = dummyProperties.map((property) =>
      VisitationFactory.build(
        {
          propertyId: property._id,
          userId: user._id,
          vendorId: property.addedBy,
        },
        { generateId: true },
      ),
    );
    const vendor3 = UserFactory.build(
      {
        role: USER_ROLE.VENDOR,
        activated: true,
        email: 'vendor3@mail.com',
        vendor: {
          verified: true,
        },
      },
      { generateId: true },
    );
    const vendor3Property = PropertyFactory.build(
      {
        addedBy: vendor3._id,
        updatedBy: vendor3._id,
      },
      { generateId: true },
    );
    const vendor3Visitation = VisitationFactory.build(
      {
        propertyId: vendor3Property._id,
        userId: admin._id,
        vendorId: vendor3Property.addedBy,
        visitorName: 'Haruna Ijei',
        visitorEmail: 'hj@mail.com',
        visitorPhone: '08012343221',
        createdAt: futureDate,
        visitDate: futureDate,
        status: VISITATION_STATUS.RESOLVED,
      },
      { generateId: true },
    );

    describe('Visitation Pagination', () => {
      itReturnsEmptyValuesWhenNoItemExistInDatabase({
        endpoint,
        method,
        user: admin,
        useExistingUser: true,
      });

      describe('when schedules exist in the db', () => {
        beforeEach(async () => {
          await Property.insertMany(dummyProperties);
          await Visitation.insertMany(dummyVisitations);
        });

        context('when vendor 1 token is used', () => {
          it('returns all visitations', (done) => {
            request()
              .get(endpoint)
              .set('authorization', vendorToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  ...defaultPaginationResult,
                  total: 13,
                  result: 10,
                  totalPage: 2,
                });
                done();
              });
          });
        });

        context('when vendor 2 token is used', () => {
          it('returns all visitations', (done) => {
            request()
              .get(endpoint)
              .set('authorization', vendor2Token)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  ...defaultPaginationResult,
                  total: 5,
                  result: 5,
                  totalPage: 1,
                });
                done();
              });
          });
        });

        itReturnsTheRightPaginationValue({ endpoint, method, user: admin, useExistingUser: true });
        itReturnsForbiddenForTokenWithInvalidAccess({
          endpoint,
          method,
          user,
          useExistingUser: true,
        });
        itReturnsForbiddenForNoToken({ endpoint, method });
        itReturnsAnErrorWhenServiceFails({
          endpoint,
          method,
          user: admin,
          model: Visitation,
          modelMethod: 'aggregate',
          useExistingUser: true,
        });

        itReturnsNotFoundForInvalidToken({
          endpoint,
          method,
          user: admin,
          userId: admin._id,
          useExistingUser: true,
        });

        itReturnsErrorForUnverifiedVendor({
          endpoint,
          method,
          user: vendor,
          useExistingUser: true,
        });
      });
    });

    describe('Visitation Filters', () => {
      beforeEach(async () => {
        await addUser(vendor3);
        await Property.insertMany([...dummyProperties, vendor3Property]);
        await Visitation.insertMany([...dummyVisitations, vendor3Visitation]);
      });

      describe('Unknown Filters', () => {
        const unknownFilter = {
          dob: '1993-02-01',
        };

        whenUnknownFilterIsUsed({
          filter: unknownFilter,
          method,
          endpoint,
          user: admin,
          expectedPagination: {
            ...defaultPaginationResult,
            total: 19,
            result: 10,
            totalPage: 2,
          },
          useExistingUser: true,
        });

        whenUnknownFilterIsUsed({
          filter: unknownFilter,
          method,
          endpoint,
          user: vendor,
          expectedPagination: {
            ...defaultPaginationResult,
            total: 13,
            result: 10,
            totalPage: 2,
          },
          useExistingUser: true,
        });

        whenUnknownFilterIsUsed({
          filter: unknownFilter,
          method,
          endpoint,
          user: vendor2,
          expectedPagination: {
            ...defaultPaginationResult,
            total: 5,
            result: 5,
            totalPage: 1,
          },
          useExistingUser: true,
        });
      });

      context('when no parameter is matched', () => {
        const nonMatchingFilters = {
          propertyId: mongoose.Types.ObjectId(),
          visitorName: 'Segun Otedola',
          visitorEmail: 'shegs@mail.com',
          visitorPhone: '09012000000',
          userId: mongoose.Types.ObjectId(),
        };

        whenNoFilterParameterIsMatched({
          filter: nonMatchingFilters,
          method,
          endpoint,
          user: admin,
          useExistingUser: true,
        });
      });

      filterTestForSingleParameter({
        filter: VISITATION_FILTERS,
        method,
        endpoint,
        user: admin,
        dataObject: vendor3Visitation,
        useExistingUser: true,
      });
    });
  });

  describe('Resolve Visitation', () => {
    const method = 'put';
    const endpoint = '/api/v1/visitation/resolve';
    const visitation = VisitationFactory.build(
      {
        propertyId: demoProperty._id,
        userId: user._id,
        vendorId: vendor._id,
        status: VISITATION_STATUS.PENDING,
      },
      { generateId: true },
    );
    const body = {
      visitationId: visitation._id,
    };

    beforeEach(async () => {
      await scheduleVisitation(visitation);
    });

    context('when request is sent by valid vendor', () => {
      it('returns an error', (done) => {
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send(body)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Visitation resolved');
            expect(res.body.visitation._id).to.be.eql(visitation._id.toString());
            expect(res.body.visitation.status).to.be.eql('Resolved');
            done();
          });
      });
    });

    context('with unauthorized token', () => {
      [...new Array(3)].map((_, index) =>
        it('returns successful payload', (done) => {
          request()
            [method](endpoint)
            .set('authorization', [userToken, adminToken, vendor2Token][index])
            .send(body)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('You are not permitted to perform this action');
              done();
            });
        }),
      );
    });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: vendor,
      userId: vendor._id,
      data: body,
      useExistingUser: true,
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    context('when resolve service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Visitation, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', vendorToken)
          .send(body)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Visitation.findByIdAndUpdate.restore();
          });
      });
    });
  });

  describe('Reschedule Visitation', () => {
    const method = 'put';
    const endpoint = '/api/v1/visitation/reschedule';
    const visitation = VisitationFactory.build(
      {
        propertyId: demoProperty._id,
        userId: user._id,
        vendorId: vendor._id,
        status: VISITATION_STATUS.PENDING,
        visitDate: '2021-12-11',
      },
      { generateId: true },
    );
    const body = {
      visitationId: visitation._id,
      reason: 'family emergency',
      visitDate: '2030-12-12',
    };

    beforeEach(async () => {
      await scheduleVisitation(visitation);
    });

    context('with valid token', () => {
      const returnsExpectedRescheduleResponse = (res) => {
        expect(res).to.have.status(200);
        expect(res.body.success).to.be.eql(true);
        expect(res.body.message).to.be.eql('Visitation rescheduled');
        expect(res.body.visitation._id).to.be.eql(visitation._id.toString());
        expect(res.body.visitation.rescheduleLog[0].reason).to.be.eql(body.reason);
        expect(res.body.visitation.rescheduleLog[0].rescheduleTo).to.have.string(body.visitDate);
        expect(res.body.visitation.rescheduleLog[0].rescheduleFrom).to.have.string(
          visitation.visitDate,
        );
        expect(sendMailStub.callCount).to.eq(1);
        expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.RESCHEDULE_VISIT);
      };

      context('when request is sent by valid vendor', () => {
        it('returns updated visitation', (done) => {
          request()
            [method](endpoint)
            .set('authorization', vendorToken)
            .send(body)
            .end((err, res) => {
              expect(res.body.visitation.rescheduleLog[0].rescheduleBy).to.be.eql('Vendor');
              returnsExpectedRescheduleResponse(res);
              done();
            });
        });
      });

      context('when request is sent by valid user', () => {
        it('returns updated visitation', (done) => {
          request()
            [method](endpoint)
            .set('authorization', userToken)
            .send(body)
            .end((err, res) => {
              expect(res.body.visitation.rescheduleLog[0].rescheduleBy).to.be.eql('User');
              returnsExpectedRescheduleResponse(res);
              done();
            });
        });
      });

      context('when visitation id is invalid', () => {
        const invalidVisitationId = mongoose.Types.ObjectId();
        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', userToken)
            .send({ ...body, visitationId: invalidVisitationId })
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Visitation not found');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when visitation has been resolved', () => {
        beforeEach(async () => {
          await Visitation.findByIdAndUpdate(visitation._id, {
            status: VISITATION_STATUS.RESOLVED,
          });
        });
        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', vendorToken)
            .send(body)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('The visitation has already been resolved');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when visitation has been cancelled', () => {
        beforeEach(async () => {
          await Visitation.findByIdAndUpdate(visitation._id, {
            status: VISITATION_STATUS.CANCELLED,
          });
        });
        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', vendorToken)
            .send(body)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('The visitation has already been cancelled');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('with unauthorized token', () => {
        [...new Array(2)].map((_, index) =>
          it('returns error', (done) => {
            request()
              [method](endpoint)
              .set('authorization', [adminToken, vendor2Token][index])
              .send(body)
              .end((err, res) => {
                expect(res).to.have.status(403);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('You are not permitted to perform this action');
                done();
              });
          }),
        );
      });

      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user: vendor,
        userId: vendor._id,
        data: body,
        useExistingUser: true,
      });

      itReturnsForbiddenForNoToken({ endpoint, method });

      context('when reschedule service returns an error', () => {
        it('returns the error', (done) => {
          sinon.stub(Visitation, 'findByIdAndUpdate').throws(new Error('Type Error'));
          request()
            [method](endpoint)
            .set('authorization', vendorToken)
            .send(body)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body.success).to.be.eql(false);
              done();
              Visitation.findByIdAndUpdate.restore();
            });
        });
      });
    });
  });

  describe('Cancel Visitation', () => {
    const method = 'put';
    const endpoint = '/api/v1/visitation/cancel';
    const visitation = VisitationFactory.build(
      {
        propertyId: demoProperty._id,
        userId: user._id,
        vendorId: vendor._id,
        status: VISITATION_STATUS.PENDING,
        visitDate: '2021-12-11',
      },
      { generateId: true },
    );
    const body = {
      visitationId: visitation._id,
      reason: 'family emergency',
    };

    beforeEach(async () => {
      await scheduleVisitation(visitation);
    });

    context('with valid token', () => {
      context('when request is sent by valid user', () => {
        it('returns updated visitation', (done) => {
          request()
            [method](endpoint)
            .set('authorization', userToken)
            .send(body)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Visitation cancelled');
              expect(res.body.visitation._id).to.be.eql(visitation._id.toString());
              expect(res.body.visitation.status).to.be.eql('Cancelled');
              expect(res.body.visitation.rescheduleLog[0].rescheduleBy).to.be.eql('User');
              expect(sendMailStub.callCount).to.eq(1);
              expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.CANCEL_VISIT);
              done();
            });
        });
      });

      context('when visitation id is invalid', () => {
        const invalidVisitationId = mongoose.Types.ObjectId();
        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', userToken)
            .send({ ...body, visitationId: invalidVisitationId })
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Visitation not found');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when visitation has been resolved', () => {
        beforeEach(async () => {
          await Visitation.findByIdAndUpdate(visitation._id, {
            status: VISITATION_STATUS.RESOLVED,
          });
        });
        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', userToken)
            .send(body)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('The visitation has already been resolved');
              expect(sendMailStub.callCount).to.eq(0);
              done();
            });
        });
      });

      context('with unauthorized token', () => {
        [...new Array(3)].map((_, index) =>
          it('returns error', (done) => {
            request()
              [method](endpoint)
              .set('authorization', [adminToken, vendorToken, vendor2Token][index])
              .send(body)
              .end((err, res) => {
                expect(res).to.have.status(403);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('You are not permitted to perform this action');
                done();
              });
          }),
        );
      });

      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user,
        userId: user._id,
        data: body,
        useExistingUser: true,
      });

      itReturnsForbiddenForNoToken({ endpoint, method });

      context('when cancel service returns an error', () => {
        it('returns the error', (done) => {
          sinon.stub(Visitation, 'findByIdAndUpdate').throws(new Error('Type Error'));
          request()
            [method](endpoint)
            .set('authorization', userToken)
            .send(body)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body.success).to.be.eql(false);
              done();
              Visitation.findByIdAndUpdate.restore();
            });
        });
      });
    });
  });
});

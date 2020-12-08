import mongoose from 'mongoose';
import { expect, request, useDatabase, sinon } from '../config';
import User from '../../server/models/user.model';
import Visitation from '../../server/models/visitation.model';
import VisitationFactory from '../factories/visitation.factory';
import PropertyFactory from '../factories/property.factory';
import UserFactory from '../factories/user.factory';
import { addUser } from '../../server/services/user.service';
import { addProperty } from '../../server/services/property.service';
import { scheduleVisitation } from '../../server/services/visitation.service';
import { USER_ROLE } from '../../server/helpers/constants';
import * as MailService from '../../server/services/mailer.service';
import EMAIL_CONTENT from '../../mailer';

useDatabase();

let sendMailStub;
const sandbox = sinon.createSandbox();

let userToken;
let adminToken;
let vendorToken;

const userId = mongoose.Types.ObjectId();
const user = UserFactory.build({ _id: userId, role: USER_ROLE.USER, activated: true });
const adminId = mongoose.Types.ObjectId();
const admin = UserFactory.build({ _id: adminId, role: USER_ROLE.ADMIN, activated: true });
const vendorId = mongoose.Types.ObjectId();
const vendor = UserFactory.build({
  _id: vendorId,
  role: USER_ROLE.VENDOR,
  activated: true,
  email: 'vendor@mail.com',
});
const demoPropertyId = mongoose.Types.ObjectId();
const demoProperty = PropertyFactory.build({
  _id: demoPropertyId,
  addedBy: vendorId,
  updatedBy: vendorId,
});

describe('Visitation Controller', () => {
  beforeEach(async () => {
    userToken = await addUser(user);
    adminToken = await addUser(admin);
    vendorToken = await addUser(vendor);
    await addProperty(demoProperty);
    sendMailStub = sandbox.stub(MailService, 'sendMail');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Schedule Visit Route', () => {
    context('with valid data', () => {
      it('returns successful property', (done) => {
        const contentBottom = `
          <strong> Name: </strong>: John Doe<br /> 
          <strong> Phone: </strong> 08012345678<br />
          <strong> Email: </strong> johndoe@mail.com <br />
        `;
        const booking = VisitationFactory.build({ propertyId: demoPropertyId });
        request()
          .post('/api/v1/visitation/schedule')
          .set('authorization', userToken)
          .send(booking)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Visit scheduled successfully');
            expect(res.body).to.have.property('schedule');
            expect(demoPropertyId.equals(res.body.schedule.propertyId)).to.be.eql(true);
            expect(sendMailStub.callCount).to.eq(1);
            expect(sendMailStub).to.have.be.calledWith();
            expect(sendMailStub).to.have.be.calledWith(
              EMAIL_CONTENT.SCHEDULE_VISIT,
              {
                email: vendor.email,
              },
              { contentBottom },
            );
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
        const booking = VisitationFactory.build({ propertyId: demoPropertyId });
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

  describe('Get all visitations', () => {
    const testAdminPropertyId = mongoose.Types.ObjectId();
    const testAdminProperty = PropertyFactory.build({
      _id: testAdminPropertyId,
      addedBy: adminId,
      updatedBy: adminId,
    });
    const testVendorPropertyId = mongoose.Types.ObjectId();
    const testVendorProperty = PropertyFactory.build({
      _id: testVendorPropertyId,
      addedBy: vendorId,
      updatedBy: vendorId,
    });
    const bookingForAdmin = VisitationFactory.build({ propertyId: testAdminPropertyId, userId });
    const bookingForVendor = VisitationFactory.build({ propertyId: testVendorPropertyId, userId });

    context('when no schedule exists', () => {
      it('returns not found', (done) => {
        request()
          .get('/api/v1/visitation/all')
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('No schedules available');
            done();
          });
      });
    });

    describe('when scheduled visits exist in db', () => {
      beforeEach(async () => {
        await addProperty(testAdminProperty);
        await addProperty(testVendorProperty);
        await scheduleVisitation(bookingForAdmin);
        await scheduleVisitation(bookingForVendor);
      });

      context('when an admin token is used', () => {
        it('returns 2 visitations', (done) => {
          request()
            .get('/api/v1/visitation/all')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('schedules');
              expect(res.body.schedules.length).to.be.eql(2);
              expect(testAdminPropertyId.equals(res.body.schedules[0].propertyId)).to.be.eql(true);
              expect(userId.equals(res.body.schedules[0].userId)).to.be.eql(true);
              expect(res.body.schedules[0].visitorName).to.be.eql(bookingForAdmin.visitorName);
              expect(res.body.schedules[0].visitorEmail).to.be.eql(bookingForAdmin.visitorEmail);
              expect(res.body.schedules[0].visitorPhone).to.be.eql(bookingForAdmin.visitorPhone);
              expect(
                testAdminPropertyId.equals(res.body.schedules[0].propertyInfo[0]._id),
              ).to.be.eql(true);
              expect(res.body.schedules[0].propertyInfo[0].name).to.be.eql(testAdminProperty.name);
              expect(res.body.schedules[0].propertyInfo[0].price).to.be.eql(
                testAdminProperty.price,
              );
              expect(res.body.schedules[0].propertyInfo[0].description).to.be.eql(
                testAdminProperty.description,
              );
              done();
            });
        });
      });

      context('when an vendor token is used', () => {
        it('returns 1 visitation', (done) => {
          request()
            .get('/api/v1/visitation/all')
            .set('authorization', vendorToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('schedules');
              expect(res.body.schedules.length).to.be.eql(1);
              expect(testVendorPropertyId.equals(res.body.schedules[0].propertyId)).to.be.eql(true);
              expect(userId.equals(res.body.schedules[0].userId)).to.be.eql(true);
              expect(res.body.schedules[0].visitorName).to.be.eql(bookingForVendor.visitorName);
              expect(res.body.schedules[0].visitorEmail).to.be.eql(bookingForVendor.visitorEmail);
              expect(res.body.schedules[0].visitorPhone).to.be.eql(bookingForVendor.visitorPhone);
              expect(
                testVendorPropertyId.equals(res.body.schedules[0].propertyInfo[0]._id),
              ).to.be.eql(true);
              expect(res.body.schedules[0].propertyInfo[0].name).to.be.eql(testVendorProperty.name);
              expect(res.body.schedules[0].propertyInfo[0].price).to.be.eql(
                testVendorProperty.price,
              );
              expect(res.body.schedules[0].propertyInfo[0].description).to.be.eql(
                testVendorProperty.description,
              );
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get('/api/v1/visitation/all')
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when admin token is not available', () => {
        beforeEach(async () => {
          await User.findByIdAndDelete(adminId);
        });
        it('returns token error', (done) => {
          request()
            .get('/api/v1/visitation/all')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Invalid token');
              done();
            });
        });
      });

      context('when user token is is used', () => {
        it('returns forbidden', (done) => {
          request()
            .get('/api/v1/visitation/all')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('You are not permitted to perform this action');
              done();
            });
        });
      });

      context('when getAllVisitations service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Visitation, 'aggregate').throws(new Error('Type Error'));
          request()
            .get('/api/v1/visitation/all')
            .set('authorization', adminToken)
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

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
import userRole from '../../server/helpers/userRole';

useDatabase();

let userToken;
let adminToken;

const user = UserFactory.build({ role: userRole.USER, activated: true });
const adminId = mongoose.Types.ObjectId();
const admin = UserFactory.build({ _id: adminId, role: userRole.ADMIN, activated: true });
const propId = mongoose.Types.ObjectId();
const demoProperty = PropertyFactory.build({ _id: propId, addedBy: adminId, updatedBy: adminId });

beforeEach(async () => {
  userToken = await addUser(user);
  adminToken = await addUser(admin);
});

describe('Schedule Visit Route', () => {
  beforeEach(async () => {
    await addProperty(demoProperty);
  });

  context('with valid data', () => {
    it('returns successful property', (done) => {
      const booking = VisitationFactory.build({ propertyId: propId });
      request()
        .post('/api/v1/visitation/schedule')
        .set('authorization', userToken)
        .send(booking)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body.success).to.be.eql(true);
          expect(res.body.message).to.be.eql('Visit scheduled successfully');
          expect(res.body).to.have.property('schedule');
          expect(res.body).to.have.property('schedule');
          expect(res.body.schedule).to.have.property('propertyId');
          expect(res.body.schedule).to.have.property('userId');
          done();
        });
    });
  });

  context('when user token is not available', () => {
    let invalidUserToken;
    const invalidUserId = mongoose.Types.ObjectId();
    const invalidUser = UserFactory.build({
      _id: invalidUserId,
      role: userRole.USER,
      activated: true,
    });

    beforeEach(async () => {
      invalidUserToken = await addUser(invalidUser);
      await User.findByIdAndDelete(invalidUserId);
    });

    it('returns token error', (done) => {
      const booking = VisitationFactory.build({ propertyId: propId });
      request()
        .post('/api/v1/visitation/schedule')
        .set('authorization', invalidUserToken)
        .send(booking)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Invalid token');
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
            expect(res.body.error).to.be.eql('"Phone" length must be at least 11 characters long');
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
            done();
          });
      });
    });
  });
});

describe('Get all properties', () => {
  const booking = VisitationFactory.build({ propertyId: propId, userId: adminId });

  context('when no schedule exists', () => {
    it('returns not found', (done) => {
      request()
        .get('/api/v1/visitation/all')
        .set('authorization', adminToken)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('No scheduled visits available');
          done();
        });
    });
  });

  describe('when scheduled visits exist in db', () => {
    beforeEach(async () => {
      await addProperty(demoProperty);
    });

    context('with a valid token & id', () => {
      beforeEach(async () => {
        await scheduleVisitation(booking);
      });
      it('returns successful payload', (done) => {
        request()
          .get('/api/v1/visitation/all')
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('schedules');
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
        sinon.stub(Visitation, 'find').throws(new Error('Type Error'));
        request()
          .get('/api/v1/visitation/all')
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            Visitation.find.restore();
          });
      });
    });
  });
});

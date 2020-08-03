import mongoose from 'mongoose';
import { expect, request, useDatabase } from '../config';
import User from '../../server/models/user.model';
import VisitationFactory from '../factories/visitation.factory';
import PropertyFactory from '../factories/property.factory';
import UserFactory from '../factories/user.factory';
import { addUser } from '../../server/services/user.service';
import { addProperty } from '../../server/services/property.service';

useDatabase();

let adminToken;

const userId = mongoose.Types.ObjectId();
const admin = UserFactory.build({ _id: userId, role: 0, activated: true });

beforeEach(async () => {
  adminToken = await addUser(admin);
});

describe('Schedule Visit Route', () => {
  const propId = mongoose.Types.ObjectId();
  const demoProperty = PropertyFactory.build({ _id: propId, addedBy: userId, updatedBy: userId });

  beforeEach(async () => {
    await addProperty(demoProperty);
  });

  context('with valid data', () => {
    it('returns successful property', (done) => {
      const booking = VisitationFactory.build({ propertyId: propId });
      request()
        .post('/api/v1/visitation/schedule')
        .set('authorization', adminToken)
        .send(booking)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body.success).to.be.eql(true);
          expect(res.body.message).to.be.eql('Visit scheduled successfully');
          expect(res.body).to.have.property('schedule');
          done();
        });
    });
  });

  context('when user token is used', () => {
    beforeEach(async () => {
      await User.findByIdAndDelete(userId);
    });
    it('returns token error', (done) => {
      const booking = VisitationFactory.build({ propertyId: propId });
      request()
        .post('/api/v1/visitation/schedule')
        .set('authorization', adminToken)
        .send(booking)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Invalid token');
          done();
        });
    });
  });

  context('when user token is not an admin', () => {
    let userToken;
    const id = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: id, role: 0, activated: true });

    beforeEach(async () => {
      userToken = await addUser(user);
    });
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
          done();
        });
    });
  });

  context('when property does not exist', () => {
    it('returns a property not found error', (done) => {
      const booking = VisitationFactory.build();
      request()
        .post('/api/v1/visitation/schedule')
        .set('authorization', adminToken)
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
          .set('authorization', adminToken)
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
          .set('authorization', adminToken)
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
          .set('authorization', adminToken)
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
          .set('authorization', adminToken)
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
          .set('authorization', adminToken)
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
          .set('authorization', adminToken)
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

import mongoose from 'mongoose';
import { expect, request, useDatabase } from '../config';
import User from '../../server/models/user.model';
import VisitFactory from '../factories/visit.factory';
import PropertyFactory from '../factories/property.factory';
import UserFactory from '../factories/user.factory';
import { addUser } from '../../server/services/user.service';
import { addProperty } from '../../server/services/property.service';

useDatabase();

let userToken;

const userId = mongoose.Types.ObjectId();
const systemUser = UserFactory.build({ _id: userId, role: 0, activated: true });

beforeEach(async () => {
  userToken = await addUser(systemUser);
});

describe('Schedule Visit Route', () => {
  const propId = mongoose.Types.ObjectId();
  const demoProperty = PropertyFactory.build({ _id: propId, addedBy: userId, updatedBy: userId });

  beforeEach(async () => {
    await addProperty(demoProperty);
  });

  context('with valid data', () => {
    it('returns successful property', (done) => {
      const booking = VisitFactory.build({ propertyId: propId });
      request()
        .post('/api/v1/visit/book')
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

  context('when user token is used', () => {
    beforeEach(async () => {
      await User.findByIdAndDelete(userId);
    });
    it('returns token error', (done) => {
      const booking = VisitFactory.build({ propertyId: propId });
      request()
        .post('/api/v1/visit/book')
        .set('authorization', userToken)
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
    it('returns token error', (done) => {
      const booking = VisitFactory.build();
      request()
        .post('/api/v1/visit/book')
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
        const booking = VisitFactory.build({ propertyId: '' });
        request()
          .post('/api/v1/visit/book')
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
        const property = VisitFactory.build({ visitorName: '' });
        request()
          .post('/api/v1/visit/book')
          .set('authorization', userToken)
          .send(property)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Visitor name" is not allowed to be empty');
            done();
          });
      });
    });
    context('when visitor phone is empty', () => {
      it('returns an error', (done) => {
        const booking = VisitFactory.build({ visitorPhone: '' });
        request()
          .post('/api/v1/visit/book')
          .set('authorization', userToken)
          .send(booking)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Visitor phone" is not allowed to be empty');
            done();
          });
      });
    });
  });
});

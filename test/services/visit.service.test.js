import mongoose from 'mongoose';
import { expect, sinon, useDatabase } from '../config';
import scheduleVisit from '../../server/services/visit.service';
import VisitFactory from '../factories/visit.factory';
import PropertyFactory from '../factories/property.factory';
import Visit from '../../server/models/visit.model';
import Property from '../../server/models/property.model';

useDatabase();

describe('Visit Service', () => {
  describe('#scheduleVisit', () => {
    let countedVisits;
    const id = mongoose.Types.ObjectId();
    const property = PropertyFactory.build({ _id: id, addedBy: id, updatedBy: id });

    beforeEach(async () => {
      countedVisits = await Visit.countDocuments({});
      await Property.create(property);
    });

    context('when a valid schedule is entered', () => {
      it('adds a new scheduled visit', async () => {
        const validBooking = VisitFactory.build({ propertyId: id, visitorId: id });
        const schedule = await scheduleVisit(validBooking);
        const currentcountedVisits = await Visit.countDocuments({});
        expect(schedule.propertyId).to.eql(validBooking.propertyId);
        expect(currentcountedVisits).to.eql(countedVisits + 1);
      });
    });

    context('when an invalid data (visitor phone) is entered', () => {
      it('throws a validation error', async () => {
        try {
          const invalidBooking = VisitFactory.build({ propertyId: id, visitorName: '' });
          await scheduleVisit(invalidBooking);
        } catch (err) {
          const currentcountedVisits = await Visit.countDocuments({});
          expect(err.statusCode).to.eql(400);
          expect(err.error.name).to.be.eql('ValidationError');
          expect(err.message).to.be.eql('Error scheduling visit');
          expect(currentcountedVisits).to.eql(countedVisits);
        }
      });
    });

    context('when an invalid data (visitor phone) is entered', () => {
      it('throws a validation error', async () => {
        try {
          const invalidBooking = VisitFactory.build({ propertyId: id, visitorPhone: '' });
          await scheduleVisit(invalidBooking);
        } catch (err) {
          const currentcountedVisits = await Visit.countDocuments({});
          expect(err.statusCode).to.eql(400);
          expect(err.error.name).to.be.eql('ValidationError');
          expect(err.message).to.be.eql('Error scheduling visit');
          expect(currentcountedVisits).to.eql(countedVisits);
        }
      });
    });

    context('when an invalid data (property id) is entered', () => {
      it('throws a cast error', async () => {
        try {
          const invalidBooking = VisitFactory.build({ propertyId: '' });
          await scheduleVisit(invalidBooking);
        } catch (err) {
          const currentcountedVisits = await Visit.countDocuments({});
          expect(err.statusCode).to.eql(500);
          expect(err.error.name).to.be.eql('CastError');
          expect(err.message).to.be.eql('Internal Server Error');
          expect(currentcountedVisits).to.eql(countedVisits);
        }
      });
    });

    context('when property id is invalid', () => {
      it('throws an error', async () => {
        try {
          const invalidId = mongoose.Types.ObjectId();
          const invalidBooking = VisitFactory.build({ propertyId: invalidId });
          await scheduleVisit(invalidBooking);
        } catch (err) {
          const currentcountedVisits = await Visit.countDocuments({});
          expect(err.statusCode).to.eql(404);
          expect(err.message).to.be.eql('Property not found');
          expect(currentcountedVisits).to.eql(countedVisits);
        }
      });
    });

    context('when getPropertyById fails', () => {
      it('throws an error', async () => {
        sinon.stub(Property, 'findById').throws(new Error('error msg'));
        try {
          const validBooking = VisitFactory.build({ propertyId: id, visitorId: id });
          await scheduleVisit(validBooking);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        Property.findById.restore();
      });
    });
  });
});

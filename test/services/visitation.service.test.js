import mongoose from 'mongoose';
import { expect, sinon, useDatabase } from '../config';
import { scheduleVisitation, getAllVisitations } from '../../server/services/visitation.service';
import VisitationFactory from '../factories/visitation.factory';
import PropertyFactory from '../factories/property.factory';
import Visitation from '../../server/models/visitation.model';
import Property from '../../server/models/property.model';

useDatabase();

describe('Visitation Service', () => {
  describe('#scheduleVisitation', () => {
    let countedVisitations;
    const id = mongoose.Types.ObjectId();
    const property = PropertyFactory.build({ _id: id, addedBy: id, updatedBy: id });

    beforeEach(async () => {
      countedVisitations = await Visitation.countDocuments({});
      await Property.create(property);
    });

    context('when a valid schedule is entered', () => {
      it('adds a new scheduled visit', async () => {
        const validBooking = VisitationFactory.build({ propertyId: id, userId: id });
        const schedule = await scheduleVisitation(validBooking);
        const currentcountedVisitations = await Visitation.countDocuments({});
        expect(schedule.propertyId).to.eql(validBooking.propertyId);
        expect(currentcountedVisitations).to.eql(countedVisitations + 1);
      });
    });

    context('when the visitor name is invalid', () => {
      it('throws a validation error', async () => {
        try {
          const invalidBooking = VisitationFactory.build({ propertyId: id, visitorName: '' });
          await scheduleVisitation(invalidBooking);
        } catch (err) {
          const currentcountedVisitations = await Visitation.countDocuments({});
          expect(err.statusCode).to.eql(400);
          expect(err.error.name).to.be.eql('ValidationError');
          expect(err.message).to.be.eql('Error scheduling visit');
          expect(currentcountedVisitations).to.eql(countedVisitations);
        }
      });
    });

    context('when the visitor email is invalid', () => {
      it('throws a validation error', async () => {
        try {
          const invalidBooking = VisitationFactory.build({ propertyId: id, visitorEmail: '' });
          await scheduleVisitation(invalidBooking);
        } catch (err) {
          const currentcountedVisitations = await Visitation.countDocuments({});
          expect(err.statusCode).to.eql(400);
          expect(err.error.name).to.be.eql('ValidationError');
          expect(err.message).to.be.eql('Error scheduling visit');
          expect(currentcountedVisitations).to.eql(countedVisitations);
        }
      });
    });

    context('when the visitor phone number is invalid', () => {
      it('throws a validation error', async () => {
        try {
          const invalidBooking = VisitationFactory.build({ propertyId: id, visitorPhone: '' });
          await scheduleVisitation(invalidBooking);
        } catch (err) {
          const currentcountedVisitations = await Visitation.countDocuments({});
          expect(err.statusCode).to.eql(400);
          expect(err.error.name).to.be.eql('ValidationError');
          expect(err.message).to.be.eql('Error scheduling visit');
          expect(currentcountedVisitations).to.eql(countedVisitations);
        }
      });
    });

    context('when property id is empty', () => {
      it('throws a cast error', async () => {
        try {
          const invalidBooking = VisitationFactory.build({ propertyId: '' });
          await scheduleVisitation(invalidBooking);
        } catch (err) {
          const currentcountedVisitations = await Visitation.countDocuments({});
          expect(err.statusCode).to.eql(500);
          expect(err.error.name).to.be.eql('CastError');
          expect(err.message).to.be.eql('Internal Server Error');
          expect(currentcountedVisitations).to.eql(countedVisitations);
        }
      });
    });

    context('when property id is invalid', () => {
      it('throws an error', async () => {
        try {
          const invalidId = mongoose.Types.ObjectId();
          const invalidBooking = VisitationFactory.build({ propertyId: invalidId });
          await scheduleVisitation(invalidBooking);
        } catch (err) {
          const currentcountedVisitations = await Visitation.countDocuments({});
          expect(err.statusCode).to.eql(404);
          expect(err.message).to.be.eql('Property not found');
          expect(currentcountedVisitations).to.eql(countedVisitations);
        }
      });
    });

    context('when getPropertyById fails', () => {
      it('throws an error', async () => {
        sinon.stub(Property, 'findById').throws(new Error('error msg'));
        try {
          const validBooking = VisitationFactory.build({ propertyId: id, visitorId: id });
          await scheduleVisitation(validBooking);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        Property.findById.restore();
      });
    });
  });

  describe('#getAllVisitations', () => {
    const id = mongoose.Types.ObjectId();
    const property = PropertyFactory.build({ _id: id, addedBy: id, updatedBy: id });
    const validBooking = VisitationFactory.build({ propertyId: id, userId: id });

    beforeEach(async () => {
      await Property.create(property);
      await scheduleVisitation(validBooking);
      await scheduleVisitation(validBooking);
    });

    context('when schedule added is valid', () => {
      it('returns 2 schedules', async () => {
        const schedule = await getAllVisitations();
        expect(schedule).to.be.an('array');
        expect(schedule.length).to.be.eql(2);
      });
    });
    context('when new schedule is added', () => {
      beforeEach(async () => {
        await scheduleVisitation(validBooking);
      });
      it('returns 3 schedules', async () => {
        const schedule = await getAllVisitations();
        expect(schedule).to.be.an('array');
        expect(schedule.length).to.be.eql(3);
      });
    });
  });
});
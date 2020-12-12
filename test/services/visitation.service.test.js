import mongoose from 'mongoose';
import { expect, sinon, useDatabase } from '../config';
import { scheduleVisitation, getAllVisitations } from '../../server/services/visitation.service';
import VisitationFactory from '../factories/visitation.factory';
import PropertyFactory from '../factories/property.factory';
import UserFactory from '../factories/user.factory';
import Visitation from '../../server/models/visitation.model';
import Property from '../../server/models/property.model';
import { addUser } from '../../server/services/user.service';
import { addProperty } from '../../server/services/property.service';
import { USER_ROLE } from '../../server/helpers/constants';

useDatabase();

describe('Visitation Service', () => {
  const vendor = UserFactory.build({ role: USER_ROLE.VENDOR }, { generateId: true });
  const user = UserFactory.build({ role: USER_ROLE.USER }, { generateId: true });
  const property = PropertyFactory.build(
    { addedBy: vendor._id, updatedBy: vendor._id },
    { generateId: true },
  );

  beforeEach(async () => {
    await addUser(vendor);
    await addUser(user);
    await addProperty(property);
  });

  describe('#scheduleVisitation', () => {
    let countedVisitations;

    beforeEach(async () => {
      countedVisitations = await Visitation.countDocuments({});
    });

    context('when a valid schedule is entered', () => {
      it('adds a new scheduled visit', async () => {
        const validBooking = VisitationFactory.build({
          propertyId: property._id,
          userId: user._id,
        });
        const schedule = await scheduleVisitation(validBooking);
        const currentcountedVisitations = await Visitation.countDocuments({});
        expect(schedule.propertyId).to.eql(validBooking.propertyId);
        expect(currentcountedVisitations).to.eql(countedVisitations + 1);
      });
    });

    context('when the visitor name is invalid', () => {
      it('throws a validation error', async () => {
        try {
          const invalidBooking = VisitationFactory.build({
            propertyId: property._id,
            visitorName: '',
          });
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
          const invalidBooking = VisitationFactory.build({
            propertyId: property._id,
            visitorEmail: '',
          });
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
          const invalidBooking = VisitationFactory.build({
            propertyId: property._id,
            visitorPhone: '',
          });
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
          const validBooking = VisitationFactory.build({
            propertyId: property._id,
            visitorId: user._id,
          });
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
    const validBookings = VisitationFactory.buildList(18, {
      propertyId: property._id,
      userId: user._id,
    });
    const validBooking = VisitationFactory.build({
      propertyId: property._id,
      userId: user._id,
    });

    beforeEach(async () => {
      await Visitation.insertMany(validBookings);
    });

    context('when schedule added is valid', () => {
      it('returns 18 schedules', async () => {
        const schedule = await getAllVisitations();
        expect(schedule).to.be.an('array');
        expect(schedule.length).to.be.eql(18);
      });
    });
    context('when new schedule is added', () => {
      beforeEach(async () => {
        await scheduleVisitation(validBooking);
      });
      it('returns 19 schedules', async () => {
        const schedule = await getAllVisitations();
        expect(schedule).to.be.an('array');
        expect(schedule.length).to.be.eql(19);
      });
    });
  });
});

import mongoose from 'mongoose';
import { expect, sinon } from '../config';
import {
  scheduleVisitation,
  getAllVisitations,
  processVisitation,
} from '../../server/services/visitation.service';
import VisitationFactory from '../factories/visitation.factory';
import PropertyFactory from '../factories/property.factory';
import UserFactory from '../factories/user.factory';
import Visitation from '../../server/models/visitation.model';
import Property from '../../server/models/property.model';
import { addUser } from '../../server/services/user.service';
import { addProperty } from '../../server/services/property.service';
import { USER_ROLE, PROCESS_VISITATION_ACTION } from '../../server/helpers/constants';
import { expectNewNotificationToBeAdded } from '../helpers';
import NOTIFICATIONS from '../../server/helpers/notifications';
import { getFormattedName } from '../../server/helpers/funtions';
import { convertDateToLongHumanFormat } from '../../server/helpers/dates';

describe('Visitation Service', () => {
  const vendor = UserFactory.build(
    { email: 'vendoremail@mail.com', role: USER_ROLE.VENDOR },
    { generateId: true },
  );
  const user = UserFactory.build({ role: USER_ROLE.USER }, { generateId: true });
  const property = PropertyFactory.build({ addedBy: vendor._id }, { generateId: true });

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
      const validBooking = VisitationFactory.build(
        {
          propertyId: property._id,
          userId: user._id,
        },
        { generateId: true },
      );

      it('adds a new scheduled visit', async () => {
        const schedule = await scheduleVisitation(validBooking);
        const currentcountedVisitations = await Visitation.countDocuments({});
        expect(schedule.schedule.propertyId).to.eql(validBooking.propertyId);
        expect(schedule.vendor.email).to.eql(vendor.email);
        expect(currentcountedVisitations).to.eql(countedVisitations + 1);
      });

      context('when new notification is added', () => {
        beforeEach(async () => {
          await scheduleVisitation(validBooking);
        });

        const vendorDescription = `Your propery ${getFormattedName(
          property.name,
        )}, has been scheduled for a visit on ${convertDateToLongHumanFormat(
          new Date(validBooking.visitDate),
        )}`;
        expectNewNotificationToBeAdded(NOTIFICATIONS.SCHEDULE_VISIT_VENDOR, vendor._id, {
          description: vendorDescription,
          actionId: validBooking._id,
        });

        const userDescription = `Your visitation to ${getFormattedName(
          property.name,
        )} has been scheduled for ${convertDateToLongHumanFormat(
          new Date(validBooking.visitDate),
        )}`;
        expectNewNotificationToBeAdded(NOTIFICATIONS.SCHEDULE_VISIT_USER, user._id, {
          description: userDescription,
          actionId: validBooking._id,
        });
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
    const validBooking = VisitationFactory.build({ propertyId: property._id, userId: user._id });

    beforeEach(async () => {
      await scheduleVisitation(validBooking);
      await scheduleVisitation(validBooking);
    });

    context('when schedule added is valid', () => {
      it('returns 2 schedules', async () => {
        const schedule = await getAllVisitations(vendor);
        expect(schedule.result).to.be.an('array');
        expect(schedule.result.length).to.be.eql(2);
      });
    });
    context('when new schedule is added', () => {
      beforeEach(async () => {
        await scheduleVisitation(validBooking);
      });
      it('returns 3 schedules', async () => {
        const schedule = await getAllVisitations(vendor);
        expect(schedule.result).to.be.an('array');
        expect(schedule.result.length).to.be.eql(3);
      });
    });
  });

  describe('#processVisitation', () => {
    const visitation = VisitationFactory.build(
      { propertyId: property._id, userId: user._id },
      { generateId: true },
    );

    const visitationInfo = {
      visitationId: visitation._id,
      visitDate: new Date('2020-11-11'),
      reason: 'Reason',
    };

    context('when a valid data is entered', () => {
      beforeEach(async () => {
        await scheduleVisitation(visitation);
      });

      context('when visitation is rescheduled', () => {
        beforeEach(async () => {
          await processVisitation({
            user: vendor,
            visitationInfo,
            action: PROCESS_VISITATION_ACTION.RESCHEDULE,
          });
        });

        const description = `Your visitation to ${getFormattedName(
          property.name,
        )} for ${convertDateToLongHumanFormat(
          new Date(visitation.visitDate),
        )} has been rescheduled to ${convertDateToLongHumanFormat(visitationInfo.visitDate)}`;

        expectNewNotificationToBeAdded(NOTIFICATIONS.RESCHEDULE_VISIT, user._id, {
          description,
          actionId: visitation._id,
        });
      });

      context('when visitation is cancelled', () => {
        beforeEach(async () => {
          await processVisitation({
            user,
            visitationInfo,
            action: PROCESS_VISITATION_ACTION.CANCEL,
          });
        });

        const description = `Your visitation to ${getFormattedName(
          property.name,
        )} for ${convertDateToLongHumanFormat(new Date(visitation.visitDate))} has been cancelled`;
        expectNewNotificationToBeAdded(NOTIFICATIONS.CANCEL_VISIT, vendor._id, {
          description,
          actionId: visitation._id,
        });
      });
    });
  });
});

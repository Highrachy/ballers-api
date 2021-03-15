import mongoose from 'mongoose';
import { expect, sinon } from '../config';
import {
  getPropertyById,
  addProperty,
  updateProperty,
  deleteProperty,
  getPropertiesWithPaymentPlanId,
  flagProperty,
} from '../../server/services/property.service';
import { addUser } from '../../server/services/user.service';
import PropertyFactory from '../factories/property.factory';
import UserFactory from '../factories/user.factory';
import Property from '../../server/models/property.model';
import { USER_ROLE } from '../../server/helpers/constants';
import ReportedPropertyFactory from '../factories/reportedProperty.factory';
import { getReportById, reportProperty } from '../../server/services/reportedProperty.service';

describe('Property Service', () => {
  const vendor = UserFactory.build({ role: USER_ROLE.VENDOR }, { generateId: true });
  const property = PropertyFactory.build(
    {
      addedBy: vendor._id,
      updatedBy: vendor._id,
      flagged: {
        status: false,
      },
    },
    { generateId: true },
  );

  beforeEach(async () => {
    await addUser(vendor);
  });

  describe('#getPropertyById', () => {
    beforeEach(async () => {
      await addProperty(property);
    });

    it('returns a valid property by Id', async () => {
      const prop = await getPropertyById(property._id);
      expect(prop._id).to.eql(property._id);
    });
  });

  describe('#addProperty', () => {
    let countedProperties;

    beforeEach(async () => {
      countedProperties = await Property.countDocuments({});
    });

    context('when a valid property is entered', () => {
      beforeEach(async () => {
        await addProperty(property);
      });

      it('adds a new property', async () => {
        const currentCountedProperties = await Property.countDocuments({});
        expect(currentCountedProperties).to.eql(countedProperties + 1);
      });
    });

    context('when an invalid data is entered', () => {
      it('throws an error', async () => {
        try {
          const InvalidProperty = PropertyFactory.build({
            name: '',
            addedBy: vendor._id,
            updatedBy: vendor._id,
          });
          await addProperty(InvalidProperty);
        } catch (err) {
          const currentCountedProperties = await Property.countDocuments({});
          expect(err.statusCode).to.eql(400);
          expect(err.error.name).to.be.eql('ValidationError');
          expect(err.message).to.be.eql('Error adding property');
          expect(currentCountedProperties).to.eql(countedProperties);
        }
      });
    });
  });

  describe('#updateProperty', () => {
    const updatedDetails = {
      id: property._id,
      units: 11,
      vendor,
    };
    beforeEach(async () => {
      await addProperty(property);
    });

    context('when property is updated', () => {
      it('returns a valid updated user', async () => {
        const updatedProperty = updateProperty(updatedDetails);
        const prop = getPropertyById(updatedDetails.id);
        expect(prop.units).to.eql(updatedProperty.units);
        expect(prop.description).to.eql(updatedProperty.description);
      });
    });

    context('when getPropertyById fails', () => {
      it('throws an error', async () => {
        sinon.stub(Property, 'findById').throws(new Error('error msg'));
        try {
          await updateProperty(updatedDetails);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error.message).to.be.eql('error msg');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        Property.findById.restore();
      });
    });

    context('when findByIdAndUpdate fails', () => {
      it('throws an error', async () => {
        sinon.stub(Property, 'findByIdAndUpdate').throws(new Error('error msg'));
        try {
          await updateProperty(updatedDetails);
        } catch (err) {
          expect(err.statusCode).to.eql(400);
          expect(err.message).to.be.eql('Error updating property');
        }
        Property.findByIdAndUpdate.restore();
      });
    });
  });

  describe('#deleteProperty', () => {
    beforeEach(async () => {
      await addProperty(property);
    });

    context('when property is deleted', () => {
      it('deletes property', async () => {
        // eslint-disable-next-line no-unused-vars
        const deletedProperty = deleteProperty({ propertyId: property._id, user: vendor });
        const prop = getPropertyById(property._id);
        // eslint-disable-next-line no-unused-expressions
        expect(prop).to.be.empty;
      });
    });

    context('when getPropertyById fails', () => {
      it('throws an error', async () => {
        sinon.stub(Property, 'findById').throws(new Error('error msg'));
        try {
          await deleteProperty({ propertyId: property._id, user: vendor });
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error.message).to.be.eql('error msg');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        Property.findById.restore();
      });
    });

    context('when findByIdAndDelete fails', () => {
      it('throws an error', async () => {
        sinon.stub(Property, 'findByIdAndDelete').throws(new Error('error msg'));
        try {
          await deleteProperty({ propertyId: property._id, user: vendor });
        } catch (err) {
          expect(err.statusCode).to.eql(400);
          expect(err.message).to.be.eql('Error deleting property');
        }
        Property.findByIdAndDelete.restore();
      });
    });
  });

  describe('#getPropertiesWithPaymentPlanId', () => {
    const planId = mongoose.Types.ObjectId();

    beforeEach(async () => {
      await addProperty({ ...property, paymentPlan: [planId] });
    });

    it('returns a valid property by payment plan id', async () => {
      const properties = await getPropertiesWithPaymentPlanId(planId);
      expect(properties[0]._id).to.eql(property._id);
      expect(properties[0].paymentPlan[0]).to.eql(planId);
    });
  });

  describe('#flagProperty', () => {
    const adminId = mongoose.Types.ObjectId();
    const report = ReportedPropertyFactory.build(
      {
        propertyId: property._id,
        reason: 'fraudulent vendor',
        reportedBy: adminId,
        resolved: {
          status: false,
        },
      },
      { generateId: true },
    );

    const propertyInfo = {
      propertyId: property._id,
      reportId: report._id,
      adminId,
      notes: 'dummy note',
    };

    beforeEach(async () => {
      await addProperty(property);
      await reportProperty(report);
    });

    it('returns a flagged prperty', async () => {
      const flaggedProperty = await flagProperty(propertyInfo);
      expect(flaggedProperty.flagged.status).to.eql(true);
      expect(flaggedProperty.flagged.by).to.eql(adminId);

      const resolvedReport = await getReportById(report._id);
      expect(resolvedReport.resolved.status).to.eql(true);
      expect(resolvedReport.resolved.by).to.eql(adminId);
    });
  });
});

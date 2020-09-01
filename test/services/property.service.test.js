import mongoose from 'mongoose';
import { expect, sinon, useDatabase } from '../config';
import {
  getPropertyById,
  addProperty,
  updateProperty,
  deleteProperty,
  getPropertiesWithPaymentPlanId,
} from '../../server/services/property.service';
import PropertyFactory from '../factories/property.factory';
import Property from '../../server/models/property.model';

useDatabase();

describe('Property Service', () => {
  describe('#getPropertyById', () => {
    const _id = mongoose.Types.ObjectId();

    before(async () => {
      await Property.create(PropertyFactory.build({ _id, addedBy: _id, updatedBy: _id }));
    });

    it('returns a valid property by Id', async () => {
      const property = await getPropertyById(_id);
      expect(property._id).to.eql(_id);
    });
  });

  describe('#addProperty', () => {
    let countedProperties;
    const _id = mongoose.Types.ObjectId();
    const property = PropertyFactory.build({ _id, addedBy: _id, updatedBy: _id });

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
          const InvalidProperty = PropertyFactory.build({ name: '' });
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
    const _id = mongoose.Types.ObjectId();
    const updatedDetails = {
      id: _id,
      units: 11,
    };
    before(async () => {
      await Property.create(PropertyFactory.build({ _id, addedBy: _id, updatedBy: _id }));
    });

    context('when property is updated', () => {
      it('returns a valid updated user', async () => {
        const updatedProperty = updateProperty(updatedDetails);
        const property = getPropertyById(updatedDetails.id);
        expect(property.units).to.eql(updatedProperty.units);
        expect(property.description).to.eql(updatedProperty.description);
      });
    });

    context('when getPropertyById fails', () => {
      it('throws an error', async () => {
        sinon.stub(Property, 'findById').throws(new Error('error msg'));
        try {
          await updateProperty(updatedDetails);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
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
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Error updating property');
        }
        Property.findByIdAndUpdate.restore();
      });
    });
  });

  describe('#deleteProperty', () => {
    const _id = mongoose.Types.ObjectId();
    before(async () => {
      await Property.create(PropertyFactory.build({ _id, addedBy: _id, updatedBy: _id }));
    });

    context('when property is deleted', () => {
      it('returns a valid updated user', async () => {
        // eslint-disable-next-line no-unused-vars
        const deletedProperty = deleteProperty(_id);
        const property = getPropertyById(_id);
        // eslint-disable-next-line no-unused-expressions
        expect(property).to.be.empty;
      });
    });

    context('when getPropertyById fails', () => {
      it('throws an error', async () => {
        sinon.stub(Property, 'findById').throws(new Error('error msg'));
        try {
          await deleteProperty(_id);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        Property.findById.restore();
      });
    });

    context('when findByIdAndDelete fails', () => {
      it('throws an error', async () => {
        sinon.stub(Property, 'findByIdAndDelete').throws(new Error('error msg'));
        try {
          await deleteProperty(_id);
        } catch (err) {
          expect(err.statusCode).to.eql(400);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Error deleting property');
        }
        Property.findByIdAndDelete.restore();
      });
    });
  });

  describe('#getPropertiesWithPaymentPlanId', () => {
    const _id = mongoose.Types.ObjectId();
    const planId = mongoose.Types.ObjectId();

    before(async () => {
      await Property.create(
        PropertyFactory.build({ _id, addedBy: _id, updatedBy: _id, paymentPlan: [planId] }),
      );
    });

    it('returns a valid property by payment plan id', async () => {
      const properties = await getPropertiesWithPaymentPlanId(planId);
      expect(properties[0]._id).to.eql(_id);
      expect(properties[0].paymentPlan[0]).to.eql(planId);
    });
  });
});

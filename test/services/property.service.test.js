import mongoose from 'mongoose';
import { expect, useDatabase } from '../config';
import {
  getPropertyById,
  addProperty,
  //   updateProperty,
  //   deleteProperty,
  //   getAllProperties,
} from '../../server/services/property.service';
import PropertyFactory from '../factories/property.factory';
import Property from '../../server/models/property.model';

useDatabase();

describe('Property Service', () => {
  describe('#getPropertyById', () => {
    const _id = mongoose.Types.ObjectId();

    before(async () => {
      await Property.create(PropertyFactory.build({ _id }));
    });

    it('returns a valid property by Id', async () => {
      const property = await getPropertyById(_id);
      expect(property._id).to.eql(_id);
    });
  });

  describe('#addProperty', () => {
    let countedProperties;
    const property = PropertyFactory.build();

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
});

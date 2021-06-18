// eslint-disable-next-line import/no-extraneous-dependencies
import faker from 'faker';
import PropertyFactory from '../test/factories/property.factory';
import AddressFactory from '../test/factories/address.factory';
import UserFactory from '../test/factories/user.factory';
import Property from '../server/models/property.model';
import User from '../server/models/user.model';
import { USER_ROLE } from '../server/helpers/constants';
import { logLoading, logError, logTable } from './seed-helpers';

const seedProperties = async (limit, customValues = {}) => {
  let vendor;

  [vendor] = await User.find({ role: USER_ROLE.VENDOR }).sort({ _id: -1 }).limit(1);

  if (!vendor) {
    vendor = UserFactory.build(
      { email: faker.internet.email(), role: USER_ROLE.VENDOR, activated: true },
      { generateId: true },
    );

    try {
      await User.create(vendor);
    } catch (error) {
      logError(error);
    }
  }

  const properties = [...new Array(parseInt(limit, 10))].map(() =>
    PropertyFactory.build({
      address: AddressFactory.build({
        city: faker.address.city(),
        country: faker.address.country(),
        state: faker.address.state(),
        street1: faker.address.streetName(),
        street2: faker.address.streetName(),
      }),
      flagged: { status: false, requestUnflag: false },
      approved: { status: true },
      addedBy: vendor._id,
      bathrooms: Math.floor(Math.random() * 5),
      bedrooms: Math.floor(Math.random() * 5),
      features: ['swimming pool', 'tiled roads', 'electricity'],
      houseType: 'penthouse apartment',
      name: 'penthouse apartment',
      price: 10_000_000,
      toilets: Math.floor(Math.random() * 5),
      units: Math.floor(Math.random() * 10),
      ...customValues,
    }),
  );

  try {
    await Property.insertMany(properties);
    logLoading(`${limit} ${parseInt(limit, 10) === 1 ? 'property' : 'properties'} created`);

    const table = [{ vendorEmail: vendor.email, noOfProperties: limit }];
    logTable(table);
  } catch (error) {
    logError(error);
  }
};

export default seedProperties;
